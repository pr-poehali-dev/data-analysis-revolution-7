"""
Профиль пользователя: просмотр, редактирование, жалоба на пользователя.
action: get | update | report
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(token):
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT u.user_id, u.username FROM sessions s
           JOIN users u ON s.user_id = u.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_blocked = FALSE""",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return {"user_id": row[0], "username": row[1]} if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = (event.get("headers") or {}).get("X-Session-Token") or (event.get("headers") or {}).get("x-session-token")
    user = get_user(token)
    if not user:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # Получить профиль по user_id
    if action == "get" and method == "GET":
        target_id = qs.get("user_id")
        if not target_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT user_id, username, bio, is_admin, is_verified, is_blocked, created_at FROM users WHERE user_id = %s",
            (target_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "user_id": row[0], "username": row[1], "bio": row[2],
                "is_admin": row[3], "is_verified": row[4],
                "is_blocked": row[5], "created_at": str(row[6])
            })
        }

    # Обновить свой профиль
    if action == "update" and method == "POST":
        bio = (body.get("bio") or "").strip()
        if len(bio) > 200:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Bio максимум 200 символов"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE users SET bio = %s WHERE user_id = %s", (bio or None, user["user_id"]))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # Жалоба на пользователя
    if action == "report" and method == "POST":
        target_id = body.get("user_id")
        reason = (body.get("reason") or "").strip()
        if not target_id or not reason:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id и reason обязательны"})}
        if target_id == user["user_id"]:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нельзя жаловаться на себя"})}
        if len(reason) > 500:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Причина слишком длинная"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO reports (reporter_id, target_user_id, reason) VALUES (%s, %s, %s)",
            (user["user_id"], target_id, reason)
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
