"use client";

import { Box, Card, Text, Title } from "@mantine/core";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminEngagementMetrics } from "@/components/types/adminDashboard";

type WeeklyEngagementTrendSectionProps = {
  metrics: AdminEngagementMetrics;
};

export function WeeklyEngagementTrendSection({
  metrics,
}: WeeklyEngagementTrendSectionProps) {
  return (
    <Card component="section" radius="xl" withBorder shadow="sm" p="lg">
      <Title order={5} fz="xs" tt="uppercase" c="dimmed">
        Weekly Engagement Trend
      </Title>
      <Text mt={4} fz="sm" c="dimmed">
        Tracks total attendance and unique volunteers per week.
      </Text>
      {metrics.weeklyBuckets.length === 0 ? (
        <Text mt="lg" fz="sm" c="dimmed">
          No event activity yet. Engagement trend will appear once events have attendees.
        </Text>
      ) : (
        <Box mt="md" h={288} w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.weeklyBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendanceCount"
                name="Attendance"
                stroke="var(--mantine-color-blue-6)"
                strokeWidth={3}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="uniqueVolunteerCount"
                name="Unique volunteers"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Card>
  );
}
