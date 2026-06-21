"""
Stride — /api/linkedin_stats
Returns the connected LinkedIn account profile and recent posts.

Required env vars:
  LINKEDIN_ACCESS_TOKEN   — 3-legged OAuth token
  LINKEDIN_PERSON_URN     — e.g. "urn:li:person:AbCdEfGhIj"
  LINKEDIN_API_VERSION    — e.g. "202606"
"""

import json
import os
import sys
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _handler import StrideHandler

_LI_BASE = "https://api.linkedin.com/rest"


class handler(StrideHandler):

    def do_GET(self):
        token       = os.environ.get("LINKEDIN_ACCESS_TOKEN")
        person_urn  = os.environ.get("LINKEDIN_PERSON_URN")
        api_version = os.environ.get("LINKEDIN_API_VERSION", "202606")

        if not token:
            return self._json(500, {"ok": False, "error": "LINKEDIN_ACCESS_TOKEN is not configured"})
        if not person_urn:
            return self._json(500, {"ok": False, "error": "LINKEDIN_PERSON_URN is not configured"})

        li_headers = {
            "Authorization":             f"Bearer {token}",
            "LinkedIn-Version":          api_version,
            "X-Restli-Protocol-Version": "2.0.0",
        }

        try:
            profile = self._fetch_profile(li_headers)
            posts   = self._fetch_posts(li_headers, person_urn)
            return self._json(200, {"ok": True, "profile": profile, "posts": posts})
        except requests.HTTPError as exc:
            code   = exc.response.status_code if exc.response is not None else 0
            detail = exc.response.text[:300]   if exc.response is not None else str(exc)
            return self._json(502, {"ok": False, "error": f"LinkedIn API {code}: {detail}"})
        except Exception as exc:
            return self._json(500, {"ok": False, "error": str(exc)})

    def _fetch_profile(self, li_headers: dict) -> dict:
        resp = requests.get(
            f"{_LI_BASE}/me",
            headers={**li_headers, "Content-Type": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        first = (data.get("localizedFirstName") or data.get("firstName", {}).get("localized", {}) or {})
        last  = (data.get("localizedLastName")  or data.get("lastName",  {}).get("localized", {}) or {})
        if isinstance(first, dict):
            first = next(iter(first.values()), "")
        if isinstance(last, dict):
            last  = next(iter(last.values()), "")
        headline = (
            data.get("localizedHeadline")
            or data.get("headline", {}).get("localized", {})
            or {}
        )
        if isinstance(headline, dict):
            headline = next(iter(headline.values()), "")
        return {
            "urn":      data.get("id", ""),
            "name":     f"{first} {last}".strip(),
            "headline": headline,
        }

    def _fetch_posts(self, li_headers: dict, person_urn: str) -> list:
        encoded_urn = requests.utils.quote(person_urn, safe="")
        resp = requests.get(
            f"{_LI_BASE}/posts",
            headers={**li_headers, "Content-Type": "application/json"},
            params={"author": person_urn, "q": "author", "count": 5, "sortBy": "LAST_MODIFIED"},
            timeout=15,
        )
        resp.raise_for_status()
        data  = resp.json()
        items = data.get("elements", [])
        posts = []
        for item in items:
            text    = ""
            content = item.get("commentary") or item.get("content", {})
            if isinstance(content, str):
                text = content
            elif isinstance(content, dict):
                text = content.get("text", "")
            social  = item.get("socialDetail", {}) or {}
            posts.append({
                "id":       item.get("id", ""),
                "text":     text[:200],
                "likes":    social.get("totalSocialActivityCounts", {}).get("numLikes", 0),
                "comments": social.get("totalSocialActivityCounts", {}).get("numComments", 0),
                "shares":   social.get("totalSocialActivityCounts", {}).get("numShares", 0),
            })
        return posts
