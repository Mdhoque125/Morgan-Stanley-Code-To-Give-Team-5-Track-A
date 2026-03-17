"use client";

import { Card, Group, Stack, Text, Title } from "@mantine/core";
import type { FlyeringEvent } from "@/types/events";

type PastEventsSectionProps = {
  events: FlyeringEvent[];
};

export function PastEventsSection({ events }: PastEventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <Card component="section" radius="xl" withBorder shadow="sm" p="lg">
      <Title order={5} fz="xs" tt="uppercase" c="dimmed" mb="sm">
        Past Flyering Events
      </Title>
      <Stack gap="xs">
        {events.map((event) => (
          <Group
            key={event.id}
            justify="space-between"
            align="flex-start"
            p="sm"
            style={{
              border: "1px solid var(--mantine-color-gray-2)",
              borderRadius: "var(--mantine-radius-md)",
              background: "var(--mantine-color-yellow-0)",
            }}
          >
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Text truncate fw={600} fz="sm" c="gray.7">
                {event.title}
              </Text>
              <Text fz="xs" c="gray.6">
                {event.address}
              </Text>
            </Stack>
            <Text fz="xs" c="gray.6" ta="right">
              {new Date(event.start_time).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}
