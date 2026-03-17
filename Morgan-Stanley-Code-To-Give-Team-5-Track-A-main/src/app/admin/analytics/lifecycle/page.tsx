"use client";

import { Container, Loader, Stack, Tabs, Text, Title } from "@mantine/core";
import { EngagementHeatmapAndRecurringSection } from "@/components/admin/EngagementHeatmapAndRecurringSection";
import { PastEventsSection } from "@/components/admin/PastEventsSection";
import { UpcomingEventsSection } from "@/components/admin/UpcomingEventsSection";
import { WeeklyAiSummaryCard } from "@/components/admin/WeeklyAiSummaryCard";
import { useAdminData } from "@/context/AdminDataContext";

export default function LifecycleAnalyticsPage() {
  const { metrics, loading, coverageRatio } = useAdminData();

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Lifecycle Analytics</Title>
          <Text c="dimmed" fz="sm">
            Explore event lifecycle timing and engagement intensity patterns.
          </Text>
        </div>

        {loading || !metrics ? (
          <Loader size="sm" />
        ) : (
          <>
            <WeeklyAiSummaryCard metrics={metrics} coverageRatio={coverageRatio} />
            <EngagementHeatmapAndRecurringSection
              metrics={metrics}
              showHeatmap
              showRecurring={false}
            />
            <Tabs defaultValue="upcoming" variant="outline" radius="md">
              <Tabs.List>
                <Tabs.Tab value="upcoming">Upcoming Events</Tabs.Tab>
                <Tabs.Tab value="past">Past Flyering</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="upcoming" pt="md">
                <UpcomingEventsSection events={metrics.upcomingEvents.slice(0, 8)} />
              </Tabs.Panel>

              <Tabs.Panel value="past" pt="md">
                <PastEventsSection events={metrics.pastEvents.slice(0, 8)} />
              </Tabs.Panel>
            </Tabs>
          </>
        )}
      </Stack>
    </Container>
  );
}
