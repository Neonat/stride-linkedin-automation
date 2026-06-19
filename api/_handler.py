"""
Stride — Base HTTP handler shared by all api/*.py serverless functions.
Private module (leading underscore) — Vercel does not expose this as an endpoint.
"""
import json
from http.server import BaseHTTPRequestHandler


class StrideHandler(BaseHTTPRequestHandler):
    """Extend this instead of BaseHTTPRequestHandler for consistent CORS + JSON."""

    # ── CORS pre-flight ───────────────────────────────────────────────────────
    def do_OPTIONS(self):
        self.send_response(204)
        self._add_cors()
        self.end_headers()

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _add_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def _json(self, status: int, data: dict) -> None:
        body = json.dumps(data, default=str).encode()
        self.send_response(status)
        self._add_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except (ValueError, json.JSONDecodeError):
            return {}

    def log_message(self, *_):
        pass  # silence default access log in Vercel
