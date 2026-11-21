import http.client
import importlib.util
import io
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch


class MemorySocket:
    def __init__(self, data):
        self.data = data
        self.output = bytearray()

    def makefile(self, *args):
        return io.BytesIO(self.data)

    def sendall(self, data):
        self.output.extend(data)


class PreflightTests(unittest.TestCase):
    def test_options_returns_valid_http_without_provider_calls(self):
        for endpoint in ["publish", "health", "safety_check"]:
            with self.subTest(endpoint=endpoint):
                spec = importlib.util.spec_from_file_location(
                    endpoint, Path(__file__).parents[1] / "api" / f"{endpoint}.py"
                )
                module = importlib.util.module_from_spec(spec)
                with patch.dict(sys.modules, {"requests": types.ModuleType("requests")}):
                    spec.loader.exec_module(module)
                connection = MemorySocket(b"OPTIONS /api/test HTTP/1.1\r\nHost: localhost\r\n\r\n")
                module.handler(connection, ("127.0.0.1", 1234), object())
                response = http.client.HTTPResponse(MemorySocket(bytes(connection.output)))
                response.begin()
                self.assertEqual(response.status, 204)
                self.assertEqual(response.getheader("Access-Control-Allow-Origin"), "*")
                self.assertIn("OPTIONS", response.getheader("Access-Control-Allow-Methods"))
                self.assertEqual(response.read(), b"")


if __name__ == "__main__":
    unittest.main()
