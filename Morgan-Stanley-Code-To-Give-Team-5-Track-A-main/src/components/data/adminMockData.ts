import { deriveAdminEngagementMetrics } from "@/components/admin/engagementMetrics";
import type {
  ResourceStats,
  VolunteerContact,
  WeeklyReportSummary,
} from "@/components/types/adminDashboard";
import type { FlyeringEvent } from "@/types/events";

const MAX_SPOTS = 20;

function atDayOffset(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function makeEvent(
  id: string,
  title: string,
  address: string,
  city: string,
  organizer: string,
  attendees: string[],
  startDayOffset: number,
  startHour: number
): FlyeringEvent {
  const start = atDayOffset(startDayOffset, startHour);
  const end = atDayOffset(startDayOffset, startHour + 2);

  return {
    id,
    title,
    description: `${title} community flyering push`,
    address,
    city,
    lat: 40.7128,
    lng: -74.006,
    start_time: start,
    end_time: end,
    organizer_name: organizer,
    created_by_user_id: null,
    attendees,
    spotsRemaining: Math.max(0, MAX_SPOTS - attendees.length),
  };
}

const TOTAL_UNIQUE_VOLUNTEERS = 920;
const RECURRING_VOLUNTEERS = 740;
const ONE_TIME_VOLUNTEERS = TOTAL_UNIQUE_VOLUNTEERS - RECURRING_VOLUNTEERS;
const PAST_EVENT_COUNT = 1800;
const UPCOMING_EVENT_COUNT = 220;
const ORGANIZERS = [
  "Harlem Food Coalition",
  "Bronx Mutual Aid",
  "Queens Community Kitchen",
  "City Relief Network",
  "Brooklyn Hunger Helpers",
  "East River Community Aid",
  "Uptown Neighbors Collective",
  "Sunset Outreach Partners",
];
const CITIES = ["New York", "Bronx", "Queens", "Brooklyn"];
const STREETS = [
  "Lenox Ave",
  "Prospect Ave",
  "Roosevelt Ave",
  "Flatbush Ave",
  "Broadway",
  "Delancey St",
  "Bedford Ave",
  "Parsons Blvd",
];
const PEAK_HOURS = [10, 11, 12, 14, 15, 16, 17, 18, 18, 19, 19, 20];

const recurringPool = Array.from({ length: RECURRING_VOLUNTEERS }, (_, i) =>
  `u_${String(i + 1).padStart(3, "0")}`
);
const oneTimePool = Array.from({ length: ONE_TIME_VOLUNTEERS }, (_, i) =>
  `u_${String(RECURRING_VOLUNTEERS + i + 1).padStart(3, "0")}`
);

function rotatingRecurring(start: number, count: number): string[] {
  return Array.from(
    { length: count },
    (_, idx) => recurringPool[(start + idx) % recurringPool.length]
  );
}

function generatedEventMeta(index: number) {
  const city = CITIES[index % CITIES.length];
  const street = STREETS[index % STREETS.length];
  // Intentionally weighted organizer distribution for more realistic variance.
  const organizerPattern = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5, 6, 7];
  const organizer = ORGANIZERS[organizerPattern[index % organizerPattern.length]];
  const title = `${city} Outreach Wave #${index + 1}`;
  const address = `${100 + (index % 900)} ${street}`;
  return { city, street, organizer, title, address };
}

function pastEventDayOffset(index: number): number {
  const remaining = PAST_EVENT_COUNT - index;
  const cadenceJitter = (index % 7) - (index % 3);
  return -(Math.floor(remaining * 1.85 + cadenceJitter) + 2);
}

function upcomingEventDayOffset(index: number): number {
  const weekPhase = [2, 3, 5, 6, 8, 9, 11][index % 7];
  return weekPhase + Math.floor(index / 7) * 7;
}

function eventStartHour(index: number): number {
  return PEAK_HOURS[(index * 5 + Math.floor(index / 9)) % PEAK_HOURS.length];
}

const pastEvents = Array.from({ length: PAST_EVENT_COUNT }, (_, i) => {
  const meta = generatedEventMeta(i);
  const burstBoost = i % 29 === 0 ? 6 : i % 11 === 0 ? 3 : 0;
  const dipPenalty = i % 13 === 0 ? 3 : 0;
  const baseAttendance = Math.max(5, Math.min(20, 8 + (i % 12) + burstBoost - dipPenalty));
  const attendees = rotatingRecurring(i * 5, baseAttendance);
  if (i < oneTimePool.length && i % 3 !== 0) {
    attendees.push(oneTimePool[i]);
  }
  if (i % 17 === 0 && i + 1 < oneTimePool.length) {
    attendees.push(oneTimePool[(i + 1) % oneTimePool.length]);
  }
  return makeEvent(
    `evt_past_${String(i + 1).padStart(4, "0")}`,
    meta.title,
    meta.address,
    meta.city,
    meta.organizer,
    attendees,
    pastEventDayOffset(i),
    eventStartHour(i)
  );
});

const upcomingEvents = Array.from({ length: UPCOMING_EVENT_COUNT }, (_, i) => {
  const meta = generatedEventMeta(PAST_EVENT_COUNT + i);
  const burstBoost = i % 10 === 0 ? 4 : 0;
  const plannedAttendance = Math.max(6, Math.min(20, 7 + ((i * 3) % 11) + burstBoost));
  return makeEvent(
    `evt_upcoming_${String(i + 1).padStart(3, "0")}`,
    meta.title,
    meta.address,
    meta.city,
    meta.organizer,
    rotatingRecurring((PAST_EVENT_COUNT + i) * 7, plannedAttendance),
    upcomingEventDayOffset(i),
    eventStartHour(PAST_EVENT_COUNT + i)
  );
});

export const mockEvents: FlyeringEvent[] = [...pastEvents, ...upcomingEvents];

export const mockAdminMetrics = deriveAdminEngagementMetrics(mockEvents);
const projectedTotalResources = Math.max(
  2500,
  Math.round(mockAdminMetrics.uniqueVolunteersCount * 7.5)
);
const projectedPantries = Math.round(projectedTotalResources * 0.69);
const projectedKitchens = Math.round(projectedTotalResources * 0.22);
const projectedOpenToday = Math.round(projectedTotalResources * 0.28);
const projectedOpenThisWeek = Math.round(projectedTotalResources * 0.49);

export const mockResourceStats: ResourceStats = {
  total: projectedTotalResources,
  pantries: projectedPantries,
  kitchens: projectedKitchens,
  openToday: projectedOpenToday,
  openThisWeek: projectedOpenThisWeek,
};

export const mockCoverageRatio = (
  mockResourceStats.total && mockResourceStats.total > 0
    ? (mockEvents.length / mockResourceStats.total) * 100
    : null
)?.toFixed(2) ?? null;

function statusFromDaysAgo(daysAgo: number): VolunteerContact["status"] {
  if (daysAgo <= 21) return "active";
  if (daysAgo <= 56) return "warm";
  return "inactive";
}

function syntheticLastAttendedDate(index: number, fallbackIso: string): string {
  // Deterministic spread for mock CRM states: active (60%), warm (25%), inactive (15%).
  const tier = index % 20;
  const now = new Date();
  const shifted = new Date(now);

  if (tier < 12) {
    shifted.setDate(now.getDate() - (tier % 14));
    return shifted.toISOString();
  }
  if (tier < 17) {
    shifted.setDate(now.getDate() - (28 + (tier % 21)));
    return shifted.toISOString();
  }
  if (tier < 20) {
    shifted.setDate(now.getDate() - (70 + (tier % 40)));
    return shifted.toISOString();
  }

  return fallbackIso;
}

function contactNameForUser(userId: string): string {
  const num = Number(userId.replace("u_", "")) || 0;
  const first = [
    "Avery",
    "Jordan",
    "Taylor",
    "Morgan",
    "Riley",
    "Casey",
    "Cameron",
    "Parker",
    "Quinn",
    "Skyler",
  ];
  const last = [
    "Nguyen",
    "Patel",
    "Rivera",
    "Kim",
    "Morris",
    "Lopez",
    "Ali",
    "Jackson",
    "Chen",
    "Singh",
  ];
  return `${first[num % first.length]} ${last[(num * 3) % last.length]}`;
}

export const mockContacts: VolunteerContact[] = (() => {
  const attendanceCount = new Map<string, number>();
  const lastAttended = new Map<string, string>();

  for (const event of mockEvents) {
    if (new Date(event.start_time) > new Date()) {
      continue;
    }
    for (const userId of event.attendees) {
      attendanceCount.set(userId, (attendanceCount.get(userId) ?? 0) + 1);
      const existing = lastAttended.get(userId);
      if (!existing || new Date(event.start_time) > new Date(existing)) {
        lastAttended.set(userId, event.start_time);
      }
    }
  }

  const generatedFromAttendance = [...attendanceCount.entries()]
    .map(([id, totalEventsAttended], idx) => {
      const derivedLastDate = lastAttended.get(id) ?? new Date().toISOString();
      const lastDate = syntheticLastAttendedDate(idx, derivedLastDate);
      const daysAgo = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
      return {
        id,
        name: contactNameForUser(id),
        email: `${id}@lemontree-volunteers.org`,
        phone: `+1 (555) 01${String(idx).padStart(2, "0")}`,
        neighborhood: ["Harlem", "Bronx", "Queens", "Brooklyn", "Midtown"][idx % 5],
        totalEventsAttended,
        lastAttendedDate: lastDate,
        status: statusFromDaysAgo(daysAgo),
      };
    })
    .sort((a, b) => b.totalEventsAttended - a.totalEventsAttended);

  const neighborhoods = [
    "Harlem",
    "Bronx",
    "Queens",
    "Brooklyn",
    "Midtown",
    "Lower East Side",
    "Upper West Side",
    "Astoria",
    "Bushwick",
    "Sunset Park",
  ];
  const extraDummyContacts: VolunteerContact[] = Array.from({ length: 100 }, (_, idx) => {
    const id = `dummy_contact_${String(idx + 1).padStart(3, "0")}`;
    const recentDate = syntheticLastAttendedDate(idx + 500, new Date().toISOString());
    const daysAgo = Math.floor((Date.now() - new Date(recentDate).getTime()) / 86400000);
    return {
      id,
      name: contactNameForUser(`u_${String(idx + 501).padStart(3, "0")}`),
      email: `${id}@lemontree-volunteers.org`,
      phone: `+1 (555) 99${String(idx).padStart(2, "0")}`,
      neighborhood: neighborhoods[idx % neighborhoods.length],
      totalEventsAttended: 1 + (idx % 6),
      lastAttendedDate: recentDate,
      status: statusFromDaysAgo(daysAgo),
    };
  });

  return [...generatedFromAttendance, ...extraDummyContacts].sort(
    (a, b) => b.totalEventsAttended - a.totalEventsAttended
  );
})();

export const mockWeeklyReports: WeeklyReportSummary[] = (() => {
  const buckets = mockAdminMetrics.weeklyBuckets.filter(
    (w) => w.eventCount > 0 || w.attendanceCount > 0
  );

  const result: WeeklyReportSummary[] = buckets.slice(-16).map((week) => {
    const weekStart = new Date(week.weekKey);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekEvents = mockEvents.filter((event) => {
      const d = new Date(event.start_time);
      return d >= weekStart && d <= weekEnd;
    });

    const orgAttendance = new Map<string, number>();
    for (const event of weekEvents) {
      orgAttendance.set(
        event.organizer_name,
        (orgAttendance.get(event.organizer_name) ?? 0) + (event.attendees?.length ?? 0)
      );
    }
    const topOrganization =
      [...orgAttendance.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const recurringSharePct =
      week.attendanceCount > 0
        ? Math.round((week.returningCount / week.attendanceCount) * 100)
        : 0;

    return {
      weekLabel: week.weekLabel,
      weekStartIso: weekStart.toISOString(),
      weekEndIso: weekEnd.toISOString(),
      totalAttendance: week.attendanceCount,
      uniqueVolunteers: week.uniqueVolunteerCount,
      totalEvents: week.eventCount,
      recurringSharePct,
      topOrganization,
    };
  });

  return result.reverse();
})();
