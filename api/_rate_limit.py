"""
Stride — Sliding-window rate limiter backed by Postgres.
Records attempts in rate_limit_attempts and counts within the window.
"""
import os, sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _db import get_db


def check_and_record(key: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    """
    Returns True (allowed) or False (rate-limited).
    Always records the attempt before returning.

    key: e.g. "redeem_code:1.2.3.4" or "redeem_qr:user-uuid"
    """
    db = get_db()
    window_start = (
        datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
    ).isoformat()

    # Count recent attempts for this key
    result = (
        db.table("rate_limit_attempts")
        .select("id")
        .eq("key", key)
        .gte("attempted_at", window_start)
        .execute()
    )
    count = len(result.data or [])

    # Record this attempt regardless (so we track abusers)
    db.table("rate_limit_attempts").insert({"key": key}).execute()

    return count < max_attempts
