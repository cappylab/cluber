from http.server import BaseHTTPRequestHandler
import os, json
from urllib.parse import urlparse


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = os.environ.get("DATABASE_URL", "")
        u = urlparse(url)
        res = {
            "scheme": u.scheme, "user": u.username, "host": u.hostname,
            "port": u.port, "db": u.path, "query": u.query, "url_len": len(url),
        }
        body = json.dumps(res).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)
