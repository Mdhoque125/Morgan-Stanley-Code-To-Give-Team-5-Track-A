"use client";

import { Box, Card, Grid, Text, Title } from "@mantine/core";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminEngagementMetrics } from "@/components/types/adminDashboard";

type ParticipationDistributionSectionProps = {
  metrics: AdminEngagementMetrics;
  showHistogram?: boolean;
  showFirstTimeReturning?: boolean;
};

export function ParticipationDistributionSection({
  metrics,
  showHistogram = true,
  showFirstTimeReturning = true,
}: ParticipationDistributionSectionProps) {
  return (
    <Grid component="section" gutter="lg">
      {showHistogram ? (
        <Grid.Col span={{ base: 12, lg: showFirstTimeReturning ? 6 : 12 }}>
        <Card radius="xl" withBorder shadow="sm" p="lg">
          <Title order={5} fz="xs" tt="uppercase" c="dimmed">
            Volunteer Frequency Histogram
          </Title>
          <Text mt={4} fz="sm" c="dimmed">
            Number of volunteers by attendance frequency.
          </Text>
          {metrics.uniqueVolunteersCount === 0 ? (
            <Text mt="lg" fz="sm" c="dimmed">
              No attendance distribution yet.
            </Text>
          ) : (
            <Box mt="md" h={288}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.histogramRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card>
        </Grid.Col>
      ) : null}

      {showFirstTimeReturning ? (
        <Grid.Col span={{ base: 12, lg: showHistogram ? 6 : 12 }}>
        <Card radius="xl" withBorder shadow="sm" p="lg">
          <Title order={5} fz="xs" tt="uppercase" c="dimmed">
            First-time vs Returning Trend
          </Title>
          <Text mt={4} fz="sm" c="dimmed">
            Weekly split of new volunteer touches vs repeat participation.
          </Text>
          {metrics.weeklyBuckets.length === 0 ? (
            <Text mt="lg" fz="sm" c="dimmed">
              No weekly trend available.
            </Text>
          ) : (
            <Box mt="md" h={288}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weeklyBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="firstTimeCount" stackId="a" name="First-time" fill="#F59E0B" />
                  <Bar
                    dataKey="returningCount"
                    stackId="a"
                    name="Returning"
                    fill="var(--mantine-color-blue-6)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card>
        </Grid.Col>
      ) : null}
    </Grid>
  );
}
