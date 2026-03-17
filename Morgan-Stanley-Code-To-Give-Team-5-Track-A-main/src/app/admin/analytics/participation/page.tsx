"use client";

import { Container, Loader, Stack, Text, Title } from "@mantine/core";
import { ParticipationDistributionSection } from "@/components/admin/ParticipationDistributionSection";
import { WeeklyAiSummaryCard } from "@/components/admin/WeeklyAiSummaryCard";
import { WeeklyEngagementTrendSection } from "@/components/admin/WeeklyEngagementTrendSection";
import { useAdminData } from "@/context/AdminDataContext";

export default function ParticipationAnalyticsPage() {
  const { metrics, loading, coverageRatio } = useAdminData();

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Participation Analytics</Title>
          <Text c="dimmed" fz="sm">
            Deep-dive into volunteer participation volume, consistency, and frequency mix.
          </Text>
        </div>

        {loading || !metrics ? (
          <Loader size="sm" />
        ) : (
          <>
            <WeeklyAiSummaryCard metrics={metrics} coverageRatio={coverageRatio} />
            <WeeklyEngagementTrendSection metrics={metrics} />
            <ParticipationDistributionSection metrics={metrics} />
          </>
        )}
      </Stack>
    </Container>
  );
}
