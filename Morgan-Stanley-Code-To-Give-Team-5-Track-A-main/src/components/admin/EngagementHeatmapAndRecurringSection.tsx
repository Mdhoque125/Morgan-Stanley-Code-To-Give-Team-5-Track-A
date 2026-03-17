"use client";

import { Box, Card, Grid, Text, Title } from "@mantine/core";
import { Fragment } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AdminEngagementMetrics } from "@/components/types/adminDashboard";

const RECURRING_PIE_COLORS = [
  "var(--mantine-color-yellow-6)",
  "var(--mantine-color-blue-6)",
];

type EngagementHeatmapAndRecurringSectionProps = {
  metrics: AdminEngagementMetrics;
  showHeatmap?: boolean;
  showRecurring?: boolean;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(d: Date): Date {
  const next = startOfDay(d);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

export function EngagementHeatmapAndRecurringSection({
  metrics,
  showHeatmap = true,
  showRecurring = true,
}: EngagementHeatmapAndRecurringSectionProps) {
  const allEvents = [...metrics.pastEvents, ...metrics.upcomingEvents];
  const attendanceByDate = new Map<string, number>();
  for (const event of allEvents) {
    const key = isoDate(new Date(event.start_time));
    attendanceByDate.set(key, (attendanceByDate.get(key) ?? 0) + (event.attendees?.length ?? 0));
  }

  const today = startOfDay(new Date());
  const firstDate = startOfWeek(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()));
  const dayCount = Math.floor((today.getTime() - firstDate.getTime()) / 86400000) + 1;
  const weekCount = Math.ceil(dayCount / 7);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let maxDailyAttendance = 1;
  for (const value of attendanceByDate.values()) {
    maxDailyAttendance = Math.max(maxDailyAttendance, value);
  }

  return (
    <Grid component="section" gutter="lg">
      {showHeatmap ? (
        <Grid.Col span={{ base: 12, lg: showRecurring ? 6 : 12 }}>
        <Card radius="xl" withBorder shadow="sm" p="lg">
          <Title order={5} fz="xs" tt="uppercase" c="dimmed">
            Engagement Heatmap
          </Title>
          <Text mt={4} fz="sm" c="dimmed">
            Calendar view of event attendance intensity over time.
          </Text>
          <Box mt="md" style={{ overflowX: "auto" }}>
            <Box miw={640}>
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: `auto repeat(${weekCount}, 18px)`,
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <Box />
                {Array.from({ length: weekCount }).map((_, weekIdx) => {
                  const date = new Date(firstDate);
                  date.setDate(date.getDate() + weekIdx * 7);
                  return (
                    <Text key={`wk-${weekIdx}`} fz={9} c="dimmed" ta="center">
                      {weekIdx % 4 === 0 ? `${date.getMonth() + 1}/${date.getDate()}` : ""}
                    </Text>
                  );
                })}

                {dayLabels.map((label, dayIdx) => (
                  <Fragment key={`row-${label}`}>
                    <Text fz={10} c="dimmed">
                      {label}
                    </Text>
                    {Array.from({ length: weekCount }).map((_, weekIdx) => {
                      const date = new Date(firstDate);
                      date.setDate(date.getDate() + weekIdx * 7 + dayIdx);
                      const future = date > today;
                      const key = isoDate(date);
                      const value = attendanceByDate.get(key) ?? 0;
                      const normalized = maxDailyAttendance > 0 ? value / maxDailyAttendance : 0;
                      const alpha = future ? 0 : Math.max(0.08, Math.pow(normalized, 0.65));

                      return (
                        <Box
                          key={`${label}-${weekIdx}`}
                          title={`${key}: ${value} attendees`}
                          h={16}
                          w={16}
                          style={{
                            borderRadius: 4,
                            border: "1px solid var(--mantine-color-gray-2)",
                            backgroundColor: future
                              ? "var(--mantine-color-gray-1)"
                              : `rgba(202, 138, 4, ${alpha})`,
                          }}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </Box>
            </Box>
          </Box>
          <Text mt="sm" fz="xs" c="dimmed">
            Darker cells indicate higher attendance; lighter cells indicate lower engagement.
          </Text>
        </Card>
        </Grid.Col>
      ) : null}

      {showRecurring ? (
        <Grid.Col span={{ base: 12, lg: showHeatmap ? 6 : 12 }}>
        <Card radius="xl" withBorder shadow="sm" p="lg">
          <Title order={5} fz="xs" tt="uppercase" c="dimmed">
            Recurring vs One-time Participation
          </Title>
          <Text mt={4} fz="sm" c="dimmed">
            Distinguishes retention from single-event attendance.
          </Text>
          {metrics.uniqueVolunteersCount === 0 ? (
            <Text mt="lg" fz="sm" c="dimmed">
              No attendee data yet.
            </Text>
          ) : (
            <Box mt="md" h={180}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.recurringBreakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {metrics.recurringBreakdown.map((_, index) => (
                      <Cell key={index} fill={RECURRING_PIE_COLORS[index % RECURRING_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card>
        </Grid.Col>
      ) : null}
    </Grid>
  );
}
