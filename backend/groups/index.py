"""
Управление группами: создание, список, вступление, участники.
action: list | create | join | leave | members
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

    # Список групп пользователя
    if action == "list" and method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT g.id, g.name, g.description, g.owner_id, g.created_at,
                      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
                      (SELECT COUNT(*) FROM messages m WHERE m.group_id = g.id) as message_count
               FROM groups g
               JOIN group_members gm ON g.id = gm.group_id
               WHERE gm.user_id = %s
               ORDER BY g.created_at DESC""",
            (user["user_id"],)
        )
        rows = cur.fetchall()
        conn.close()
        groups = [
            {"id": r[0], "name": r[1], "description": r[2], "owner_id": r[3],
             "created_at": str(r[4]), "member_count": r[5], "message_count": r[6]}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"groups": groups})}

    # Все публичные группы (для поиска/присоединения)
    if action == "all" and method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT g.id, g.name, g.description, g.owner_id, g.created_at,
                      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
                      EXISTS(SELECT 1 FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.user_id = %s) as is_member
               FROM groups g
               ORDER BY g.created_at DESC LIMIT 50""",
            (user["user_id"],)
        )
        rows = cur.fetchall()
        conn.close()
        groups = [
            {"id": r[0], "name": r[1], "description": r[2], "owner_id": r[3],
             "created_at": str(r[4]), "member_count": r[5], "is_member": r[6]}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"groups": groups})}

    # Создание группы
    if action == "create" and method == "POST":
        name = (body.get("name") or "").strip()
        description = (body.get("description") or "").strip()
        if not name or len(name) < 2:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Название минимум 2 символа"})}
        if len(name) > 64:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Название максимум 64 символа"})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO groups (name, description, owner_id) VALUES (%s, %s, %s) RETURNING id",
            (name, description, user["user_id"])
        )
        group_id = cur.fetchone()[0]
        cur.execute("INSERT INTO group_members (group_id, user_id) VALUES (%s, %s)", (group_id, user["user_id"]))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": group_id, "name": name})}

    # Вступить в группу
    if action == "join" and method == "POST":
        group_id = body.get("group_id")
        if not group_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "group_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM groups WHERE id = %s", (group_id,))
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Группа не найдена"})}
        cur.execute(
            "INSERT INTO group_members (group_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (group_id, user["user_id"])
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # Участники группы
    if action == "members" and method == "GET":
        group_id = qs.get("group_id")
        if not group_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "group_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT u.user_id, u.username, gm.joined_at
               FROM group_members gm JOIN users u ON gm.user_id = u.user_id
               WHERE gm.group_id = %s ORDER BY gm.joined_at""",
            (group_id,)
        )
        rows = cur.fetchall()
        conn.close()
        members = [{"user_id": r[0], "username": r[1], "joined_at": str(r[2])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"members": members})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
