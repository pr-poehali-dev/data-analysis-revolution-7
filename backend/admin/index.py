"""
Админ панель: пользователи, блокировки, верификация, жалобы, управление группами.
action: users|block|unblock|set-admin|verify-user|verify-group|set-official|reports|review-report
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

    # Верификация пользователя (галочка)
    if action == "verify-user" and method == "POST":
        target_id = body.get("user_id")
        value = body.get("value", True)
        if not target_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "user_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_verified = %s WHERE user_id = %s", (value, target_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # Верификация группы (зелёная галочка)
    if action == "verify-group" and method == "POST":
        group_id = body.get("group_id")
        value = body.get("value", True)
        if not group_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "group_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE groups SET is_verified = %s WHERE id = %s", (value, group_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # Официальная группа (корона)
    if action == "set-official" and method == "POST":
        group_id = body.get("group_id")
        value = body.get("value", True)
        if not group_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "group_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE groups SET is_official = %s WHERE id = %s", (value, group_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    # Список жалоб
    if action == "reports" and method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT r.id, r.reporter_id, ur.username as reporter_name,
                      r.target_user_id, ut.username as target_name,
                      r.reason, r.created_at, r.is_reviewed
               FROM reports r
               JOIN users ur ON r.reporter_id = ur.user_id
               LEFT JOIN users ut ON r.target_user_id = ut.user_id
               ORDER BY r.is_reviewed ASC, r.created_at DESC"""
        )
        rows = cur.fetchall()
        conn.close()
        reports = [{
            "id": r[0], "reporter_id": r[1], "reporter_name": r[2],
            "target_user_id": r[3], "target_name": r[4],
            "reason": r[5], "created_at": str(r[6]), "is_reviewed": r[7]
        } for r in rows]
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"reports": reports})}

    # Отметить жалобу как рассмотренную
    if action == "review-report" and method == "POST":
        report_id = body.get("report_id")
        if not report_id:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "report_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE reports SET is_reviewed = TRUE WHERE id = %s", (report_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"error": "Not found"})}