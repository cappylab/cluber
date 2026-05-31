from http.server import BaseHTTPRequestHandler
import json, os


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = {
            "ok": True,
            "service": "cluber-api",
            "has_db_url": bool(os.environ.get("DATABASE_URL")),
        }
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())
