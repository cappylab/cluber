import os, datetime
import jwt
import bcrypt

JWT_ALG = "HS256"
COOKIE = "cluber_token"


def hash_password(pw):
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw, h):
    return bcrypt.checkpw(pw.encode(), h.encode())


def issue_token(username):
    exp = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    return jwt.encode({"sub": username, "exp": exp}, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


def verify_token(token):
    try:
        return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])["sub"]
    except Exception:
        return None


def parse_cookie(cookie_header, key=COOKIE):
    if not cookie_header:
        return None
    for part in cookie_header.split(";"):
        k, _, v = part.strip().partition("=")
        if k == key:
            return v
    return None


def set_cookie_header(token, max_age=86400):
    return f"{COOKIE}={token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age={max_age}"


def clear_cookie_header():
    return f"{COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
