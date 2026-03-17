"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  Box,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconChartBar,
  IconDashboard,
  IconMessageCircle,
  IconReportAnalytics,
  IconSettings,
  IconUserCircle,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

const navSections = [
  {
    label: "Main Menu",
    items: [
      { label: "Dashboard", icon: IconDashboard, href: "/admin/dashboard" },
      { label: "Analytics", icon: IconChartBar, href: "/admin/analytics" },
      { label: "Contacts", icon: IconUsersGroup, href: "/admin/contacts" },
      { label: "Reports", icon: IconReportAnalytics, href: "/admin/reports" },
      { label: "Events", icon: IconCalendarEvent },
    ],
  },
  {
    label: "Account Management",
    items: [
      { label: "Account", icon: IconUserCircle },
      { label: "Members", icon: IconUsers },
    ],
  },
  {
    label: "Support & Settings",
    items: [
      { label: "Settings", icon: IconSettings },
      { label: "Feedback", icon: IconMessageCircle },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Box
      w={260}
      style={{
        borderRight: "1px solid var(--mantine-color-gray-2)",
        background: "white",
      }}
    >
      <Box px="md" py="lg" bg="yellow.6">
        <Group gap="sm">
          <Avatar
            src="/lemontree-logo.svg"
            alt="Lemontree profile"
            radius="xl"
            size="md"
            color="yellow.4"
          />
          <div>
            <Title order={4} fz="md" c="gray.9">
              Lemontree
            </Title>
            <Text fz="xs" c="gray.8">
              Admin profile
            </Text>
          </div>
        </Group>
      </Box>

      <Box px="md" py="md">
        <ScrollArea h="calc(100vh - 165px)">
          <Stack gap="md">
            {navSections.map((section) => (
              <div key={section.label}>
                <Text fz="xs" fw={600} c="dimmed" mb={4}>
                  {section.label}
                </Text>
                <Stack gap={4}>
                  {section.items.map((item) => {
                    const hasHref = Boolean(item.href);
                    const active = hasHref
                      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                      : false;
                    return (
                      <NavLink
                        key={item.label}
                        href={item.href}
                        label={item.label}
                        active={active}
                        disabled={!hasHref}
                        
                      />
                    );
                  })}
                </Stack>
              </div>
            ))}
          </Stack>
        </ScrollArea>
      </Box>

      <Box px="md" py="sm" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
        <NavLink
          component={Link}
          href="/"
          label="Back to Explorer"
          leftSection={
            <ThemeIcon variant="light" color="gray">
              <IconArrowLeft size={14} />
            </ThemeIcon>
          }
        />
      </Box>
    </Box>
  );
}
