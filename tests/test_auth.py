import os
os.environ.setdefault("JWT_SECRET", "test-secret")
from _lib.auth import (issue_token, verify_token, hash_password,
                       verify_password, parse_cookie)

def test_jwt_roundtrip():
    assert verify_token(issue_token("admin")) == "admin"

def test_jwt_bad_returns_none():
    assert verify_token("garbage.token") is None

def test_password_hash_verify():
    h = hash_password("pw123")
    assert verify_password("pw123", h) and not verify_password("nope", h)

def test_parse_cookie():
    assert parse_cookie("a=1; cluber_token=abc; b=2") == "abc"
    assert parse_cookie("") is None
