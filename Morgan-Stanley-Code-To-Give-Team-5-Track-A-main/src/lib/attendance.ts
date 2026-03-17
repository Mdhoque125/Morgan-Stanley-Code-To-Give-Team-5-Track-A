import type { FlyeringEvent } from "@/types/events";

/** Returns whether the given user is in the event's attendees list. */
export function isUserJoined(event: FlyeringEvent, userId: string): boolean {
  return event.attendees.includes(userId);
}
