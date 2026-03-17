"use client";

import Link from "next/link";
import { Box, Card, Group, SimpleGrid, Text, Title } from "@mantine/core";
import { RECENT_WEEK_COUNT, TREND_WINDOW_WEEKS } from "@/components/admin/engagementMetrics";
import { StatCard } from "@/components/admin/StatCard";
import type { AdminEngagementMetrics } from "@/components/types/adminDashboard";

export type VolunteerKpiStat = {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
};

export type VolunteerKpiGroup = {
  title: string;
  detailLabel?: string;
  detailHref?: string;
  stats: VolunteerKpiStat[];
};

type VolunteerEngagementKpisSectionProps = {
  metrics?: AdminEngagementMetrics;
  groups?: VolunteerKpiGroup[];
};

function buildDefaultGroups(metrics: AdminEngagementMetrics): VolunteerKpiGroup[] {
  return [
    {
      title: "Participation Footprint",
      detailLabel: "See details",
      detailHref: "/admin/analytics/participation",
      stats: [
        {
          label: "Total volunteer engagement",
          value: metrics.totalAttendance.toLocaleString(),
          sub: "all attendance records",
        },
        {
          label: "Unique volunteers",
          value: metrics.uniqueVolunteersCount.toLocaleString(),
        },
      ],
    },
    {
      title: "Event Lifecycle",
      detailLabel: "See details",
      detailHref: "/admin/analytics/lifecycle",
      stats: [
        { label: "Upcoming events", value: metrics.upcomingEvents.length },
        { label: "Past events", value: metrics.pastEvents.length },
      ],
    },
    {
      title: "Momentum & Retention",
      detailLabel: "See details",
      detailHref: "/admin/analytics/retention",
      stats: [
        {
          label: "Avg participation / week",
          value: metrics.avgParticipationPerWeek.toFixed(1),
          sub: `Based on last ${RECENT_WEEK_COUNT} weeks`,
        },
        {
          label: "Engagement trend",
          value: `${metrics.attendanceDeltaPct >= 0 ? "+" : ""}${metrics.attendanceDeltaPct.toFixed(1)}%`,
          color:
            metrics.attendanceDeltaPct > 0
              ? "var(--mantine-color-green-6)"
              : metrics.attendanceDeltaPct < 0
                ? "var(--mantine-color-red-6)"
                : "var(--mantine-color-gray-9)",
          sub: `Last ${TREND_WINDOW_WEEKS} weeks vs previous ${TREND_WINDOW_WEEKS} (${metrics.trendDirection})`,
        },
      ],
    },
  ];
}

function VolunteerKpiGroupCard({ title, detailLabel, detailHref, stats }: VolunteerKpiGroup) {
  return (
    <Card
      withBorder
      radius="lg"
      p="md"
      bg="white"
      style={{ borderColor: "var(--mantine-color-gray-3)" }}
      h="100%"
    >
      <Group justify="space-between" mb="xs">
        <Title order={6} fz="sm">
          {title}
        </Title>
        {detailLabel ? (
          <Text
            fz="xs"
            c="yellow.7"
            fw={600}
            component={detailHref ? Link : "span"}
            href={detailHref}
            style={{ textDecoration: "none" }}
          >
            {detailLabel}
          </Text>
        ) : null}
      </Group>
      <SimpleGrid cols={1} spacing="xs">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            color={stat.color}
          />
        ))}
      </SimpleGrid>
    </Card>
  );
}

export function VolunteerEngagementKpisSection({
  metrics,
  groups,
}: VolunteerEngagementKpisSectionProps) {
  const resolvedGroups = groups ?? (metrics ? buildDefaultGroups(metrics) : []);

  if (resolvedGroups.length === 0) {
    return null;
  }

  return (
    <Box
      component="section"
      p={0}
      style={{
        background: "transparent",
      }}
    >
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {resolvedGroups.map((group) => (
          <VolunteerKpiGroupCard key={group.title} {...group} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
