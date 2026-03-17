import { getEvents } from "./api";
import { supabase } from "./supabase";
import type { FlyeringEvent } from "@/types/events";

export async function fetchAdminEvents(): Promise<FlyeringEvent[]> {
  const { events } = await getEvents();

  return events.map((e) => ({
    id: e.id,
    title: e.title ?? "",
    description: e.description ?? "",
    address: e.address ?? "",
    city: e.city ?? "",
    lat: e.lat ?? 0,
    lng: e.lng ?? e.long ?? 0,
    start_time: e.start_time,
    end_time: e.end_time,
    organizer_name: e.organizer_name ?? "",
    created_by_user_id: e.created_by_user_id ?? null,
    attendees: (e.event_attendees ?? []).map((a) => a.user_id),
    spotsRemaining: 20 - (e.event_attendees?.length ?? 0),
  }));
}

export async function fetchAdminProfiles(): Promise<Map<string, string>> {
  const { data } = await supabase.from("profiles").select("id, display_name");
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.id, row.display_name ?? row.id);
  }
  return map;
}
