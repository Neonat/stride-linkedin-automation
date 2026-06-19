"""
Stride — /api/draft
Generates a LinkedIn post draft using NVIDIA NIM (Gemma instruct model).

Required env vars:
  NVIDIA_API_CHAT_KEY   — Bearer key for the chat/instruct model
  NVIDIA_CHAT_MODEL     — model name, default "google/gemma-4-31b-it"
"""

import json
import os
import requests
from http.server import BaseHTTPRequestHandler

_NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
_DEFAULT_MODEL = "google/gemma-4-31b-it"

SYSTEM_PROMPT = """\
You write LinkedIn posts for early-career professionals. Follow every rule below exactly.

STRUCTURE (in order):
1. Hook — use the provided hook as the opening line (you may adjust punctuation slightly).
2. Story — 2-3 short paragraphs built only from the provided bullets. No invented facts.
3. Takeaway — one punchy insight the reader walks away with.
4. CTA — one short line asking the reader to do the specified action.
5. Final attribution — one line: // {pillar}

VOICE & STYLE:
- Sound like a person, not a press release. Direct, specific, personal.
- No em dashes (—). Use commas, colons, or new sentences instead.
- No buzzwords: no "excited to announce", "thrilled", "game-changer", "leverage", "synergy", "delighted".
- No generic filler phrases.
- Tone: {tone}.
- Under 280 words total.
- Output only the post text. No preamble, no quotes around the output, no extra commentary.\
"""


def _nim_chat(api_key: str, model: str, messages: list, temperature: float = 0.7, max_tokens: int = 600) -> str:
    resp = requests.post(
        _NIM_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._send_cors()
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length > 0 else b"{}"
            body = json.loads(raw)
        except (ValueError, json.JSONDecodeError) as exc:
            return self._json(400, {"ok": False, "error": f"Invalid JSON: {exc}"})

        hook = (body.get("hook") or "").strip()
        raw_bullets = body.get("storyBullets") or []
        story_bullets = [str(b).strip() for b in raw_bullets if str(b).strip()]
        cta = (body.get("cta") or "Follow").strip()
        tone = (body.get("tone") or "Direct").strip()
        pillar = (body.get("pillar") or "Community").strip()

        if not hook:
            return self._json(400, {"ok": False, "error": "hook is required"})
        if not story_bullets:
            return self._json(400, {"ok": False, "error": "storyBullets must have at least one item"})

        api_key = os.environ.get("NVIDIA_API_CHAT_KEY")
        if not api_key:
            return self._json(500, {"ok": False, "error": "NVIDIA_API_CHAT_KEY is not configured"})

        model = os.environ.get("NVIDIA_CHAT_MODEL", _DEFAULT_MODEL)

        bullets_fmt = "\n".join(f"- {b}" for b in story_bullets)
        system = SYSTEM_PROMPT.replace("{pillar}", pillar).replace("{tone}", tone)
        user_msg = (
            f"Hook:\n{hook}\n\n"
            f"Story bullets (use only these facts):\n{bullets_fmt}\n\n"
            f"CTA action: {cta}\n"
            f"Tone: {tone}\n"
            f"Pillar: {pillar}\n\n"
            "Write the post now."
        )

        try:
            draft = _nim_chat(api_key, model, [
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ])
            return self._json(200, {"ok": True, "draft": draft})
        except requests.HTTPError as exc:
            code = exc.response.status_code if exc.response is not None else 0
            detail = exc.response.text[:200] if exc.response is not None else str(exc)
            return self._json(502, {"ok": False, "error": f"NVIDIA API {code}: {detail}"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
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
