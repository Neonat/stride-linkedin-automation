"""
Stride — /api/health
GET → checks that each integration can authenticate.
Returns { agnes, nemotron, linkedin, supabase, google_calendar } — ok/fail per service.
NEVER returns secret values or key material in the response.
"""

import json
import os
import sys
import requests
from http.server import BaseHTTPRequestHandler

_AGNES_URL            = "https://apihub.agnes-ai.com/v1/chat/completions"
_DEFAULT_AGNES_MODEL  = "agnes-2.0-flash"
_NIM_URL              = "https://integrate.api.nvidia.com/v1/chat/completions"
_DEFAULT_SAFETY_MODEL = "nvidia/nemotron-3-content-safety"


def _try_agnes_key(api_key: str, model: str, timeout: int = 15) -> dict:
    """Attempt a single Agnes key. Returns result dict."""
    try:
        resp = requests.post(
            _AGNES_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5},
            timeout=timeout,
        )
        if resp.status_code in (200, 201):
            return {"ok": True, "model": model}
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text[:200]
        return {"ok": False, "error": f"HTTP {resp.status_code}", "detail": detail}
    except requests.exceptions.Timeout:
        return {"ok": False, "error": "Timeout after 15s"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def _check_agnes() -> dict:
    model = os.environ.get("AGNES_MODEL", _DEFAULT_AGNES_MODEL)

    primary_key = os.environ.get("AGNES_AI_TOKEN")
    backup_key  = os.environ.get("AGNES_AI_TOKEN_2")

    if not primary_key and not backup_key:
        return {"ok": False, "error": "No Agnes keys set (AGNES_AI_TOKEN, AGNES_AI_TOKEN_2)"}

    # Always test primary
    if primary_key:
        primary_result = _try_agnes_key(primary_key, model, timeout=5)
        primary_status = "ok" if primary_result["ok"] else primary_result.get("error", "failed")
    else:
        primary_result = {"ok": False}
        primary_status = "AGNES_AI_TOKEN not set"

    # Always test backup
    if backup_key:
        backup_result = _try_agnes_key(backup_key, model)
        backup_status = "ok" if backup_result["ok"] else backup_result.get("error", "failed")
    else:
        backup_result = {"ok": False}
        backup_status = "AGNES_AI_TOKEN_2 not set"

    # Overall ok if either key works
    overall_ok = primary_result["ok"] or backup_result["ok"]

    return {
        "ok":     overall_ok,
        "model":  model,
        "primary": "AGNES_AI_TOKEN",
        "primary_status": primary_status,
        "backup":  "AGNES_AI_TOKEN_2",
        "backup_status":  backup_status,
    }


def _check_nemotron() -> dict:
    api_key = os.environ.get("NVIDIA_API_SAFETY_KEY")
    if not api_key:
        return {"ok": False, "error": "NVIDIA_API_SAFETY_KEY not set"}
    model = os.environ.get("NVIDIA_SAFETY_MODEL", _DEFAULT_SAFETY_MODEL)
    try:
        resp = requests.post(
            _NIM_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": [{"role": "user", "content": "hello"}], "max_tokens": 5},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return {"ok": True, "model": model}
        return {"ok": False, "error": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"ok": False, "error": type(exc).__name__}


def _check_linkedin() -> dict:
    token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    if not token:
        return {"ok": False, "error": "LINKEDIN_ACCESS_TOKEN not set"}
    try:
        resp = requests.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            return {"ok": True}
        return {"ok": False, "error": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"ok": False, "error": type(exc).__name__}


def _check_supabase() -> dict:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    missing = [v for v, val in [("SUPABASE_URL", url), ("SUPABASE_SERVICE_ROLE_KEY", key)] if not val]
    if missing:
        return {"ok": False, "error": f"{', '.join(missing)} not set"}
    try:
        from supabase import create_client
        db = create_client(url, key)
        db.table("users").select("id").limit(1).execute()
        return {"ok": True}
    except Exception as exc:
        return {"ok": False, "error": type(exc).__name__}


def _check_google_calendar(request_headers: dict) -> dict:
    token = request_headers.get("X-Google-Token") or request_headers.get("x-google-token")
    if not token:
        return {"ok": False, "error": "X-Google-Token header not provided"}

    try:
        # 1. Check token info — expiry + scopes
        token_resp = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?access_token={token}",
            timeout=10,
        )
        if token_resp.status_code == 400:
            return {"ok": False, "error": "Token invalid or expired — user must reconnect Google"}

        token_info = token_resp.json()
        expires_in = int(token_info.get("expires_in", 0))
        scopes     = token_info.get("scope", "")
        email      = token_info.get("email", "unknown")
        has_calendar_scope = "calendar" in scopes

        # 2. Fetch calendar list
        cal_resp = requests.get(
            "https://www.googleapis.com/calendar/v3/calendarList?maxResults=10",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if cal_resp.status_code != 200:
            return {"ok": False, "error": f"Calendar API returned HTTP {cal_resp.status_code}"}

        calendars = cal_resp.json().get("items", [])

        return {
            "ok":                 True,
            "account":            email,
            "calendars_found":    len(calendars),
            "calendar_names":     [c.get("summary", "unnamed") for c in calendars],
            "has_calendar_scope": has_calendar_scope,
            "token_expires_in":   f"{expires_in}s" if expires_in > 0 else "unknown",
            "token_expiring_soon": expires_in < 300,  # warn if under 5 mins
        }

    except Exception as exc:
        return {"ok": False, "error": type(exc).__name__}

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        results = {
            "agnes":            _check_agnes(),
            "nemotron":         _check_nemotron(),
            "linkedin":         _check_linkedin(),
            "supabase":         _check_supabase(),
            "google_calendar":  _check_google_calendar(dict(self.headers)),
        }
        all_ok = all(v.get("ok") for v in results.values())
        return self._json(200 if all_ok else 207, results)

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Google-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")

    def _json(self, status: int, data: dict):
        body = json.dumps(data, indent=2).encode()
        self.send_response(status)
        self._send_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass