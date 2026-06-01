from http.server import BaseHTTPRequestHandler
import os, json, ssl
from urllib.parse import urlparse


def try_pg8000(url):
    try:
        import pg8000.dbapi
        u = urlparse(url)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        c = pg8000.dbapi.connect(
            user=u.username, password=u.password, host=u.hostname,
            port=u.port or 5432, database=u.path.lstrip("/"), ssl_context=ctx,
        )
        cur = c.cursor(); cur.execute("SELECT 1"); cur.fetchone(); c.close()
        return "OK"
    except Exception as e:
        return type(e).__name__ + ": " + str(e)[:140]


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        res = {"pg8000": try_pg8000(os.environ.get("DATABASE_URL", ""))}
        body = json.dumps(res).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)
