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


def _try_agnes_key(api_key: str, model: str) -> dict:
    """Attempt a single Agnes key. Returns result dict."""
    try:
        resp = requests.post(
            _AGNES_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": model, "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5},
            timeout=15,
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

    if primary_key:
        result = _try_agnes_key(primary_key, model)
        if result["ok"]:
            return {**result, "key_used": "AGNES_AI_TOKEN"}
        # Primary failed — note it and try backup
        primary_error = result.get("error")
    else:
        primary_error = "AGNES_AI_TOKEN not set"

    if backup_key:
        result = _try_agnes_key(backup_key, model)
        if result["ok"]:
            return {**result, "key_used": "AGNES_AI_TOKEN_2", "primary_error": primary_error}
        return {
            "ok": False,
            "error": "Both keys failed",
            "primary_error": primary_error,
            "backup_error": result.get("error"),
        }

    return {"ok": False, "error": primary_error}


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
    """
    Checks the Google Calendar API using the provider_token passed
    from the frontend as 'X-Google-Token'.
    The token is obtained from supabase.auth.getSession().session.provider_token
    on the client side and sent in the request header.
    """
    token = request_headers.get("X-Google-Token") or request_headers.get("x-google-token")
    if not token:
        return {"ok": False, "error": "X-Google-Token header not provided"}
    try:
        resp = requests.get(
            "https://www.googleapis.com/calendar/v3/calendarList?maxResults=1",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            return {"ok": True}
        if resp.status_code == 401:
            return {"ok": False, "error": "Token expired or invalid — user must reconnect Google"}
        return {"ok": False, "error": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"ok": False, "error": type(exc).__name__}


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._send_cors()
        self.send_response(204)
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