"""
Stride — Supabase service-role client (server-side only).
Private module — never import SUPABASE_SERVICE_ROLE_KEY in frontend code.
"""
import os
from functools import lru_cache
from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_db() -> Client:
    """Return a cached service-role Supabase client (bypasses RLS)."""
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)
