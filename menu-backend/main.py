import uuid
from contextlib import asynccontextmanager

import aiosqlite
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    DATABASE_URL,
    get_or_create_user,
    get_scan,
    get_user_scans,
    init_db,
    save_scan,
    update_dietary_profile,
)
from agents.menu_analyzer import analyze_menu, apply_fit_scores

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="MenuLens API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    image_base64: str
    media_type: str = "image/jpeg"
    user_id: str = "anonymous"


class ProfileRequest(BaseModel):
    user_id: str
    goal: str = "none"
    diet_type: str = "none"
    allergens: list[str] = []


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "menulens"}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    async with aiosqlite.connect(DATABASE_URL) as db:
        user = await get_or_create_user(db, req.user_id)

        try:
            menu_data = await analyze_menu(req.image_base64, req.media_type)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Could not analyze image: {str(e)}")

        menu_data = apply_fit_scores(menu_data, user["dietary_profile"])

        scan_id = str(uuid.uuid4())
        await save_scan(db, scan_id, req.user_id, menu_data)

    return {"scan_id": scan_id, **menu_data}


@app.get("/api/users/{user_id}/profile")
async def get_profile(user_id: str):
    async with aiosqlite.connect(DATABASE_URL) as db:
        user = await get_or_create_user(db, user_id)
    return user["dietary_profile"]


@app.put("/api/users/{user_id}/profile")
async def update_profile(user_id: str, req: ProfileRequest):
    profile = {
        "goal": req.goal,
        "diet_type": req.diet_type,
        "allergens": req.allergens,
    }
    async with aiosqlite.connect(DATABASE_URL) as db:
        await get_or_create_user(db, user_id)
        await update_dietary_profile(db, user_id, profile)
    return {"success": True}


@app.get("/api/users/{user_id}/history")
async def get_history(user_id: str):
    async with aiosqlite.connect(DATABASE_URL) as db:
        scans = await get_user_scans(db, user_id)
    return {"scans": scans}


@app.get("/api/scans/{scan_id}")
async def get_scan_detail(scan_id: str):
    async with aiosqlite.connect(DATABASE_URL) as db:
        scan = await get_scan(db, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan
