"""
Stride — /api/safety_check
Runs NVIDIA Nemotron content-safety classifier before publishing.
Uses NVIDIA_API_SAFETY_KEY (never cross with the chat key).

Required env vars:
  NVIDIA_API_SAFETY_KEY   — Bearer key for the safety model
  NVIDIA_SAFETY_MODEL     — "nvidia/nemotron-3-content-safety"
"""

import json
import os
import requests
from http.server import BaseHTTPRequestHandler

_NIM_URL             = "https://integrate.api.nvidia.com/v1/chat/completions"
_DEFAULT_SAFETY_MODEL = "nvidia/nemotron-3-content-safety"

# Llama-Guard / Nemotron content-safety category labels
_CATEGORY_LABELS = {
    "S1":  "Violent Crimes",
    "S2":  "Non-Violent Crimes",
    "S3":  "Sex Crimes",
    "S4":  "Child Exploitation",
    "S5":  "Defamation",
    "S6":  "Specialized Advice",
    "S7":  "Privacy",
    "S8":  "Intellectual Property",
    "S9":  "Indiscriminate Weapons",
    "S10": "Hate",
    "S11": "Self-Harm",
    "S12": "Sexual Content",
    "S13": "Elections",
}


def _parse_verdict(content: str) -> dict:
    """
    Parse the safety model's output.
    Formats:
      "safe"
      "unsafe\nS1,S4"
    """
    lines = content.strip().split("\n")
    verdict = lines[0].strip().lower()
    if verdict == "safe":
        return {"safe": True, "categories": []}

    categories = []
    if len(lines) > 1:
        for code in lines[1].strip().split(","):
            code = code.strip().upper()
            if code:
                categories.append({
                    "code":  code,
                    "label": _CATEGORY_LABELS.get(code, code),
                })
    return {"safe": False, "categories": categories}


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

        text     = (body.get("text") or "").strip()
        image_b64 = body.get("image")  # optional base64 string

        if not text:
            return self._json(400, {"ok": False, "error": "text is required"})

        api_key = os.environ.get("NVIDIA_API_SAFETY_KEY")
        if not api_key:
            return self._json(500, {"ok": False, "error": "NVIDIA_API_SAFETY_KEY is not configured"})

        model = os.environ.get("NVIDIA_SAFETY_MODEL", _DEFAULT_SAFETY_MODEL)

        # Build content — text only, or text + image
        if image_b64:
            user_content = [
                {"type": "text",      "text": text},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
            ]
        else:
            user_content = text

        try:
            resp = requests.post(
                _NIM_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model":    model,
                    "messages": [{"role": "user", "content": user_content}],
                    "max_tokens": 50,
                    "temperature": 0,
                },
                timeout=20,
            )
            resp.raise_for_status()
            raw_content = resp.json()["choices"][0]["message"]["content"]
            verdict = _parse_verdict(raw_content)
            return self._json(200, {"ok": True, **verdict})

        except requests.HTTPError as exc:
            code = exc.response.status_code if exc.response is not None else 0
            return self._json(502, {"ok": False, "error": f"Safety API HTTP {code}"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def _json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self._send_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass
