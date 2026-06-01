from http.server import BaseHTTPRequestHandler
import os, json, re
import psycopg


def trycon(url):
    try:
        c = psycopg.connect(url, connect_timeout=8)
        c.close()
        return "OK"
    except Exception as e:
        return type(e).__name__ + ": " + str(e)[:120]


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        base = os.environ.get("DATABASE_URL", "")
        no_cb = re.sub(r"[?&]channel_binding=[^&]*", "", base)
        sep_b = "&" if "?" in base else "?"
        sep_n = "&" if "?" in no_cb else "?"
        res = {
            "as_is": trycon(base),
            "no_cb": trycon(no_cb),
            "gss": trycon(base + sep_b + "gssencmode=disable"),
            "no_cb_gss": trycon(no_cb + sep_n + "gssencmode=disable"),
        }
        body = json.dumps(res).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)
