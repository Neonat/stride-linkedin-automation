"""
Stride — /api/health
GET → checks that each integration can authenticate.
Returns { gemma, nemotron, linkedin, supabase } — ok/fail per service.
NEVER returns secret values or key material in the response.
"""

import json
import os
import sys
import requests
from http.server import BaseHTTPRequestHandler

_NIM_URL              = "https://integrate.api.nvidia.com/v1/chat/completions"
_DEFAULT_CHAT_MODEL   = "google/gemma-4-31b-it"
_DEFAULT_SAFETY_MODEL = "nvidia/nemotron-3-content-safety"


def _check_gemma() -> dict:
    api_key = os.environ.get("NVIDIA_API_CHAT_KEY")
    if not api_key:
        return {"ok": False, "error": "NVIDIA_API_CHAT_KEY not set"}
    model = os.environ.get("NVIDIA_CHAT_MODEL", _DEFAULT_CHAT_MODEL)
    try:
        resp = requests.post(
            _NIM_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            # Minimal ping: single-word prompt, tiny output, no thinking mode
            json={"model": model, "messages": [{"role": "user", "content": "Hi"}], "max_tokens": 5},
            timeout=25,  # NIM can be slow on cold start; 25s is enough to detect auth vs timeout
        )
        if resp.status_code in (200, 201):
            return {"ok": True, "model": model}
        # Surface the actual error body so a wrong model name is diagnosable
        try:
            detail = resp.json()
        except Exception:
            detail = resp.text[:200]
        return {"ok": False, "error": f"HTTP {resp.status_code}", "detail": detail}
    except requests.exceptions.Timeout:
        return {"ok": False, "error": "Timeout after 25s — NIM may be cold-starting, retry in 30s"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


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
    token   = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    version = os.environ.get("LINKEDIN_API_VERSION", "202606")
    if not token:
        return {"ok": False, "error": "LINKEDIN_ACCESS_TOKEN not set"}
    try:
        resp = requests.get(
            "https://api.linkedin.com/rest/me",
            headers={
                "Authorization":             f"Bearer {token}",
                "LinkedIn-Version":          version,
                "X-Restli-Protocol-Version": "2.0.0",
            },
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


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._send_cors()
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        results = {
            "gemma":    _check_gemma(),
            "nemotron": _check_nemotron(),
            "linkedin": _check_linkedin(),
            "supabase": _check_supabase(),
        }
        all_ok = all(v.get("ok") for v in results.values())
        return self._json(200 if all_ok else 207, results)

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
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
