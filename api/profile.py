"""
Stride — /api/profile

GET  → fetch saved user profile from DB (requires auth)
POST → two modes, detected from request body:
  • body has "role" key  → call Agnes AI to generate onboarding profile card
                           returns { ok, persona, positioning, pillarNote }
  • body has "display_name" key → upsert profile to DB (Connect screen setup)
                           returns { ok, profile }
"""
import json
import os
import sys
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler
from _auth    import require_user
from _db      import get_db

_AGNES_URL     = "https://apihub.agnes-ai.com/v1/chat/completions"
_DEFAULT_MODEL = "agnes-2.0-flash"

_MAX_NAME_LEN     = 80
_MAX_HEADLINE_LEN = 160

_PROFILE_SYSTEM = """\
You create concise LinkedIn positioning statements for early-career professionals.

Return ONLY a valid JSON object with exactly these three keys:
- "persona": one short sentence describing who this person is (e.g. "Final-year CS student building in AI")
- "positioning": 2-3 sentences on what value they bring and why people should follow them. No buzzwords, no em dashes.
- "pillarNote": one sentence on what topics they will post about based on their pillars.

No preamble, no markdown, no code fences. Output only the raw JSON object.\
"""


def _generate_profile_card(role: str, field: str, wants: list, tone: str, pillars: list) -> dict:
    api_key = os.environ.get("AGNES_AI_TOKEN")
    if not api_key:
        raise ValueError("AGNES_AI_TOKEN is not configured")

    model = os.environ.get("AGNES_MODEL", _DEFAULT_MODEL)
    wants_str   = ", ".join(wants)   if wants   else "general growth"
    pillars_str = ", ".join(pillars) if pillars else "Professional"

    user_msg = (
        f"Role: {role}\n"
        f"Field: {field}\n"
        f"Wants: {wants_str}\n"
        f"Tone: {tone}\n"
        f"Pillars: {pillars_str}\n\n"
        "Generate the profile card."
    )

    resp = requests.post(
        _AGNES_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": _PROFILE_SYSTEM},
                {"role": "user",   "content": user_msg},
            ],
            "temperature": 0.6,
            "max_tokens": 400,
        },
        timeout=30,
    )
    resp.raise_for_status()
    raw = resp.json()["choices"][0]["message"]["content"].strip()

    # Strip any accidental code fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    return json.loads(raw)


class handler(StrideHandler):

    def do_GET(self):
        try:
            user = require_user(dict(self.headers))
        except ValueError as exc:
            return self._json(401, {"ok": False, "error": str(exc)})

        try:
            db = get_db()
            result = (
                db.table("users")
                .select("*")
                .eq("id", user["id"])
                .maybe_single()
                .execute()
            )
            if result.data:
                return self._json(200, {"ok": True, "profile": result.data})
            return self._json(404, {"ok": False, "error": "Profile not found. Complete setup first."})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def do_POST(self):
        body = self._read_body()

        # ── Mode 1: AI profile card generation (onboarding) ──────────────────
        if "role" in body:
            role    = (body.get("role")    or "Student").strip()
            field   = (body.get("field")   or "Technology").strip()
            wants   = body.get("wants")   or []
            tone    = (body.get("tone")    or "Direct").strip()
            pillars = body.get("pillars") or []

            if isinstance(wants, str):
                wants = [w.strip() for w in wants.split(",") if w.strip()]
            if isinstance(pillars, str):
                pillars = [p.strip() for p in pillars.split(",") if p.strip()]

            try:
                card = _generate_profile_card(role, field, wants, tone, pillars)
                return self._json(200, {
                    "ok":          True,
                    "persona":     card.get("persona", ""),
                    "positioning": card.get("positioning", ""),
                    "pillarNote":  card.get("pillarNote", ""),
                })
            except json.JSONDecodeError:
                return self._json(502, {"ok": False, "error": "Model returned unparseable JSON — retry"})
            except requests.HTTPError as exc:
                code = exc.response.status_code if exc.response is not None else 0
                detail = exc.response.text[:200] if exc.response is not None else str(exc)
                return self._json(502, {"ok": False, "error": f"Agnes AI {code}: {detail}"})
            except ValueError as exc:
                return self._json(500, {"ok": False, "error": str(exc)})
            except Exception as exc:
                return self._json(500, {"ok": False, "error": str(exc)})

        # ── Mode 2: Save profile to DB (Connect screen setup) ─────────────────
        try:
            user = require_user(dict(self.headers))
        except ValueError as exc:
            return self._json(401, {"ok": False, "error": str(exc)})

        display_name = (body.get("display_name") or "").strip()[:_MAX_NAME_LEN]
        headline     = (body.get("headline")     or "").strip()[:_MAX_HEADLINE_LEN]
        collab_disc  = bool(body.get("collab_discoverable", True))

        if not display_name:
            return self._json(400, {"ok": False, "error": "display_name is required"})

        try:
            db = get_db()
            row = {
                "id":                  user["id"],
                "display_name":        display_name,
                "headline":            headline,
                "collab_discoverable": collab_disc,
            }
            result = db.table("users").upsert(row).execute()
            saved = result.data[0] if result.data else row
            return self._json(200, {"ok": True, "profile": saved})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})
