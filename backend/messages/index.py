"""
Сообщения в группах: история и отправка.
action: list | send
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

def is_member(conn, group_id, user_id):
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM group_members WHERE group_id = %s AND user_id = %s", (group_id, user_id))
    return cur.fetchone() is not None

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

    # История сообщений
    if action == "list" and method == "GET":
        group_id = qs.get("group_id")
        if not group_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "group_id обязателен"})}
        conn = get_db()
        if not is_member(conn, group_id, user["user_id"]):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Вы не состоите в группе"})}
        cur = conn.cursor()
        cur.execute(
            """SELECT id, user_id, username, text, created_at
               FROM messages WHERE group_id = %s
               ORDER BY created_at ASC LIMIT 100""",
            (group_id,)
        )
        rows = cur.fetchall()
        conn.close()
        messages = [
            {"id": r[0], "user_id": r[1], "username": r[2], "text": r[3], "created_at": str(r[4])}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}

    # Отправка сообщения
    if action == "send" and method == "POST":
        group_id = body.get("group_id")
        text = (body.get("text") or "").strip()
        if not group_id or not text:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "group_id и text обязательны"})}
        if len(text) > 2000:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Сообщение слишком длинное"})}
        conn = get_db()
        if not is_member(conn, group_id, user["user_id"]):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Вы не состоите в группе"})}
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO messages (group_id, user_id, username, text) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (group_id, user["user_id"], user["username"], text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "id": row[0], "user_id": user["user_id"], "username": user["username"],
                "text": text, "created_at": str(row[1])
            })
        }

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}