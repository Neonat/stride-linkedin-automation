"""
Stride — /api/persona

Supersedes the persona-generation half of api/profile.py.

GET  → fetch saved persona for the current user (auth or demo)
POST → two modes, detected from body:
  • build   (default) — cold-start from pasted résumé + onboarding answers
  • refresh            — update from recent moments after a new capture

Returns:
  build/refresh: { ok, roles[], fields[], suggested_pillars[], tone,
                   persona_summary, positioning, evidence[], whatChanged? }
  GET:           { ok, persona: <row> }

Required env vars: AGNES_AI_TOKEN, AGNES_MODEL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
import json
import os
import sys
import requests
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler
from _auth import require_user
from _db import get_db

_AGNES_URL    = "https://apihub.agnes-ai.com/v1/chat/completions"
_DEFAULT_MODEL = "agnes-2.0-flash"
_DEMO_USER_ID = "demo-user"

_BUILD_SYSTEM = """\
You extract a professional persona from pasted career material and questionnaire answers.

Return ONLY a valid JSON object with exactly these keys:
- "roles": array of strings — job roles or identities mentioned or clearly implied (e.g. ["Software Engineer", "Student"])
- "fields": array of strings — professional fields (e.g. ["AI", "Product Management"])
- "suggested_pillars": array of strings — pick relevant items only from [Technical, Leadership, Community, Creative, Research]
- "tone": string — one of [Thoughtful, Direct, Bold, Story-driven, Warm, Funny] that best fits the person's voice
- "persona_summary": string — one short sentence describing who this person is (e.g. "Final-year CS student building in AI")
- "positioning": string — 2-3 sentences on what value they bring and why people should follow them
- "evidence": array of strings — concrete facts and wins extracted from the text, max 12 items

Rules:
- Extract only what is actually stated. Never invent, embellish, or assume achievements.
- No buzzwords: no "excited", "thrilled", "game-changer", "leverage", "synergy", "passionate".
- No em dashes (—). Use commas, colons, or new sentences instead.
- Sound like the person, not a press release.
- For evidence: include specific verifiable facts like "Won 1st place at X hackathon" or "Built Y used by Z users".
- If pasted text is empty, derive from questionnaire answers only. Keep it minimal and honest.

No preamble, no markdown, no code fences. Output only the raw JSON object.\
"""

_REFRESH_SYSTEM = """\
You update a professional persona based on new captured moments.

Return ONLY a valid JSON object with exactly these keys:
- "roles": array of strings
- "fields": array of strings
- "suggested_pillars": array of strings — from [Technical, Leadership, Community, Creative, Research]
- "tone": string — one of [Thoughtful, Direct, Bold, Story-driven, Warm, Funny]
- "persona_summary": string — one short sentence, updated only if the new moments change the picture
- "positioning": string — 2-3 sentences, updated only if meaningfully changed
- "evidence": array of strings — ALL evidence (existing + new moments), deduped, max 20 items
- "whatChanged": string — one short specific sentence on what the new moments show (e.g. "You've shown Leadership 3 times now.")

Rules:
- Preserve what's accurate from the existing persona. Only update if the new moments meaningfully change the picture.
- No buzzwords, no em dashes.
- whatChanged must be honest and specific, not generic encouragement.

No preamble, no markdown, no code fences. Output only the raw JSON object.\
"""


def _agnes_chat(api_key: str, model: str, messages: list, temperature: float = 0.6) -> str:
    resp = requests.post(
        _AGNES_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": 700},
        timeout=30,
    )
    resp.raise_for_status()
    raw = resp.json()["choices"][0]["message"]["content"].strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    return raw


def _get_user_id(headers: dict) -> str:
    try:
        user = require_user(headers)
        return user["id"]
    except Exception:
        return _DEMO_USER_ID


def _save_persona(user_id: str, data: dict, raw_inputs: str = "") -> dict:
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "user_id":        user_id,
        "roles":          data.get("roles", []),
        "fields":         data.get("fields", []),
        "pillars":        data.get("suggested_pillars", []),
        "tone":           data.get("tone", ""),
        "persona_summary": data.get("persona_summary", ""),
        "positioning":    data.get("positioning", ""),
        "evidence":       data.get("evidence", []),
        "raw_inputs":     raw_inputs,
        "updated_at":     now,
    }
    result = db.table("personas").upsert(row).execute()
    return result.data[0] if result.data else row


def _fetch_persona(user_id: str) -> dict | None:
    db = get_db()
    result = (
        db.table("personas")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data


def _fetch_recent_moments(user_id: str, limit: int = 10) -> list:
    db = get_db()
    result = (
        db.table("moments")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


class handler(StrideHandler):

    def do_GET(self):
        user_id = _get_user_id(dict(self.headers))
        try:
            persona = _fetch_persona(user_id)
            if persona:
                return self._json(200, {"ok": True, "persona": persona})
            return self._json(404, {"ok": False, "error": "No persona found."})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def do_POST(self):
        body = self._read_body()
        mode = (body.get("mode") or "build").strip().lower()

        api_key = os.environ.get("AGNES_AI_TOKEN")
        if not api_key:
            return self._json(500, {"ok": False, "error": "AGNES_AI_TOKEN is not configured"})
        model = os.environ.get("AGNES_MODEL", _DEFAULT_MODEL)

        user_id = _get_user_id(dict(self.headers))

        if mode == "refresh":
            return self._handle_refresh(user_id, api_key, model)
        return self._handle_build(body, user_id, api_key, model)

    # ── Build mode ────────────────────────────────────────────────────────────
    def _handle_build(self, body: dict, user_id: str, api_key: str, model: str):
        pasted  = (body.get("pastedText") or "").strip()
        role    = (body.get("role")    or "").strip()
        field   = (body.get("field")   or "").strip()
        wants   = body.get("wants")   or []
        tone    = (body.get("tone")    or "").strip()
        pillars = body.get("pillars") or []

        if isinstance(wants,   str): wants   = [w.strip() for w in wants.split(",")   if w.strip()]
        if isinstance(pillars, str): pillars = [p.strip() for p in pillars.split(",") if p.strip()]

        parts = []
        if pasted:
            parts.append(f"=== PASTED MATERIAL ===\n{pasted[:4000]}")

        q_lines = []
        if role:    q_lines.append(f"Role: {role}")
        if field:   q_lines.append(f"Field: {field}")
        if wants:   q_lines.append(f"Wants: {', '.join(wants)}")
        if tone:    q_lines.append(f"Tone preference: {tone}")
        if pillars: q_lines.append(f"Pillars chosen: {', '.join(pillars)}")
        if q_lines:
            parts.append("=== QUESTIONNAIRE ANSWERS ===\n" + "\n".join(q_lines))

        if not parts:
            return self._json(400, {"ok": False, "error": "Provide pasted text or questionnaire answers."})

        user_msg = "\n\n".join(parts) + "\n\nExtract the persona now."

        try:
            raw  = _agnes_chat(api_key, model, [
                {"role": "system", "content": _BUILD_SYSTEM},
                {"role": "user",   "content": user_msg},
            ])
            data = json.loads(raw)
        except json.JSONDecodeError:
            return self._json(502, {"ok": False, "error": "Model returned unparseable JSON — retry"})
        except requests.HTTPError as exc:
            code   = exc.response.status_code if exc.response is not None else 0
            detail = exc.response.text[:200]   if exc.response is not None else str(exc)
            return self._json(502, {"ok": False, "error": f"Agnes AI {code}: {detail}"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

        try:
            _save_persona(user_id, data, raw_inputs=pasted)
        except Exception:
            pass  # best-effort write; don't block the response

        return self._json(200, {
            "ok":               True,
            "roles":            data.get("roles",            []),
            "fields":           data.get("fields",           []),
            "suggested_pillars": data.get("suggested_pillars", []),
            "tone":             data.get("tone",             ""),
            "persona_summary":  data.get("persona_summary",  ""),
            "positioning":      data.get("positioning",      ""),
            "evidence":         data.get("evidence",         []),
        })

    # ── Refresh mode ──────────────────────────────────────────────────────────
    def _handle_refresh(self, user_id: str, api_key: str, model: str):
        try:
            existing = _fetch_persona(user_id)
            moments  = _fetch_recent_moments(user_id)
        except Exception as exc:
            return self._json(500, {"ok": False, "error": f"DB error: {exc}"})

        if not existing and not moments:
            return self._json(400, {"ok": False, "error": "No persona or moments to refresh from."})

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
                bullets = m.get("bullets") or []
                if isinstance(bullets, str):
                    try: bullets = json.loads(bullets)
                    except Exception: bullets = [bullets]
                bullet_str = "; ".join(str(b) for b in bullets)
                m_lines.append(f"- [{m.get('pillar', '')}] {m.get('title', '')}: {bullet_str}")
            parts.append("=== RECENT MOMENTS ===\n" + "\n".join(m_lines))

        user_msg = "\n\n".join(parts) + "\n\nUpdate the persona based on the new moments."

        try:
            raw  = _agnes_chat(api_key, model, [
                {"role": "system", "content": _REFRESH_SYSTEM},
                {"role": "user",   "content": user_msg},
            ])
            data = json.loads(raw)
        except json.JSONDecodeError:
            return self._json(502, {"ok": False, "error": "Model returned unparseable JSON — retry"})
        except requests.HTTPError as exc:
            code   = exc.response.status_code if exc.response is not None else 0
            detail = exc.response.text[:200]   if exc.response is not None else str(exc)
            return self._json(502, {"ok": False, "error": f"Agnes AI {code}: {detail}"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

        existing_raw = existing.get("raw_inputs", "") if existing else ""
        try:
            _save_persona(user_id, data, raw_inputs=existing_raw)
        except Exception:
            pass

        return self._json(200, {
            "ok":               True,
            "roles":            data.get("roles",            []),
            "fields":           data.get("fields",           []),
            "suggested_pillars": data.get("suggested_pillars", []),
            "tone":             data.get("tone",             ""),
            "persona_summary":  data.get("persona_summary",  ""),
            "positioning":      data.get("positioning",      ""),
            "evidence":         data.get("evidence",         []),
            "whatChanged":      data.get("whatChanged",      ""),
        })
