"""
Профиль пользователя: просмотр, bio, загрузка аватара/баннера, жалоба, друзья, поиск пользователей.
action: get | update | upload_avatar | upload_banner | report |
        friends_list | friends_search | friends_request | friends_accept | friends_decline | friends_remove | friends_incoming
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3



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

def upload_to_s3(data: bytes, key: str, content_type: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
    project_id = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{project_id}/bucket/{key}"

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
            "SELECT user_id, username, bio, is_admin, is_verified, is_blocked, created_at, avatar_url, banner_url FROM users WHERE user_id = %s",
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
                "is_blocked": row[5], "created_at": str(row[6]),
                "avatar_url": row[7], "banner_url": row[8]
            })
        }

    # Обновить bio
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

    # Загрузить аватар
    if action == "upload_avatar" and method == "POST":
        file_data = body.get("file")
        content_type = body.get("content_type", "image/jpeg")
        if not file_data:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "file обязателен"})}
        raw = base64.b64decode(file_data)
        if len(raw) > 5 * 1024 * 1024:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Файл слишком большой (макс 5МБ)"})}
        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        key = f"avatars/{user['user_id']}_{uuid.uuid4().hex[:8]}.{ext}"
        url = upload_to_s3(raw, key, content_type)
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE users SET avatar_url = %s WHERE user_id = %s", (url, user["user_id"]))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"url": url})}

    # Загрузить баннер
    if action == "upload_banner" and method == "POST":
        file_data = body.get("file")
        content_type = body.get("content_type", "image/jpeg")
        if not file_data:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "file обязателен"})}
        raw = base64.b64decode(file_data)
        if len(raw) > 10 * 1024 * 1024:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Файл слишком большой (макс 10МБ)"})}
        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        key = f"banners/{user['user_id']}_{uuid.uuid4().hex[:8]}.{ext}"
        url = upload_to_s3(raw, key, content_type)
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE users SET banner_url = %s WHERE user_id = %s", (url, user["user_id"]))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"url": url})}

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

    # ──────────── ДРУЗЬЯ ────────────

    if action == "friends_search" and method == "GET":
        q = (qs.get("q") or "").strip()
        if len(q) < 1:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите запрос"})}
        conn = get_db()
        cur = conn.cursor()
        # Если запрос — число, ищем по user_id, иначе по username
        if q.isdigit():
            cur.execute(
                """SELECT u.user_id, u.username, u.avatar_url, u.is_verified,
                          f.status,
                          CASE WHEN f.requester_id = %s THEN 'sent' WHEN f.addressee_id = %s THEN 'received' ELSE NULL END as direction
                   FROM users u
                   LEFT JOIN friendships f ON (
                     (f.requester_id = %s AND f.addressee_id = u.user_id) OR
                     (f.addressee_id = %s AND f.requester_id = u.user_id)
                   )
                   WHERE (u.user_id = %s OR LOWER(u.username) LIKE LOWER(%s)) AND u.user_id != %s AND u.is_blocked = FALSE
                   LIMIT 20""",
                (uid, uid, uid, uid, int(q), f"%{q}%", uid)
            )
        else:
            if len(q) < 2:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Минимум 2 символа"})}
            cur.execute(
                """SELECT u.user_id, u.username, u.avatar_url, u.is_verified,
                          f.status,
                          CASE WHEN f.requester_id = %s THEN 'sent' WHEN f.addressee_id = %s THEN 'received' ELSE NULL END as direction
                   FROM users u
                   LEFT JOIN friendships f ON (
                     (f.requester_id = %s AND f.addressee_id = u.user_id) OR
                     (f.addressee_id = %s AND f.requester_id = u.user_id)
                   )
                   WHERE LOWER(u.username) LIKE LOWER(%s) AND u.user_id != %s AND u.is_blocked = FALSE
                   LIMIT 20""",
                (uid, uid, uid, uid, f"%{q}%", uid)
            )
        rows = cur.fetchall()
        conn.close()
        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({"users": [
                {"user_id": r[0], "username": r[1], "avatar_url": r[2],
                 "is_verified": r[3], "friendship_status": r[4], "direction": r[5]}
                for r in rows
            ]})
        }

    if action == "friends_list" and method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT u.user_id, u.username, u.avatar_url, u.is_verified
               FROM friendships f
               JOIN users u ON (
                 CASE WHEN f.requester_id = %s THEN f.addressee_id ELSE f.requester_id END = u.user_id
               )
               WHERE (f.requester_id = %s OR f.addressee_id = %s) AND f.status = 'accepted'
               ORDER BY u.username""",
            (uid, uid, uid)
        )
        rows = cur.fetchall()
        conn.close()
        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({"friends": [
                {"user_id": r[0], "username": r[1], "avatar_url": r[2], "is_verified": r[3]}
                for r in rows
            ]})
        }

    if action == "friends_incoming" and method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """SELECT u.user_id, u.username, u.avatar_url, f.id
               FROM friendships f
               JOIN users u ON f.requester_id = u.user_id
               WHERE f.addressee_id = %s AND f.status = 'pending'
               ORDER BY f.created_at DESC""",
            (uid,)
        )
        rows = cur.fetchall()
        conn.close()
        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({"incoming": [
                {"user_id": r[0], "username": r[1], "avatar_url": r[2], "friendship_id": r[3]}
                for r in rows
            ]})
        }

    if action == "friends_request" and method == "POST":
        target_id = body.get("user_id")
        if not target_id or target_id == uid:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Некорректный user_id"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO friendships (requester_id, addressee_id, status)
               VALUES (%s, %s, 'pending')
               ON CONFLICT (requester_id, addressee_id) DO NOTHING""",
            (uid, target_id)
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    if action == "friends_accept" and method == "POST":
        friendship_id = body.get("friendship_id")
        if not friendship_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "friendship_id обязателен"})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE friendships SET status = 'accepted' WHERE id = %s AND addressee_id = %s",
            (friendship_id, uid)
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    if action in ("friends_decline", "friends_remove") and method == "POST":
        target_id = body.get("user_id")
        friendship_id = body.get("friendship_id")
        conn = get_db()
        cur = conn.cursor()
        if friendship_id:
            cur.execute(
                "DELETE FROM friendships WHERE id = %s AND (requester_id = %s OR addressee_id = %s)",
                (friendship_id, uid, uid)
            )
        elif target_id:
            cur.execute(
                """DELETE FROM friendships WHERE
                   (requester_id = %s AND addressee_id = %s) OR
                   (requester_id = %s AND addressee_id = %s)""",
                (uid, target_id, target_id, uid)
            )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}