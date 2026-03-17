import json
import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

COHERE_API_KEY = os.environ.get("COHERE_API_KEY")

SYSTEM_PROMPT = """You are Zesty, the intelligent admin assistant for LemonTree — a volunteer flyering coordination platform focused on food access and community outreach.

**What LemonTree does:**
LemonTree connects volunteers with flyering events at food resources across its network. Volunteers discover events on a map, join them (max 20 per event), download area flyers from the Food HelpLine platform, post them in the community, and earn points. Organizers create events tied to specific addresses (geocoded via Mapbox). The goal is to increase awareness of food resources (food pantries, soup kitchens, etc.) in underserved communities.

**Volunteer scoring system:**
- 15 points per flyer posted
- 10 points per event joined
- Volunteers are ranked on a leaderboard by total points

**Event structure:**
Each flyering event has: title, description, address, city, lat/lng coordinates, start/end time (2-hour blocks), organizer name, and a list of attendee user IDs. Max 20 volunteers per event.

**Resource network:**
The Lemontree Resource Network is sourced from the Food HelpLine platform API. It tracks total food resources, food pantries, soup kitchens, and how many are open today or this week. Network coverage is calculated as: (total flyering events / total resources) x 100%.

**Your role:**
You are speaking directly with a LemonTree team member. Be direct, analytical, and data-driven. You have access to live platform data passed with each message — reference it specifically when answering. You can:
- Analyze event attendance, volunteer engagement, and coverage gaps
- Interpret trends, anomalies, or areas of concern
- Suggest operational improvements, outreach strategies, resource prioritization
- Help the team think through platform and community impact decisions
- Flag low coverage areas, underattended events, or scheduling patterns

Keep responses concise and actionable. You are a strategic collaborator, not a generic chatbot. Always respond in plain text only — no markdown, no bullet symbols, no asterisks, no headers, no special formatting characters of any kind."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ZestyRequest(BaseModel):
    messages: list[ChatMessage]
    context: Optional[str] = None


class TopOrganizationStat(BaseModel):
    organizer: str
    attendance: int
    events: int


class WeeklySummaryStats(BaseModel):
    week_start_iso: str
    week_end_iso: str
    current_week_engagement: int
    current_week_unique_volunteers: int
    current_week_events: int
    current_week_first_time: int
    current_week_returning: int
    total_engagement: int
    unique_volunteers_total: int
    upcoming_events: int
    past_events: int
    recurring_volunteers: int
    one_time_volunteers: int
    avg_participation_per_week: float
    weekly_growth_rate: float
    trend_direction: str
    network_coverage_ratio: Optional[str] = None
    top_organizations: list[TopOrganizationStat]


class WeeklySummaryRequest(BaseModel):
    stats: WeeklySummaryStats


VOLUNTEER_SYSTEM_PROMPT = """You are Zesty, a friendly assistant for LemonTree volunteers — a platform that connects people with flyering events to help spread awareness of local food resources like food pantries and soup kitchens.

**Your role:**
Help volunteers get the most out of their experience. You can help them:
- Find and understand upcoming flyering events near them
- Understand how the flyering process works
- Learn how to download area flyers and where to post them
- Track their points and understand the scoring system
- Get motivated and feel good about the impact they're making

**How flyering works:**
1. Browse upcoming events on the map or list
2. Join an event (max 20 volunteers per event)
3. Download the area flyer for that event's location
4. View the tutorial for tips on where and how to post flyers
5. Go out and post flyers in the community
6. Click "Poster Added" to log it and earn points

**Scoring:**
- Joining an event: 10 points
- Posting a flyer: 15 points
- Volunteers are ranked on the leaderboard by total points

**Tone:**
Be warm, encouraging, and concise. Volunteers are doing meaningful community work — acknowledge that. Keep answers short and practical. Always respond in plain text only — no markdown, no bullet symbols, no asterisks, no special formatting characters."""

WEEKLY_SUMMARY_SYSTEM_PROMPT = """You are an analytics writer for LemonTree admins.
Write a concise weekly engagement summary in plain text only.
Requirements:
- 2-4 sentences max.
- Mention if engagement increased, decreased, or stayed flat.
- Include notable metrics: current week engagement, unique volunteers, recurring vs one-time, upcoming vs past events, and top organizations.
- Sound professional and insight-driven.
- Do not use markdown, bullet symbols, or headings."""


async def call_cohere(system: str, messages: list[ChatMessage]) -> str:
    if not COHERE_API_KEY:
        raise HTTPException(status_code=500, detail="Cohere API key not configured.")

    cohere_messages = [{"role": "system", "content": system}] + [
        {"role": m.role, "content": m.content} for m in messages
    ]

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.cohere.com/v2/chat",
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": "command-r-08-2024", "messages": cohere_messages},
        )

    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.text)

    data = res.json()
    return data.get("message", {}).get("content", [{}])[0].get("text", "")



@router.post("")
async def admin_chat(req: ZestyRequest):
    system_content = SYSTEM_PROMPT
    if req.context:
        system_content += f"\n\n**Current live dashboard data:**\n{req.context}"
    text = await call_cohere(system_content, req.messages)
    return {"text": text}


@router.post("/volunteer")
async def volunteer_chat(req: ZestyRequest):
    system_content = VOLUNTEER_SYSTEM_PROMPT
    if req.context:
        system_content += f"\n\n**Upcoming events right now:**\n{req.context}"
    text = await call_cohere(system_content, req.messages)
    return {"text": text}


@router.post("/weekly-summary")
async def weekly_summary(req: WeeklySummaryRequest):
    stats = req.stats
    stats_payload = json.dumps(stats.model_dump(mode="json"), ensure_ascii=True, indent=2)
    prompt = (
        "Generate a weekly admin engagement summary from this structured data.\n"
        "Data:\n"
        f"{stats_payload}\n"
    )
    summary = (await call_cohere(
        WEEKLY_SUMMARY_SYSTEM_PROMPT,
        [ChatMessage(role="user", content=prompt)],
    )).strip()
    if not summary:
        raise HTTPException(status_code=502, detail="Cohere returned an empty weekly summary.")
    return {
        "summary": summary,
        "week_key": stats.week_start_iso[:10],
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "cached": False,
        "stale": False,
    }
