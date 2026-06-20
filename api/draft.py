"""
Stride — /api/draft
Generates a LinkedIn post draft using Agnes AI.

Persona context (tone, pillars, evidence) is pulled from the personas table
and injected into the prompt so drafts sound like the user and can reference
real moments.

Required env vars:
  AGNES_AI_TOKEN  — Bearer key for Agnes AI
  AGNES_MODEL     — model name, default "agnes-2.0-flash"
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — for persona lookup
"""

import json
import os
import sys
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler
from _auth import require_user

_AGNES_URL     = "https://apihub.agnes-ai.com/v1/chat/completions"
_DEFAULT_MODEL = "agnes-2.0-flash"
_DEMO_USER_ID  = "demo-user"

_SYSTEM_TEMPLATE = """\
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
- Output only the post text. No preamble, no quotes around the output, no extra commentary.

{persona_context}\
"""

_PERSONA_CONTEXT_TMPL = """\

ABOUT THE AUTHOR (use this to match their voice; never invent facts outside the bullets):
- Who they are: {persona_summary}
- Positioning: {positioning}
- Evidence you may reference if it fits naturally: {evidence}\
"""


def _agnes_chat(api_key: str, model: str, messages: list, temperature: float = 0.7, max_tokens: int = 600) -> str:
    resp = requests.post(
        _AGNES_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def _get_user_id(headers: dict) -> str:
    try:
        user = require_user(headers)
        return user["id"]
    except Exception:
        return _DEMO_USER_ID


def _load_persona(user_id: str) -> dict | None:
    try:
        from _db import get_db
        db = get_db()
        result = (
            db.table("personas")
            .select("persona_summary,positioning,tone,evidence,pillars")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return result.data
    except Exception:
        return None


class handler(StrideHandler):

    def do_POST(self):
        body = self._read_body()

        hook          = (body.get("hook")      or "").strip()
        raw_bullets   = body.get("storyBullets") or []
        story_bullets = [str(b).strip() for b in raw_bullets if str(b).strip()]
        cta           = (body.get("cta")       or "Follow").strip()
        pillar        = (body.get("pillar")    or "Community").strip()

        if not hook:
            return self._json(400, {"ok": False, "error": "hook is required"})
        if not story_bullets:
            return self._json(400, {"ok": False, "error": "storyBullets must have at least one item"})

        api_key = os.environ.get("AGNES_AI_TOKEN")
        if not api_key:
            return self._json(500, {"ok": False, "error": "AGNES_AI_TOKEN is not configured"})

        model = os.environ.get("AGNES_MODEL", _DEFAULT_MODEL)

        # Pull persona for tone + voice context
        user_id = _get_user_id(dict(self.headers))
        persona = _load_persona(user_id)

        # Tone: prefer persona DB value, fall back to request body, then default
        tone = (body.get("tone") or "").strip()
        if not tone and persona:
            tone = persona.get("tone", "")
        if not tone:
            tone = "Direct"

        # Build persona context block (injected into system prompt)
        persona_ctx = ""
        if persona:
            evidence = persona.get("evidence") or []
            if isinstance(evidence, str):
                try: evidence = json.loads(evidence)
                except Exception: evidence = []
            evidence_str = "; ".join(str(e) for e in evidence[:6]) if evidence else "none provided"
            persona_ctx = _PERSONA_CONTEXT_TMPL.format(
                persona_summary = persona.get("persona_summary", ""),
                positioning     = persona.get("positioning",     ""),
                evidence        = evidence_str,
            )

        system = _SYSTEM_TEMPLATE.format(
            pillar         = pillar,
            tone           = tone,
            persona_context = persona_ctx,
        )

        bullets_fmt = "\n".join(f"- {b}" for b in story_bullets)
        user_msg = (
            f"Hook:\n{hook}\n\n"
            f"Story bullets (use only these facts):\n{bullets_fmt}\n\n"
            f"CTA action: {cta}\n"
            f"Tone: {tone}\n"
            f"Pillar: {pillar}\n\n"
            "Write the post now."
        )

        try:
            draft = _agnes_chat(api_key, model, [
                {"role": "system", "content": system},
                {"role": "user",   "content": user_msg},
            ])
            return self._json(200, {"ok": True, "draft": draft})
        except requests.HTTPError as exc:
            code   = exc.response.status_code if exc.response is not None else 0
            detail = exc.response.text[:200]   if exc.response is not None else str(exc)
            return self._json(502, {"ok": False, "error": f"Agnes AI {code}: {detail}"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})
