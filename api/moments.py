"""
Stride — /api/moments

POST → save a captured moment, then trigger a persona refresh.
GET  → list recent moments for the current user.

Returns (POST): { ok, moment: <row>, persona: <updated-persona>, whatChanged }
Returns (GET):  { ok, moments: [] }
"""
import json
import os
import sys
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler
from _auth import require_user
from _db import get_db

_DEMO_USER_ID = "demo-user"

_MAX_TITLE_LEN   = 200
_MAX_BULLETS     = 10
_MAX_BULLET_LEN  = 400
_VALID_KINDS     = {"experience", "win", "lesson", "project", "talk"}
_VALID_PILLARS   = {"Technical", "Leadership", "Community", "Creative", "Research"}


def _get_user_id(headers: dict) -> str:
    try:
        user = require_user(headers)
        return user["id"]
    except Exception:
        return _DEMO_USER_ID


class handler(StrideHandler):

    def do_GET(self):
        user_id = _get_user_id(dict(self.headers))
        try:
            db = get_db()
            result = (
                db.table("moments")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
            return self._json(200, {"ok": True, "moments": result.data or []})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def do_POST(self):
        body    = self._read_body()
        user_id = _get_user_id(dict(self.headers))

        title       = (body.get("title")      or "").strip()[:_MAX_TITLE_LEN]
        kind        = (body.get("kind")       or "experience").strip().lower()
        pillar      = (body.get("pillar")     or "").strip()
        happened_on = (body.get("happenedOn") or "").strip()
        photo_ref   = (body.get("photoRef")   or None)

        raw_bullets = body.get("bullets") or []
        bullets = [str(b).strip()[:_MAX_BULLET_LEN] for b in raw_bullets if str(b).strip()]
        bullets = bullets[:_MAX_BULLETS]

        if not title:
            return self._json(400, {"ok": False, "error": "title is required"})
        if pillar and pillar not in _VALID_PILLARS:
            return self._json(400, {"ok": False, "error": f"pillar must be one of {sorted(_VALID_PILLARS)}"})
        if kind not in _VALID_KINDS:
            kind = "experience"

        row = {
            "user_id":     user_id,
            "title":       title,
            "kind":        kind,
            "pillar":      pillar,
            "bullets":     bullets,
            "photo_ref":   photo_ref,
        }
        if happened_on:
            row["happened_on"] = happened_on

        try:
            db     = get_db()
            result = db.table("moments").insert(row).execute()
            saved  = result.data[0] if result.data else row
        except Exception as exc:
            return self._json(500, {"ok": False, "error": f"DB error: {exc}"})

        # Trigger persona refresh via internal call to api/persona logic
        persona_data = None
        what_changed = ""
        try:
            from persona import _fetch_persona, _fetch_recent_moments, _save_persona, _agnes_chat, _REFRESH_SYSTEM, _DEFAULT_MODEL

            api_key = os.environ.get("AGNES_AI_TOKEN", "")
            model   = os.environ.get("AGNES_MODEL", _DEFAULT_MODEL)

            if api_key:
                existing = _fetch_persona(user_id)
                moments  = _fetch_recent_moments(user_id, limit=10)

                parts = []
                if existing:
                    parts.append(
                        "=== EXISTING PERSONA ===\n"
                        f"Persona: {existing.get('persona_summary', '')}\n"
                        f"Positioning: {existing.get('positioning', '')}\n"
                        f"Roles: {json.dumps(existing.get('roles', []))}\n"
                        f"Fields: {json.dumps(existing.get('fields', []))}\n"
                        f"Tone: {existing.get('tone', '')}\n"
                        f"Evidence: {json.dumps(existing.get('evidence', []))}"
                    )

                if moments:
                    m_lines = []
                    for m in moments:
                        mb = m.get("bullets") or []
                        if isinstance(mb, str):
                            try: mb = json.loads(mb)
                            except Exception: mb = [mb]
                        m_lines.append(f"- [{m.get('pillar', '')}] {m.get('title', '')}: {'; '.join(str(b) for b in mb)}")
                    parts.append("=== RECENT MOMENTS ===\n" + "\n".join(m_lines))

                if parts:
                    user_msg = "\n\n".join(parts) + "\n\nUpdate the persona based on the new moments."
                    raw = _agnes_chat(api_key, model, [
                        {"role": "system", "content": _REFRESH_SYSTEM},
                        {"role": "user",   "content": user_msg},
                    ])
                    updated = json.loads(raw)
                    existing_raw = existing.get("raw_inputs", "") if existing else ""
                    _save_persona(user_id, updated, raw_inputs=existing_raw)
                    persona_data = {
                        "persona_summary":  updated.get("persona_summary", ""),
                        "positioning":      updated.get("positioning", ""),
                        "suggested_pillars": updated.get("suggested_pillars", []),
                        "tone":             updated.get("tone", ""),
                        "evidence":         updated.get("evidence", []),
                    }
                    what_changed = updated.get("whatChanged", "")
        except Exception:
            pass  # best-effort; don't fail the moment save because of persona refresh

        return self._json(200, {
            "ok":         True,
            "moment":     saved,
            "persona":    persona_data,
            "whatChanged": what_changed,
        })
