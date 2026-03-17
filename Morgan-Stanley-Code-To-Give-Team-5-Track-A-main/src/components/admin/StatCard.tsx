"use client";

import { Card, Stack, Text } from "@mantine/core";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
};

export function StatCard({
  label,
  value,
  sub,
  color = "var(--mantine-color-gray-9)",
}: StatCardProps) {
  return (
    <Card
      radius="lg"
      padding="md"
      bg="white"
      withBorder
      style={{ borderColor: "var(--mantine-color-gray-2)" }}
    >
      <Stack gap={2}>
        <Text fz="xs" fw={600} tt="uppercase" c="dimmed">
          {label}
        </Text>
        <Text fz={32} fw={700} lh={1} style={{ color }}>
          {value}
        </Text>
        {sub ? (
          <Text fz="xs" c="gray.6">
            {sub}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
