"""
Stride — /api/config
Returns public frontend configuration (Supabase URL + anon key).

The anon key is designed to be public — it is gated by Supabase RLS policies.
The service role key is never returned here.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _handler import StrideHandler


class handler(StrideHandler):

    def do_GET(self):
        try:
            self._json(200, {
                "ok": True,
                "supabaseUrl":      os.environ["SUPABASE_URL"],
                "supabaseAnonKey":  os.environ["SUPABASE_ANON_KEY"],
            })
        except KeyError as exc:
            self._json(500, {"ok": False, "error": f"Server missing env var: {exc}"})
