"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { getWeeklyEngagementSummary } from "@/lib/api";
import type { AdminEngagementMetrics } from "@/components/types/adminDashboard";

type WeeklyAiSummaryCardProps = {
  metrics: AdminEngagementMetrics;
  coverageRatio?: string | null;
};

type SummaryState = {
  summary: string;
  weekKey: string;
  lastUpdated: string;
  cached: boolean;
  stale: boolean;
  error?: string;
};

function weekRangeFromKey(weekKey: string) {
  const start = new Date(`${weekKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function WeeklyAiSummaryCard({ metrics, coverageRatio }: WeeklyAiSummaryCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryState | null>(null);

  const payload = useMemo(() => {
    const weeklyRows = metrics.weeklyBuckets;
    const currentWeek = weeklyRows[weeklyRows.length - 1];
    if (!currentWeek) return null;

    const { startIso, endIso } = weekRangeFromKey(currentWeek.weekKey);
    return {
      week_start_iso: startIso,
      week_end_iso: endIso,
      current_week_engagement: currentWeek.attendanceCount,
      current_week_unique_volunteers: currentWeek.uniqueVolunteerCount,
      current_week_events: currentWeek.eventCount,
      current_week_first_time: currentWeek.firstTimeCount,
      current_week_returning: currentWeek.returningCount,
      total_engagement: metrics.totalAttendance,
      unique_volunteers_total: metrics.uniqueVolunteersCount,
      upcoming_events: metrics.upcomingEvents.length,
      past_events: metrics.pastEvents.length,
      recurring_volunteers: metrics.recurringVolunteers,
      one_time_volunteers: metrics.oneTimeVolunteers,
      avg_participation_per_week: Number(metrics.avgParticipationPerWeek.toFixed(2)),
      weekly_growth_rate: Number(metrics.attendanceDeltaPct.toFixed(2)),
      trend_direction: metrics.trendDirection,
      network_coverage_ratio: coverageRatio ?? null,
      top_organizations: metrics.topOrganizations.slice(0, 5).map((org) => ({
        organizer: org.organizer,
        attendance: org.attendance,
        events: org.events,
      })),
    } as const;
  }, [metrics, coverageRatio]);

  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      if (!payload) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getWeeklyEngagementSummary(payload);
        if (cancelled) return;
        setSummary({
          summary: response.summary,
          weekKey: response.week_key,
          lastUpdated: response.last_updated,
          cached: response.cached,
          stale: response.stale,
          error: response.error,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to generate AI summary.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <Card component="section" radius="xl" withBorder shadow="sm" p="lg">
      <Group justify="space-between" mb={6}>
        <Title order={5} fz="xs" tt="uppercase" c="dimmed">
          AI Weekly Summary
        </Title>
      </Group>

      {loading ? (
        <Group gap="xs">
          <Loader size="xs" />
          <Text fz="sm" c="dimmed">
            Generating weekly summary...
          </Text>
        </Group>
      ) : summary ? (
        <Stack gap={6}>
          <Text fz="sm">{summary.summary}</Text>
          <Group justify="space-between" align="center" wrap="wrap">
            <Text fz="xs" c="dimmed">
              Week of{" "}
              {new Date(`${summary.weekKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {summary.stale ? " (fallback summary)" : ""}
            </Text>
            <Text fz="xs" c="dimmed" ta="right">
              Last updated{" "}
              {new Date(summary.lastUpdated).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </Group>
          {summary.error ? (
            <Alert color="yellow" variant="light">
              Live generation failed; showing cached summary.
            </Alert>
          ) : null}
        </Stack>
      ) : (
        <Text fz="sm" c="dimmed">
          No summary available yet.
        </Text>
      )}

      {error ? (
        <Alert mt="sm" color="red" variant="light">
          {error}
        </Alert>
      ) : null}
    </Card>
  );
}
