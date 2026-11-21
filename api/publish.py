"""
Stride — /api/publish
Posts to LinkedIn using the LinkedIn REST API v2.

The caller MUST supply the user's LinkedIn access token in the request body
as `linkedInToken`. The backend derives the person URN from /v2/userinfo so
that each post goes to the correct user's profile.

Falls back to env vars LINKEDIN_ACCESS_TOKEN / LINKEDIN_PERSON_URN only when
`linkedInToken` is absent (e.g. local dev / server-side testing).

Required env var for fallback:
  LINKEDIN_ACCESS_TOKEN   — 3-legged OAuth token
  LINKEDIN_PERSON_URN     — e.g. "urn:li:person:AbCdEfGhIj"
  LINKEDIN_API_VERSION    — e.g. "202606"
"""

import base64
import json
import os
import requests
from http.server import BaseHTTPRequestHandler

_LI_BASE    = "https://api.linkedin.com/rest"
_LI_USERINFO = "https://api.linkedin.com/v2/userinfo"


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length > 0 else b"{}"
            body = json.loads(raw)
        except (ValueError, json.JSONDecodeError) as exc:
            return self._json(400, {"ok": False, "error": f"Invalid JSON: {exc}"})

        text       = (body.get("text") or "").strip()
        image_b64  = body.get("imageBase64")
        alt_text   = (body.get("altText") or "").strip()
        li_token   = (body.get("linkedInToken") or "").strip()

        if not text:
            return self._json(400, {"ok": False, "error": "text is required"})

        api_version = os.environ.get("LINKEDIN_API_VERSION", "202606")

        # Resolve token and person URN — per-user path preferred
        if li_token:
            token = li_token
            try:
                person_urn = self._get_person_urn(token, api_version)
            except requests.HTTPError as exc:
                if exc.response is not None and exc.response.status_code == 401:
                    return self._json(401, {"ok": False, "error": "REVOKED_TOKEN"})
                code   = exc.response.status_code if exc.response is not None else 0
                detail = exc.response.text[:200]   if exc.response is not None else str(exc)
                return self._json(502, {"ok": False, "error": f"LinkedIn userinfo {code}: {detail}"})
            except Exception as exc:
                return self._json(500, {"ok": False, "error": str(exc)})
        else:
            # Fallback: env-var credentials (dev/testing only)
            token      = os.environ.get("LINKEDIN_ACCESS_TOKEN")
            person_urn = os.environ.get("LINKEDIN_PERSON_URN")
            if not token:
                return self._json(500, {"ok": False, "error": "LINKEDIN_ACCESS_TOKEN is not configured"})
            if not person_urn:
                return self._json(500, {"ok": False, "error": "LINKEDIN_PERSON_URN is not configured"})

        li_headers = {
            "Authorization":             f"Bearer {token}",
            "LinkedIn-Version":          api_version,
            "Content-Type":              "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        try:
            image_urn = None
            if image_b64:
                image_urn = self._upload_image(li_headers, person_urn, image_b64, alt_text)

            post_body = self._build_post(person_urn, text, image_urn, alt_text)
            resp = requests.post(f"{_LI_BASE}/posts", headers=li_headers, json=post_body, timeout=20)
            resp.raise_for_status()

            post_id  = resp.headers.get("x-restli-id") or resp.headers.get("X-RestLi-Id") or ""
            post_url = f"https://www.linkedin.com/feed/update/{post_id}" if post_id else ""
            return self._json(201, {"ok": True, "postId": post_id, "postUrl": post_url})

        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 401:
                return self._json(401, {"ok": False, "error": "REVOKED_TOKEN"})
            code   = exc.response.status_code if exc.response is not None else 0
            detail = exc.response.text[:200]   if exc.response is not None else str(exc)
            return self._json(502, {"ok": False, "error": f"LinkedIn API error ({code})"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    # ── helpers ───────────────────────────────────────────────────────────────

    def _get_person_urn(self, token: str, api_version: str) -> str:
        """Call /v2/userinfo and return the person URN for this token."""
        resp = requests.get(
            _LI_USERINFO,
            headers={
                "Authorization":    f"Bearer {token}",
                "LinkedIn-Version": api_version,
            },
            timeout=10,
        )
        resp.raise_for_status()
        sub = resp.json().get("sub", "")
        if not sub:
            raise ValueError("LinkedIn userinfo returned no sub claim")
        return f"urn:li:person:{sub}"

    def _upload_image(self, li_headers: dict, person_urn: str, image_b64: str, alt_text: str) -> str:
        """Initialize LinkedIn image upload, PUT bytes, return image URN."""
        init = requests.post(
            f"{_LI_BASE}/images?action=initializeUpload",
            headers=li_headers,
            json={"initializeUploadRequest": {"owner": person_urn}},
            timeout=15,
        )
        init.raise_for_status()
        value      = init.json().get("value", {})
        upload_url = value["uploadUrl"]
        image_urn  = value["image"]

        image_bytes = base64.b64decode(image_b64)
        put = requests.put(
            upload_url,
            data=image_bytes,
            headers={"Content-Type": "application/octet-stream"},
            timeout=30,
        )
        put.raise_for_status()
        return image_urn

    def _build_post(self, person_urn: str, text: str, image_urn: str | None, alt_text: str) -> dict:
        body: dict = {
            "author":       person_urn,
            "commentary":   text,
            "visibility":   "PUBLIC",
            "distribution": {
                "feedDistribution":              "MAIN_FEED",
                "targetEntities":                [],
                "thirdPartyDistributionChannels": [],
            },
            "lifecycleState":            "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }
        if image_urn:
            body["content"] = {
                "media": {
                    "altText": alt_text or text[:125],
                    "id":      image_urn,
                }
            }
        return body

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def _json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self._send_cors()
        self.send_header("Content-Type",   "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass
