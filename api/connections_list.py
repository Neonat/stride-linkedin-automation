"""
Stride — /api/connections_list
GET → list all connections for the authenticated user,
      with display_name and headline of the other person.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler
from _auth    import require_user
from _db      import get_db


class handler(StrideHandler):

    def do_GET(self):
        try:
            user = require_user(dict(self.headers))
        except ValueError as exc:
            return self._json(401, {"ok": False, "error": str(exc)})

        uid = user["id"]

        try:
            db = get_db()

            # Fetch rows where this user is on either side of the pair
            lo_result = (
                db.table("connections")
                .select("user_hi, connected_at")
                .eq("user_lo", uid)
                .execute()
            )
            hi_result = (
                db.table("connections")
                .select("user_lo, connected_at")
                .eq("user_hi", uid)
                .execute()
            )

            # Build a map: other_user_id → connected_at
            other_map: dict[str, str] = {}
            for row in (lo_result.data or []):
                other_map[row["user_hi"]] = row["connected_at"]
            for row in (hi_result.data or []):
                other_map[row["user_lo"]] = row["connected_at"]

            if not other_map:
                return self._json(200, {"ok": True, "connections": []})

            # Fetch profiles for the other users in one query
            profiles_result = (
                db.table("users")
                .select("id, display_name, headline")
                .in_("id", list(other_map.keys()))
                .execute()
            )

            connections = [
                {
                    "user_id":      p["id"],
                    "display_name": p["display_name"],
                    "headline":     p["headline"],
                    "connected_at": other_map.get(p["id"]),
                }
                for p in (profiles_result.data or [])
            ]
            connections.sort(
                key=lambda c: c["connected_at"] or "",
                reverse=True,
            )
            return self._json(200, {"ok": True, "connections": connections})

        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})
