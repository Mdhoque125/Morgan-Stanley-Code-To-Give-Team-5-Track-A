import type { FlyeringEvent } from "@/types/events";
import type {
  AdminEngagementMetrics,
  WeeklyBucket,
} from "@/components/types/adminDashboard";

export const RECENT_WEEK_COUNT = 12;
export const TREND_WINDOW_WEEKS = 4;
export const PIE_COLORS = [
  "var(--mantine-color-blue-6)",
  "var(--mantine-color-blue-5)",
  "var(--mantine-color-blue-4)",
  "var(--mantine-color-yellow-6)",
  "var(--mantine-color-yellow-5)",
  "var(--mantine-color-teal-5)",
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function weekKey(date: Date): string {
  return startOfWeek(date).toISOString().slice(0, 10);
}

function weekLabel(date: Date): string {
  return startOfWeek(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function hourBucketLabel(hour: number): string {
  if (hour < 6) return "Night";
  if (hour < 10) return "Morning";
  if (hour < 14) return "Midday";
  if (hour < 18) return "Afternoon";
  if (hour < 22) return "Evening";
  return "Late";
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildWeeklyBuckets(events: FlyeringEvent[], weekCount: number): WeeklyBucket[] {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);

  const weekStarts = Array.from({ length: weekCount }, (_, index) => {
    const d = new Date(thisWeekStart);
    d.setDate(d.getDate() - (weekCount - 1 - index) * 7);
    return d;
  });

  const indexByWeek = new Map<string, number>();
  const rows = weekStarts.map((start) => {
    const key = start.toISOString().slice(0, 10);
    indexByWeek.set(key, indexByWeek.size);
    return {
      weekKey: key,
      weekLabel: weekLabel(start),
      attendanceCount: 0,
      uniqueVolunteerCount: 0,
      eventCount: 0,
      firstTimeCount: 0,
      returningCount: 0,
    };
  });

  const volunteersByWeek = rows.map(() => new Set<string>());
  const seenVolunteers = new Set<string>();

  const sorted = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const event of sorted) {
    const eventDate = new Date(event.start_time);
    const key = weekKey(eventDate);
    const idx = indexByWeek.get(key);
    if (idx == null) continue;

    rows[idx].eventCount += 1;
    const attendees = event.attendees ?? [];
    rows[idx].attendanceCount += attendees.length;

    for (const userId of attendees) {
      volunteersByWeek[idx].add(userId);
      if (seenVolunteers.has(userId)) {
        rows[idx].returningCount += 1;
      } else {
        rows[idx].firstTimeCount += 1;
        seenVolunteers.add(userId);
      }
    }
  }

  return rows.map((row, index) => ({
    ...row,
    uniqueVolunteerCount: volunteersByWeek[index].size,
  }));
}

export function deriveAdminEngagementMetrics(events: FlyeringEvent[]): AdminEngagementMetrics {
  const now = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const pastEvents = events
    .filter((e) => new Date(e.start_time) <= now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const totalAttendance = events.reduce((sum, e) => sum + (e.attendees?.length ?? 0), 0);
  const uniqueVolunteers = new Set(events.flatMap((e) => e.attendees ?? []));
  const attendanceByVolunteer = new Map<string, number>();
  for (const event of events) {
    for (const userId of event.attendees ?? []) {
      attendanceByVolunteer.set(userId, (attendanceByVolunteer.get(userId) ?? 0) + 1);
    }
  }
  const recurringVolunteers = [...attendanceByVolunteer.values()].filter((count) => count > 1).length;
  const oneTimeVolunteers = [...attendanceByVolunteer.values()].filter((count) => count === 1).length;

  const weeklyBuckets = buildWeeklyBuckets(events, RECENT_WEEK_COUNT);
  const recentTrend = weeklyBuckets.slice(-TREND_WINDOW_WEEKS);
  const previousTrend = weeklyBuckets.slice(-TREND_WINDOW_WEEKS * 2, -TREND_WINDOW_WEEKS);
  const currentAttendance = recentTrend.reduce((sum, row) => sum + row.attendanceCount, 0);
  const previousAttendance = previousTrend.reduce((sum, row) => sum + row.attendanceCount, 0);
  const attendanceDeltaPct = pctChange(currentAttendance, previousAttendance);
  const trendDirection =
    attendanceDeltaPct > 0 ? "increasing" : attendanceDeltaPct < 0 ? "decreasing" : "flat";
  const avgParticipationPerWeek = average(weeklyBuckets.map((row) => row.attendanceCount));

  const organizerMap = new Map<string, { attendance: number; events: number }>();
  for (const event of events) {
    const organizer = event.organizer_name?.trim() || "Unknown";
    const existing = organizerMap.get(organizer) ?? { attendance: 0, events: 0 };
    organizerMap.set(organizer, {
      attendance: existing.attendance + (event.attendees?.length ?? 0),
      events: existing.events + 1,
    });
  }
  const topOrganizations = [...organizerMap.entries()]
    .map(([organizer, data]) => ({
      organizer,
      attendance: data.attendance,
      events: data.events,
    }))
    .sort((a, b) => b.attendance - a.attendance)
    .slice(0, 8);

  const recurringBreakdown = [
    { label: "Recurring volunteers", value: recurringVolunteers },
    { label: "One-time volunteers", value: oneTimeVolunteers },
  ];

  const histogramRows = [
    { bucket: "1 event", count: 0 },
    { bucket: "2 events", count: 0 },
    { bucket: "3 events", count: 0 },
    { bucket: "4 events", count: 0 },
    { bucket: "5+ events", count: 0 },
  ];
  for (const count of attendanceByVolunteer.values()) {
    if (count <= 1) histogramRows[0].count += 1;
    else if (count === 2) histogramRows[1].count += 1;
    else if (count === 3) histogramRows[2].count += 1;
    else if (count === 4) histogramRows[3].count += 1;
    else histogramRows[4].count += 1;
  }

  const heatRows = ["Night", "Morning", "Midday", "Afternoon", "Evening", "Late"];
  const heatDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heatBase = new Map<string, number>();
  for (const day of heatDays) {
    for (const row of heatRows) {
      heatBase.set(`${day}-${row}`, 0);
    }
  }
  for (const event of events) {
    const d = new Date(event.start_time);
    const key = `${heatDays[d.getDay()]}-${hourBucketLabel(d.getHours())}`;
    const weight = Math.max(1, event.attendees?.length ?? 0);
    heatBase.set(key, (heatBase.get(key) ?? 0) + weight);
  }
  const heatmapData: AdminEngagementMetrics["heatmapData"] = [];
  let maxHeatValue = 1;
  for (const day of heatDays) {
    for (const row of heatRows) {
      const value = heatBase.get(`${day}-${row}`) ?? 0;
      maxHeatValue = Math.max(maxHeatValue, value);
      heatmapData.push({ day, hourBucket: row, value });
    }
  }

  return {
    upcomingEvents,
    pastEvents,
    totalAttendance,
    uniqueVolunteersCount: uniqueVolunteers.size,
    recurringVolunteers,
    oneTimeVolunteers,
    weeklyBuckets,
    attendanceDeltaPct,
    trendDirection,
    avgParticipationPerWeek,
    topOrganizations,
    recurringBreakdown,
    histogramRows,
    heatRows,
    heatDays,
    heatmapData,
    maxHeatValue,
  };
}
