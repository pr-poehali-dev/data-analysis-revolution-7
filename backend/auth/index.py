"""
Авторизация пользователей: регистрация, вход, выход, проверка сессии.
Параметр action передаётся в query string: ?action=register|login|me|logout
"""
import json
import os
import hashlib
import secrets
import random
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_user_id() -> int:
    return random.randint(100000000, 999999999)

def generate_token() -> str:
    return secrets.token_hex(32)

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # Регистрация
    if action == "register" and method == "POST":
        username = (body.get("username") or "").strip().lower()
        password = body.get("password") or ""

        if not username or not password:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Логин и пароль обязательны"})}
        if len(username) < 3 or len(username) > 32:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Логин от 3 до 32 символов"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS_HEADERS, "body": json.dumps({"error": "Логин уже занят"})}

        user_id = generate_user_id()
        cur.execute("SELECT id FROM users WHERE user_id = %s", (user_id,))
        while cur.fetchone():
            user_id = generate_user_id()
            cur.execute("SELECT id FROM users WHERE user_id = %s", (user_id,))

        pw_hash = hash_password(password)
        cur.execute(
            "INSERT INTO users (user_id, username, password_hash) VALUES (%s, %s, %s)",
            (user_id, username, pw_hash)
        )

        token = generate_token()
        cur.execute(
            "INSERT INTO sessions (user_id, token) VALUES (%s, %s)",
            (user_id, token)
        )
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"token": token, "user_id": user_id, "username": username, "is_admin": False})
        }

    # Вход
    if action == "login" and method == "POST":
        username = (body.get("username") or "").strip().lower()
        password = body.get("password") or ""

        conn = get_db()
        cur = conn.cursor()
        pw_hash = hash_password(password)
        cur.execute(
            "SELECT user_id, username, is_admin, is_blocked, block_reason FROM users WHERE username = %s AND password_hash = %s",
            (username, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неверный логин или пароль"})}

        user_id, uname, is_admin, is_blocked, block_reason = row
        if is_blocked:
            conn.close()
            reason = block_reason or "Нарушение правил"
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": f"Аккаунт заблокирован: {reason}"})}

        token = generate_token()
        cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        cur.execute("UPDATE users SET last_seen = NOW() WHERE user_id = %s", (user_id,))
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"token": token, "user_id": user_id, "username": uname, "is_admin": is_admin})
        }

    # Проверка сессии
    if action == "me" and method == "GET":
        token = event.get("headers", {}).get("X-Session-Token") or event.get("headers", {}).get("x-session-token")
        if not token:
            return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет токена"})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT u.user_id, u.username, u.is_admin, u.is_blocked
               FROM sessions s JOIN users u ON s.user_id = u.user_id
               WHERE s.token = %s AND s.expires_at > NOW()""",
            (token,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Сессия недействительна"})}

        user_id, username, is_admin, is_blocked = row
        if is_blocked:
            return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Аккаунт заблокирован"})}

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"user_id": user_id, "username": username, "is_admin": is_admin})
        }

    # Выход
    if action == "logout" and method == "POST":
        token = event.get("headers", {}).get("X-Session-Token") or event.get("headers", {}).get("x-session-token")
        if token:
            conn = get_db()
            cur = conn.cursor()
            cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Not found"})}
