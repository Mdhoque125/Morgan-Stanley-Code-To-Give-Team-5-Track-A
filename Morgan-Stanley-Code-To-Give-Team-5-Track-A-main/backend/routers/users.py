# User related stuff

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client
import os

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") 

if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
	raise RuntimeError ("Missing Supbase URL or Service Key in .env file")

supabase: Client = create_client (SUPABASE_URL, SUPABASE_SERVICE_KEY)
 
router = APIRouter()
 
 
class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


@router.get("/{user_id}")
def get_profile(user_id: str):
	result = (
		supabase.table("profiles")
		.select("*")
		.eq("id", user_id)
		.single()
		.execute()

	) 

	if not result.data:
		raise HTTPException (status_code=404, detail="Resource (profile) not found")

	return result.data
		

@router.get("/{user_id}/analytics")
def user_analytics(user_id: str):
	
	created = (
		supabase.table("events")
		.select("id, title, start_time, event_attendees(user_id)")
		.eq("created_by_user_id", user_id)
		.execute()
	)

	events_created = created.data or []
	total_attendees = sum(len(e.get("event_attendees", [])) for e in events_created)


	attending = (
		supabase.table("event_attendees")
		.select("event_id, events(title, start_time, organizer_name)")
		.eq("user_id", user_id)
		.execute()
	)

	return {
		"user_id": user_id,
		"events_created_count": len(events_created),
		"total_attendees_across_events": total_attendees,
		"events_attending_count": len(attending.data or []),
		"events_created":  events_created, 
		"events_attending": attending.data or [],
	}
