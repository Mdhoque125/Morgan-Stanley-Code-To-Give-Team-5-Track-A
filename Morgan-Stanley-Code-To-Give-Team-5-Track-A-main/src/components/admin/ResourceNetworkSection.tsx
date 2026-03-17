"use client";

import { Alert, Card, Loader, SimpleGrid, Text, Title } from "@mantine/core";
import { StatCard } from "@/components/admin/StatCard";
import type { ResourceStats } from "@/components/types/adminDashboard";

type ResourceNetworkSectionProps = {
  eventsCount: number;
  coverageRatio: string | null;
  loading: boolean;
  error: string | null;
  stats: ResourceStats | null;
};

export function ResourceNetworkSection({
  eventsCount,
  coverageRatio,
  loading,
  error,
  stats,
}: ResourceNetworkSectionProps) {
  const networkStatCards =
    stats == null
      ? []
      : [
          { label: "Total Resources", value: stats.total },
          { label: "Food Pantries", value: stats.pantries },
          { label: "Soup Kitchens", value: stats.kitchens },
          { label: "Open Today", value: stats.openToday },
          { label: "Open This Week", value: stats.openThisWeek },
        ].filter((item): item is { label: string; value: number } => item.value != null);

  return (
    <Card component="section" radius="xl" withBorder shadow="sm" p="lg">
      <Title order={5} fz="xs" tt="uppercase" c="dimmed" mb="sm">
        Lemontree Resource Network
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="sm">
        <StatCard label="Total events" value={eventsCount} />
        <StatCard
          label="Network coverage"
          value={coverageRatio != null ? `${coverageRatio}%` : "—"}
          sub="flyering events vs total resources"
        />
      </SimpleGrid>
      {loading ? (
        <Text fz="sm" c="dimmed" inline>
          <Loader size="xs" mr="xs" />
          Loading resource data…
        </Text>
      ) : error ? (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      ) : networkStatCards.length > 0 ? (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm">
          {networkStatCards.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value.toLocaleString()} />
          ))}
        </SimpleGrid>
      ) : null}
    </Card>
  );
}
