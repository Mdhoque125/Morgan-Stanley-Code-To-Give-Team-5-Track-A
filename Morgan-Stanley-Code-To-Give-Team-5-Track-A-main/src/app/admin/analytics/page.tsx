"use client";

import { Container, Loader, Stack, Text, Title } from "@mantine/core";
import { EngagementHeatmapAndRecurringSection } from "@/components/admin/EngagementHeatmapAndRecurringSection";
import { OrganizationBreakdownSection } from "@/components/admin/OrganizationBreakdownSection";
import { ParticipationDistributionSection } from "@/components/admin/ParticipationDistributionSection";
import { WeeklyAiSummaryCard } from "@/components/admin/WeeklyAiSummaryCard";
import { WeeklyEngagementTrendSection } from "@/components/admin/WeeklyEngagementTrendSection";
import { useAdminData } from "@/context/AdminDataContext";

export default function AdminAnalyticsOverviewPage() {
  const { metrics, loading, coverageRatio } = useAdminData();

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Analytics</Title>
          <Text c="dimmed" fz="sm">
            Full engagement analytics dashboard with all core charts in one digestible view.
          </Text>
        </div>

        {loading || !metrics ? (
          <Loader size="sm" />
        ) : (
          <>
            <WeeklyAiSummaryCard metrics={metrics} coverageRatio={coverageRatio} />
            <WeeklyEngagementTrendSection metrics={metrics} />
            <EngagementHeatmapAndRecurringSection metrics={metrics} />
            <ParticipationDistributionSection metrics={metrics} />
            <OrganizationBreakdownSection metrics={metrics} />
          </>
        )}
      </Stack>
    </Container>
  );
}
