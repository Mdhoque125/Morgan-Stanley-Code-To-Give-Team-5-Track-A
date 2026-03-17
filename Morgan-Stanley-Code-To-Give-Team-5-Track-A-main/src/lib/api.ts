/**
 * REST API client for the FastAPI backend.
 * In the browser we use relative /api/* so Next.js rewrites proxy to the backend.
 * On the server we use NEXT_PUBLIC_API_URL (default: http://localhost:8000).
 */

import { supabase } from "@/lib/supabase";

function getBaseUrl(): string {
  // Use full backend URL everywhere so the browser sends requests directly to the backend.
  // That way the Authorization header is always sent (Next.js rewrites may not forward it).
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

function apiUrl(path: string): string {
  const base = getBaseUrl();
  if (!base) return path; // relative path for proxy
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : "/" + path}`;
}

export type ApiError = { message: string; status?: number; detail?: unknown };

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? (body as { detail: unknown }).detail
        : String(body || res.statusText);
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d?.msg ?? JSON.stringify(d)).join(", ")
          : JSON.stringify(detail);
    const err: ApiError = { message, status: res.status, detail };
    throw err;
  }

  return body as T;
}

/** Get headers with Bearer token for authenticated requests. Throws if not logged in. */
async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated. Please log in.");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export type ListEventsParams = {
  city?: string;
  date?: string; // YYYY-MM-DD
  upcoming_only?: boolean;
};

/** Raw event row as returned by the API (may use lng or long from DB) */
export interface ApiEventRow {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city?: string;
  lat: number;
  lng?: number;
  long?: number;
  start_time: string;
  end_time: string;
  organizer_name: string;
  created_by_user_id: string | null;
  event_attendees?: { user_id: string }[] | null;
}

export interface ListEventsResponse {
  events: ApiEventRow[];
  count: number;
}

export async function getEvents(
  params?: ListEventsParams
): Promise<ListEventsResponse> {
  const path = "/api/events";
  const url = new URL(path, getBaseUrl() || "http://localhost:3000");
  if (params?.city) url.searchParams.set("city", params.city);
  if (params?.date) url.searchParams.set("date", params.date);
  if (params?.upcoming_only !== undefined)
    url.searchParams.set("upcoming_only", String(params.upcoming_only));
  const fetchUrl = getBaseUrl() ? url.toString() : url.pathname + url.search;

  const res = await fetch(fetchUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return handleResponse<ListEventsResponse>(res);
}

export interface CreateEventBody {
  title: string;
  description?: string | null;
  address: string;
  city?: string | null;
  lat: number;
  long: number; // backend expects "long"
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  organizer_name: string;
  created_by_user_id?: string | null;
}

export async function createEvent(body: CreateEventBody): Promise<ApiEventRow> {
  const headers = await authHeaders();
  const { created_by_user_id: _omit, ...payload } = body as CreateEventBody & { created_by_user_id?: string | null };
  const res = await fetch(apiUrl("/api/events"), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse<ApiEventRow>(res);
}

export interface UserProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(apiUrl(`/api/users/${encodeURIComponent(userId)}`), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return handleResponse<UserProfile>(res);
}

export async function joinEvent(eventId: string): Promise<{ event_id: string; user_id: string }> {
  const headers = await authHeaders();
  const res = await fetch(apiUrl(`/api/events/${encodeURIComponent(eventId)}/attendees`), {
    method: "POST",
    headers,
    body: "{}",
  });
  return handleResponse<{ event_id: string; user_id: string }>(res);
}

export async function leaveEvent(eventId: string): Promise<{ ok: boolean }> {
  const headers = await authHeaders();
  const res = await fetch(
    apiUrl(`/api/events/${encodeURIComponent(eventId)}/attendees/me`),
    { method: "DELETE", headers }
  );
  return handleResponse<{ ok: boolean }>(res);
}

export interface WeeklySummaryTopOrganization {
  organizer: string;
  attendance: number;
  events: number;
}

export interface WeeklyEngagementSummaryStats {
  week_start_iso: string;
  week_end_iso: string;
  current_week_engagement: number;
  current_week_unique_volunteers: number;
  current_week_events: number;
  current_week_first_time: number;
  current_week_returning: number;
  total_engagement: number;
  unique_volunteers_total: number;
  upcoming_events: number;
  past_events: number;
  recurring_volunteers: number;
  one_time_volunteers: number;
  avg_participation_per_week: number;
  weekly_growth_rate: number;
  trend_direction: "increasing" | "decreasing" | "flat";
  network_coverage_ratio?: string | null;
  top_organizations: WeeklySummaryTopOrganization[];
}

export interface WeeklyEngagementSummaryResponse {
  summary: string;
  week_key: string;
  last_updated: string;
  cached: boolean;
  stale: boolean;
  stats_hash_match: boolean;
  error?: string;
}

export async function getWeeklyEngagementSummary(
  stats: WeeklyEngagementSummaryStats
): Promise<WeeklyEngagementSummaryResponse> {
  const res = await fetch(apiUrl("/api/zesty/weekly-summary"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ stats }),
  });
  return handleResponse<WeeklyEngagementSummaryResponse>(res);
}

export interface ApiScoreboardRow {
  user_id: string;
  points: number;
  flyers_posted?: number | null;
  events_joined?: number | null;
  event_joined?: number | null;
  updated_at?: string | null;
  profiles?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface GetScoreboardResponse {
  scoreboard: ApiScoreboardRow[];
}

export async function getScoreboard(limit = 100): Promise<GetScoreboardResponse> {
  const url = new URL(apiUrl("/api/scoreboard"));
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return handleResponse<GetScoreboardResponse>(res);
}

export async function incrementScore(
  userId: string,
  action: "flyer_posted" | "event_joined"
): Promise<{ user_id: string; action: string; points_awarded: number }> {
  const res = await fetch(apiUrl(`/api/scoreboard/${encodeURIComponent(userId)}/increment`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ action }),
  });
  return handleResponse<{ user_id: string; action: string; points_awarded: number }>(res);
}

export async function decrementScore(
  userId: string,
  action: "flyer_posted" | "event_joined"
): Promise<{ user_id: string; action: string; points_removed: number }> {
  const res = await fetch(apiUrl(`/api/scoreboard/${encodeURIComponent(userId)}/decrement`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ action }),
  });
  return handleResponse<{ user_id: string; action: string; points_removed: number }>(res);
}

// ─── Chat (room_id = event_id) ───────────────────────────────────────────────

/** Raw message row from GET /api/chat/{room_id}/messages */
export interface ApiChatMessageRow {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  sent_at: string;
  profiles?: { display_name: string | null } | null;
}

export interface GetChatMessagesResponse {
  messages: ApiChatMessageRow[];
}

export async function getChatMessages(
  roomId: string,
  limit?: number
): Promise<GetChatMessagesResponse> {
  const url = new URL(
    apiUrl(`/api/chat/${encodeURIComponent(roomId)}/messages`)
  );
  if (limit != null) url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return handleResponse<GetChatMessagesResponse>(res);
}

export interface SendChatMessageResponse {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  sent_at: string;
  profiles?: { display_name: string | null } | null;
}

export async function sendChatMessage(
  roomId: string,
  content: string
): Promise<SendChatMessageResponse> {
  const headers = await authHeaders();
  const res = await fetch(
    apiUrl(`/api/chat/${encodeURIComponent(roomId)}/messages`),
    {
      method: "POST",
      headers,
      body: JSON.stringify({ content: content.trim() }),
    }
  );
  return handleResponse<SendChatMessageResponse>(res);
}

export interface GetPresenceResponse {
  user_ids: string[];
}

export async function getChatPresence(
  roomId: string
): Promise<GetPresenceResponse> {
  const res = await fetch(
    apiUrl(`/api/chat/${encodeURIComponent(roomId)}/presence`),
    { method: "GET", headers: { Accept: "application/json" } }
  );
  return handleResponse<GetPresenceResponse>(res);
}

export async function postChatPresence(roomId: string): Promise<{ ok: boolean }> {
  const headers = await authHeaders();
  const res = await fetch(
    apiUrl(`/api/chat/${encodeURIComponent(roomId)}/presence`),
    { method: "POST", headers }
  );
  return handleResponse<{ ok: boolean }>(res);
}
