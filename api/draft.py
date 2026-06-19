"""
Stride — /api/draft
Calls the NVIDIA NIM API to generate a LinkedIn post draft.

Model: configurable via NVIDIA_MODEL env var.
  Default: nvidia/llama-3.1-nemotron-70b-instruct (generative instruction model).
  The "nemotron-3-content-safety" model is a safety *classifier*, not a generator;
  use a nemotron or llama instruct model here instead.

Required env var: NVIDIA_API_KEY
Optional env var: NVIDIA_MODEL
"""

import json
import os
from http.server import BaseHTTPRequestHandler

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

        api_key = os.environ.get("NVIDIA_API_KEY")
        if not api_key:
            return self._json(500, {"ok": False, "error": "NVIDIA_API_KEY is not configured on the server"})

        model = os.environ.get("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")

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
            from openai import OpenAI  # imported here so cold-start is fast if key is missing
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=api_key,
            )
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user_msg},
                ],
                temperature=0.7,
                max_tokens=600,
            )
            draft = response.choices[0].message.content.strip()
            return self._json(200, {"ok": True, "draft": draft})

        except Exception as exc:
            # Surface the raw error so it's diagnosable during development.
            return self._json(500, {"ok": False, "error": str(exc)})

    # ── helpers ──────────────────────────────────────────────────────────

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
        pass  # silence default access log
