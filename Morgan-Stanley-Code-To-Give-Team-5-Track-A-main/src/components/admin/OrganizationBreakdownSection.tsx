"use client";

import { Box, Card, Grid, Text, Title } from "@mantine/core";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PIE_COLORS } from "@/components/admin/engagementMetrics";
import type { AdminEngagementMetrics } from "@/components/types/adminDashboard";

type OrganizationBreakdownSectionProps = {
  metrics: AdminEngagementMetrics;
};

export function OrganizationBreakdownSection({
  metrics,
}: OrganizationBreakdownSectionProps) {
  return (
    <Grid component="section" gutter="lg">
      <Grid.Col span={{ base: 12, lg: 6 }}>
        <Card radius="xl" withBorder shadow="sm" p="lg">
          <Title order={5} fz="xs" tt="uppercase" c="dimmed">
            Organization Share of Participation
          </Title>
          <Text mt={4} fz="sm" c="dimmed">
            Attendance share grouped by event organizer.
          </Text>
          {metrics.topOrganizations.length === 0 ? (
            <Text mt="lg" fz="sm" c="dimmed">
              No organization data available.
            </Text>
          ) : (
            <Box mt="md" h={288}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.topOrganizations}
                    dataKey="attendance"
                    nameKey="organizer"
                    innerRadius={55}
                    outerRadius={105}
                  >
                    {metrics.topOrganizations.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card>
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 6 }}>
        <Card radius="xl" withBorder shadow="sm" p="lg">
          <Title order={5} fz="xs" tt="uppercase" c="dimmed">
            Top Participating Organizations
          </Title>
          <Text mt={4} fz="sm" c="dimmed">
            Ranked by total volunteer attendance.
          </Text>
          {metrics.topOrganizations.length === 0 ? (
            <Text mt="lg" fz="sm" c="dimmed">
              No participation yet.
            </Text>
          ) : (
            <Box mt="md" h={288}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...metrics.topOrganizations].reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="organizer" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip />
                  <Bar
                    dataKey="attendance"
                    fill="var(--mantine-color-blue-6)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Card>
      </Grid.Col>
    </Grid>
  );
}
