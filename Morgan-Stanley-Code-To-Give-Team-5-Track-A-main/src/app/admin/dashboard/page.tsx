"use client";

import { Container, Loader, Stack, Text, Title } from "@mantine/core";
import { ResourceNetworkSection } from "@/components/admin/ResourceNetworkSection";
import { VolunteerEngagementKpisSection } from "@/components/admin/VolunteerEngagementKpisSection";
import { WeeklyAiSummaryCard } from "@/components/admin/WeeklyAiSummaryCard";
import { useAdminData } from "@/context/AdminDataContext";

export default function AdminDashboardPage() {
  const { events, metrics, resourceStats, coverageRatio, loading, error } = useAdminData();

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed" fz="sm">
            Overview of volunteer engagement and network status. Use See details for category
            analytics.
          </Text>
        </div>

        {loading ? (
          <Loader size="sm" />
        ) : null}
        {metrics ? (
          <WeeklyAiSummaryCard metrics={metrics} coverageRatio={coverageRatio} />
        ) : null}
        <ResourceNetworkSection
          eventsCount={events.length}
          coverageRatio={coverageRatio}
          loading={loading}
          error={error}
          stats={resourceStats}
        />
        {metrics ? (
          <VolunteerEngagementKpisSection metrics={metrics} />
        ) : null}
      </Stack>
    </Container>
  );
}
