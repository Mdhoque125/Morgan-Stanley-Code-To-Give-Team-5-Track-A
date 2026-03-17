import type { FlyeringEvent } from "@/types/events";

export type ResourceStats = {
  total?: number;
  pantries?: number;
  kitchens?: number;
  openToday?: number;
  openThisWeek?: number;
};

export type WeeklyBucket = {
  weekKey: string;
  weekLabel: string;
  attendanceCount: number;
  uniqueVolunteerCount: number;
  eventCount: number;
  firstTimeCount: number;
  returningCount: number;
};

export type HeatmapCell = {
  day: string;
  hourBucket: string;
  value: number;
};

export type OrganizationParticipation = {
  organizer: string;
  attendance: number;
  events: number;
};

export type HistogramRow = {
  bucket: string;
  count: number;
};

export type RecurringBreakdownRow = {
  label: string;
  value: number;
};

export type AdminEngagementMetrics = {
  upcomingEvents: FlyeringEvent[];
  pastEvents: FlyeringEvent[];
  totalAttendance: number;
  uniqueVolunteersCount: number;
  recurringVolunteers: number;
  oneTimeVolunteers: number;
  weeklyBuckets: WeeklyBucket[];
  attendanceDeltaPct: number;
  trendDirection: "increasing" | "decreasing" | "flat";
  avgParticipationPerWeek: number;
  topOrganizations: OrganizationParticipation[];
  recurringBreakdown: RecurringBreakdownRow[];
  histogramRows: HistogramRow[];
  heatRows: string[];
  heatDays: string[];
  heatmapData: HeatmapCell[];
  maxHeatValue: number;
};

export type VolunteerContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  neighborhood: string;
  totalEventsAttended: number;
  lastAttendedDate: string;
  status: "active" | "warm" | "inactive";
};

export type WeeklyReportSummary = {
  weekLabel: string;
  weekStartIso: string;
  weekEndIso: string;
  totalAttendance: number;
  uniqueVolunteers: number;
  totalEvents: number;
  recurringSharePct: number;
  topOrganization: string;
};
