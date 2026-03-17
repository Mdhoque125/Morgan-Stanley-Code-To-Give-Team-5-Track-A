"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchAdminEvents, fetchAdminProfiles } from "@/lib/fetchAdminData";
import { deriveAdminEngagementMetrics } from "@/components/admin/engagementMetrics";
import type {
  AdminEngagementMetrics,
  ResourceStats,
  VolunteerContact,
} from "@/components/types/adminDashboard";
import type { FlyeringEvent } from "@/types/events";

const BASE = "https://platform.foodhelpline.org";

async function fetchCount(params: Record<string, string>): Promise<number> {
  const qs = new URLSearchParams({ take: "1", ...params });
  const res = await fetch(`${BASE}/api/resources?${qs}`);
  const raw = await res.json();
  return (raw.json?.count ?? 0) as number;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return `${start.toISOString()}/${end.toISOString()}`;
}

function weekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return `${start.toISOString()}/${end.toISOString()}`;
}

async function fetchResourceStats(): Promise<ResourceStats | null> {
  try {
    const [total, pantries, kitchens, openToday, openThisWeek] = await Promise.all([
      fetchCount({}),
      fetchCount({ resourceTypeId: "FOOD_PANTRY" }),
      fetchCount({ resourceTypeId: "SOUP_KITCHEN" }),
      fetchCount({ occurrencesWithin: todayRange() }),
      fetchCount({ occurrencesWithin: weekRange() }),
    ]);
    return { total, pantries, kitchens, openToday, openThisWeek };
  } catch {
    return null;
  }
}

type AdminDataContextValue = {
  events: FlyeringEvent[];
  metrics: AdminEngagementMetrics | null;
  contacts: VolunteerContact[];
  resourceStats: ResourceStats | null;
  coverageRatio: string | null;
  loading: boolean;
  error: string | null;
};

const AdminDataContext = createContext<AdminDataContextValue>({
  events: [],
  metrics: null,
  contacts: [],
  resourceStats: null,
  coverageRatio: null,
  loading: true,
  error: null,
});

export function useAdminData() {
  return useContext(AdminDataContext);
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<AdminDataContextValue>({
    events: [],
    metrics: null,
    contacts: [],
    resourceStats: null,
    coverageRatio: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const [events, profileMap, resourceStats] = await Promise.all([
          fetchAdminEvents(),
          fetchAdminProfiles(),
          fetchResourceStats(),
        ]);

        const metrics = deriveAdminEngagementMetrics(events);

        const attendanceCount = new Map<string, number>();
        const lastAttended = new Map<string, string>();
        const now = new Date();

        for (const event of events) {
          if (new Date(event.start_time) > now) continue;
          for (const userId of event.attendees) {
            attendanceCount.set(userId, (attendanceCount.get(userId) ?? 0) + 1);
            const existing = lastAttended.get(userId);
            if (!existing || event.start_time > existing) {
              lastAttended.set(userId, event.start_time);
            }
          }
        }

        const contacts: VolunteerContact[] = [...attendanceCount.entries()]
          .map(([id, totalEventsAttended]) => {
            const lastDate = lastAttended.get(id) ?? now.toISOString();
            const daysAgo = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
            const status: "active" | "warm" | "inactive" =
              daysAgo <= 21 ? "active" : daysAgo <= 56 ? "warm" : "inactive";
            return {
              id,
              name: profileMap.get(id) ?? id,
              email: "—",
              phone: "—",
              neighborhood: "—",
              totalEventsAttended,
              lastAttendedDate: lastDate,
              status,
            };
          })
          .sort((a, b) => b.totalEventsAttended - a.totalEventsAttended);

        const coverageRatio =
          resourceStats?.total && resourceStats.total > 0
            ? ((events.length / resourceStats.total) * 100).toFixed(2)
            : null;

        setValue({ events, metrics, contacts, resourceStats, coverageRatio, loading: false, error: null });
      } catch {
        setValue((v) => ({ ...v, loading: false, error: "Failed to load admin data." }));
      }
    }
    load();
  }, []);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
