"use client";

import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";
import type { FlyeringEvent } from "@/types/events";

type UpcomingEventsSectionProps = {
  events: FlyeringEvent[];
};

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  return (
    <Card component="section" radius="xl" withBorder shadow="sm" p="lg">
      <Title order={5} fz="xs" tt="uppercase" c="dimmed" mb="sm">
        Upcoming Flyering Events
      </Title>
      {events.length === 0 ? (
        <Text fz="sm" c="dimmed">
          No upcoming events.
        </Text>
      ) : (
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
              }}
            >
              <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                <Text fw={600} fz="sm" truncate>
                  {event.title}
                </Text>
                <Text fz="xs" c="dimmed">
                  {event.address}
                </Text>
                <Text fz="xs" c="gray.6">
                  {new Date(event.start_time).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              </Stack>
              <Badge variant="light" color="gray" leftSection={<span aria-hidden="true">👥</span>}>
                {event.attendees?.length ?? 0}/20
              </Badge>
            </Group>
          ))}
        </Stack>
      )}
    </Card>
  );
}
