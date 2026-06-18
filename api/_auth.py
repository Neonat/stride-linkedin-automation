"""
Stride — JWT authentication helper.
Extracts the Supabase Bearer token from request headers,
verifies it against Supabase Auth, and returns the user record.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _db import get_db


def require_user(headers) -> dict:
    """
    Verify the Supabase JWT in the Authorization header.

    Returns: {"id": "<uuid>", "email": "<email>"}
    Raises:  ValueError with a human-readable message on failure.
    """
    raw = (
        headers.get("Authorization")
        or headers.get("authorization")
        or ""
    ).strip()

    if not raw.startswith("Bearer "):
        raise ValueError("Authorization header missing or malformed (expected: Bearer <token>)")

    token = raw[7:].strip()
    if not token:
        raise ValueError("Empty bearer token")

    try:
        db = get_db()
        resp = db.auth.get_user(token)
        user = resp.user
        if not user or not user.id:
            raise ValueError("Token resolved to no user")
        return {"id": str(user.id), "email": user.email or ""}
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Token verification failed: {exc}") from exc
