from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Literal 
from datetime import datetime, timezone
import os

from auth import get_current_user_id

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") 

if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
	raise RuntimeError ("Missing Supbase URL or Service Key in .env file")

supabase: Client = create_client (SUPABASE_URL, SUPABASE_SERVICE_KEY)

class ScoreIncrement (BaseModel):
	action: Literal["flyer_posted", "event_joined"]


POINTS = {
	"flyer_posted": 15,
	"event_joined": 10, 
}


def _get_score_field(action: str) -> str:
	return "flyers_posted" if action == "flyer_posted" else "events_joined"


@router.get("")
def get_leaderboard (limit: int = 10):
	
	result = (
		supabase.table("scoreboard")
		.select("*, profiles(display_name, avatar_url)")
		.order("points", desc=True)
		.limit(limit)
		.execute()
	)

	return {"scoreboard": result.data}


@router.get("/{user_id}")
def get_user_score (user_id: str):
	
	result = (
		supabase.table("scoreboard")
		.select("*")
		.eq("user_id", user_id)
		.single()
		.execute()
	)

	if not result.data:
		raise HTTPException(status_code=404, detail="Resource (score) not found")
	return result.data


@router.post("/{user_id}/increment", status_code=200)
def increment_score (user_id: str, body: ScoreIncrement):
	
	points = POINTS[body.action]
	field = _get_score_field(body.action)

	existing = supabase.table("scoreboard").select("*").eq("user_id", user_id).execute()

	if not existing.data:
		supabase.table("scoreboard").insert({
			"user_id": user_id,
			"points": points,
			field: 1,
			"updated_at": datetime.now(timezone.utc).isoformat()
		}).execute()
	else:
		current = existing.data[0]
		supabase.table("scoreboard").update({
			"points": current["points"] + points,
			field: current[field] + 1,
			"updated_at": datetime.now(timezone.utc).isoformat()
		}).eq("user_id", user_id).execute()

	return {"user_id": user_id, "action": body.action, "points_awarded": points}


@router.post("/{user_id}/decrement", status_code=200)
def decrement_score(user_id: str, body: ScoreIncrement):
	points = POINTS[body.action]
	field = _get_score_field(body.action)

	existing = supabase.table("scoreboard").select("*").eq("user_id", user_id).execute()
	if not existing.data:
		return {"user_id": user_id, "action": body.action, "points_removed": 0}

	current = existing.data[0]
	next_field_value = max(0, (current.get(field) or 0) - 1)
	current_points = current.get("points") or 0
	next_points = max(0, current_points - points)

	supabase.table("scoreboard").update({
		field: next_field_value,
		"points": next_points,
		"updated_at": datetime.now(timezone.utc).isoformat()
	}).eq("user_id", user_id).execute()

	return {"user_id": user_id, "action": body.action, "points_removed": min(points, current_points)}
