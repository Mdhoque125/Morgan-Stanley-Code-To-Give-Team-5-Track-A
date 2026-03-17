"use client";

import { Container, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { EngagementHeatmapAndRecurringSection } from "@/components/admin/EngagementHeatmapAndRecurringSection";
import { ParticipationDistributionSection } from "@/components/admin/ParticipationDistributionSection";
import { WeeklyAiSummaryCard } from "@/components/admin/WeeklyAiSummaryCard";
import { useAdminData } from "@/context/AdminDataContext";

export default function RetentionAnalyticsPage() {
  const { metrics, loading, coverageRatio } = useAdminData();

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Retention Analytics</Title>
          <Text c="dimmed" fz="sm">
            Compare recurring vs one-time participation and monitor return behavior over time.
          </Text>
        </div>

        {loading || !metrics ? (
          <Loader size="sm" />
        ) : (
          <>
            <WeeklyAiSummaryCard metrics={metrics} coverageRatio={coverageRatio} />
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
              <EngagementHeatmapAndRecurringSection
                metrics={metrics}
                showHeatmap={false}
                showRecurring
              />
              <ParticipationDistributionSection
                metrics={metrics}
                showHistogram={false}
                showFirstTimeReturning
              />
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Container>
  );
}
