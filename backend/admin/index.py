"""
Админ-панель: просмотр пользователей, блокировка/разблокировка по ID.
Параметр action передаётся в query string: ?action=users|block|unblock|set-admin
"""
import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
}

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_admin_user(token: str):
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT u.user_id, u.is_admin FROM sessions s
           JOIN users u ON s.user_id = u.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_admin = TRUE""",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return row

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    token = event.get("headers", {}).get("X-Session-Token") or event.get("headers", {}).get("x-session-token")
    admin = get_admin_user(token)
    if not admin:
        return {"statusCode": 403, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет доступа"})}

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # Список пользователей
    if action == "users" and method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT user_id, username, is_admin, is_blocked, block_reason, created_at, last_seen FROM users ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        conn.close()
        users = []
        for row in rows:
            users.append({
                "user_id": row[0],
                "username": row[1],
                "is_admin": row[2],
                "is_blocked": row[3],
                "block_reason": row[4],
                "created_at": str(row[5]),
                "last_seen": str(row[6]),
            })
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"users": users})}

    # Блокировка пользователя
    if action == "block" and method == "POST":
        target_id = body.get("user_id")
        reason = body.get("reason") or "Нарушение правил"
        if not target_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "user_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET is_blocked = TRUE, block_reason = %s WHERE user_id = %s",
            (reason, target_id)
        )
        cur.execute("UPDATE sessions SET expires_at = NOW() WHERE user_id = %s", (target_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # Разблокировка пользователя
    if action == "unblock" and method == "POST":
        target_id = body.get("user_id")
        if not target_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "user_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET is_blocked = FALSE, block_reason = NULL WHERE user_id = %s",
            (target_id,)
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # Назначить/снять админа
    if action == "set-admin" and method == "POST":
        target_id = body.get("user_id")
        value = body.get("is_admin", False)
        if not target_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "user_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_admin = %s WHERE user_id = %s", (value, target_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Not found"})}
