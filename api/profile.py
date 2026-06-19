"""
Stride — /api/profile
GET  → return current user's Stride profile (or 404 if not set up yet)
POST → create or update profile (upsert by user id)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler
from _auth    import require_user
from _db      import get_db

_MAX_NAME_LEN     = 80
_MAX_HEADLINE_LEN = 160


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
            else:
                return self._json(404, {
                    "ok": False,
                    "error": "Profile not found. Complete setup first.",
                })
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def do_POST(self):
        try:
            user = require_user(dict(self.headers))
        except ValueError as exc:
            return self._json(401, {"ok": False, "error": str(exc)})

        body = self._read_body()
        display_name = (body.get("display_name") or "").strip()[:_MAX_NAME_LEN]
        headline     = (body.get("headline")     or "").strip()[:_MAX_HEADLINE_LEN]
        collab_disc  = bool(body.get("collab_discoverable", True))

        if not display_name:
            return self._json(400, {"ok": False, "error": "display_name is required"})

        try:
            db = get_db()
            row = {
                "id":                   user["id"],
                "display_name":         display_name,
                "headline":             headline,
                "collab_discoverable":  collab_disc,
            }
            result = db.table("users").upsert(row).execute()
            saved = result.data[0] if result.data else row
            return self._json(200, {"ok": True, "profile": saved})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})
