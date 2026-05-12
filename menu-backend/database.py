import json
import aiosqlite

DATABASE_URL = "menulens.db"


async def init_db():
    async with aiosqlite.connect(DATABASE_URL) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                dietary_profile TEXT DEFAULT '{}',
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                restaurant_name TEXT,
                cuisine_type TEXT,
                result_json TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        await db.commit()


async def get_or_create_user(db: aiosqlite.Connection, user_id: str) -> dict:
    async with db.execute(
        "SELECT id, dietary_profile FROM users WHERE id = ?", (user_id,)
    ) as cursor:
        row = await cursor.fetchone()

    if not row:
        await db.execute("INSERT INTO users (id) VALUES (?)", (user_id,))
        await db.commit()
        return {"id": user_id, "dietary_profile": {}}

    return {"id": row[0], "dietary_profile": json.loads(row[1])}


async def update_dietary_profile(db: aiosqlite.Connection, user_id: str, profile: dict):
    await db.execute(
        "UPDATE users SET dietary_profile = ? WHERE id = ?",
        (json.dumps(profile), user_id),
    )
    await db.commit()


async def save_scan(db: aiosqlite.Connection, scan_id: str, user_id: str, menu_data: dict):
    await db.execute(
        "INSERT INTO scans (id, user_id, restaurant_name, cuisine_type, result_json) VALUES (?, ?, ?, ?, ?)",
        (
            scan_id,
            user_id,
            menu_data.get("restaurant_name"),
            menu_data.get("cuisine_type"),
            json.dumps(menu_data),
        ),
    )
    await db.commit()


async def get_user_scans(db: aiosqlite.Connection, user_id: str) -> list[dict]:
    async with db.execute(
        "SELECT id, restaurant_name, cuisine_type, result_json, created_at FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        (user_id,),
    ) as cursor:
        rows = await cursor.fetchall()

    return [
        {
            "id": row[0],
            "restaurant_name": row[1],
            "cuisine_type": row[2],
            "items_count": len(json.loads(row[3]).get("items", [])),
            "created_at": row[4],
        }
        for row in rows
    ]


async def get_scan(db: aiosqlite.Connection, scan_id: str) -> dict | None:
    async with db.execute(
        "SELECT result_json FROM scans WHERE id = ?", (scan_id,)
    ) as cursor:
        row = await cursor.fetchone()

    return json.loads(row[0]) if row else None
