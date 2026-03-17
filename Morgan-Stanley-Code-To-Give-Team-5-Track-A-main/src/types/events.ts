/**
 * Supabase schema-aligned types:
 * - events: id, title, description, address, city, lat, lng, start_time, end_time, organizer_name, created_by_user_id
 * - event_attendees: event_id, user_id
 */

/** Raw row from Supabase `events` table */
export interface EventRow {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  start_time: string;
  end_time: string;
  organizer_name: string;
  created_by_user_id: string | null;
}

/** Row from Supabase `event_attendees` table (when joined) */
export interface EventAttendeeRow {
  user_id: string;
}

/** Event as returned by Supabase with joined attendees */
export interface EventWithAttendeesRow extends EventRow {
  event_attendees: EventAttendeeRow[] | null;
}

/** UI-facing event type: DB fields + derived attendees list and spotsRemaining */
export interface FlyeringEvent {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  start_time: string;
  end_time: string;
  organizer_name: string;
  created_by_user_id: string | null;
  /** User IDs from event_attendees */
  attendees: string[];
  /** Derived for display; not stored in DB */
  spotsRemaining: number;
}

export interface NewEventFormData {
  eventName: string;
  address: string;
  lat: number;
  lng: number;
  /** ISO-ish datetime-local string for start time (from input) */
  date: string;
  /** ISO-ish datetime-local string for end time (from input) */
  endDate?: string;
  description: string;
  organization?: string;
}
