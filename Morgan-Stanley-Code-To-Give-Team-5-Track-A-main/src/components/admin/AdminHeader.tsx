"use client";

import Link from "next/link";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";

type AdminHeaderProps = {
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
};

export function AdminHeader({
  title,
  subtitle,
  backHref = "/hub",
  backLabel = "← Back to Explorer",
}: AdminHeaderProps) {
  return (
    <Paper
      component="header"
      bg="yellow.4"
      shadow="sm"
      px="lg"
      py="md"
      withBorder
      radius={0}
    >
      <Group justify="space-between" wrap="wrap">
        <Stack gap={0}>
          <Title order={3} c="gray.9">
            {title}
          </Title>
          <Text fz="xs" fw={600} tt="uppercase" c="gray.8">
            {subtitle}
          </Text>
        </Stack>
        <Button
          component={Link}
          href={backHref}
          radius="xl"
          size="xs"
          variant="light"
          color="blue"
          fw={600}
        >
          {backLabel}
        </Button>
      </Group>
    </Paper>
  );
}
