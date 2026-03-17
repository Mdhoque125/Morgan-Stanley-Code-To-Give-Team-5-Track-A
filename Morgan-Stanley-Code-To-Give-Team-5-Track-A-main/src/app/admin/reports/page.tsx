"use client";

import {
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { jsPDF } from "jspdf";
import { mockAdminMetrics, mockCoverageRatio, mockWeeklyReports } from "@/components/data/adminMockData";

function exportWeeklyReportPdf(index: number) {
  const row = mockWeeklyReports[index];
  if (!row) return;

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const pageBottom = 280;

  // Header
  pdf.setFontSize(16);
  pdf.text("Lemontree Weekly Volunteer Engagement Report", margin, 18);
  pdf.setFontSize(11);
  pdf.text(`Week: ${row.weekLabel}`, margin, 28);
  pdf.text(
    `Range: ${new Date(row.weekStartIso).toLocaleDateString()} \u2013 ${new Date(
      row.weekEndIso
    ).toLocaleDateString()}`,
    margin,
    34
  );

  const weeklyLines = [
    `Total attendance: ${row.totalAttendance}`,
    `Unique volunteers: ${row.uniqueVolunteers}`,
    `Total events: ${row.totalEvents}`,
    `Recurring share: ${row.recurringSharePct}%`,
    `Top organization: ${row.topOrganization}`,
  ];
  const engagementLines = [
    `All-time attendance: ${mockAdminMetrics.totalAttendance.toLocaleString()}`,
    `All-time unique volunteers: ${mockAdminMetrics.uniqueVolunteersCount.toLocaleString()}`,
    `Recurring volunteers: ${mockAdminMetrics.recurringVolunteers.toLocaleString()}`,
    `One-time volunteers: ${mockAdminMetrics.oneTimeVolunteers.toLocaleString()}`,
    `Avg participation/week: ${mockAdminMetrics.avgParticipationPerWeek.toFixed(1)}`,
    `Trend (last 4w): ${mockAdminMetrics.attendanceDeltaPct >= 0 ? "+" : ""}${mockAdminMetrics.attendanceDeltaPct.toFixed(1)}% (${mockAdminMetrics.trendDirection})`,
    `Past vs upcoming events: ${mockAdminMetrics.pastEvents.length} / ${mockAdminMetrics.upcomingEvents.length}`,
    `Network coverage: ${mockCoverageRatio != null ? `${mockCoverageRatio}%` : "N/A"}`,
  ];

  let y = 48;

  // Simple comparative bars for weekly snapshot
  pdf.setFontSize(12);
  pdf.text("Weekly Snapshot", margin, y);
  y += 6;

  const barHeight = 5;
  const maxBarWidth = contentWidth / 2;
  const maxAttendance = Math.max(row.totalAttendance, mockAdminMetrics.totalAttendance / 12 || 1);
  const weeklyAttendanceWidth = (row.totalAttendance / maxAttendance) * maxBarWidth;
  const avgAttendanceWidth =
    ((mockAdminMetrics.totalAttendance / (mockAdminMetrics.weeklyBuckets?.length || 12)) /
      maxAttendance) *
    maxBarWidth;

  pdf.setFontSize(10);
  // Weekly attendance bar
  pdf.text("Weekly attendance", margin, y + barHeight - 1);
  pdf.setFillColor(253, 224, 71); // yellow
  pdf.rect(margin + 50, y, weeklyAttendanceWidth, barHeight, "F");
  pdf.text(String(row.totalAttendance), margin + 50 + weeklyAttendanceWidth + 4, y + barHeight - 1);
  y += 10;

  // Avg per-week attendance bar
  pdf.text("Avg weekly attendance", margin, y + barHeight - 1);
  pdf.setFillColor(56, 189, 248); // blue
  pdf.rect(margin + 50, y, avgAttendanceWidth, barHeight, "F");
  pdf.text(
    mockAdminMetrics.avgParticipationPerWeek.toFixed(1),
    margin + 50 + avgAttendanceWidth + 4,
    y + barHeight - 1
  );
  y += 12;

  // Recurring vs one-time share visual
  const recurringShare = row.recurringSharePct;
  const oneTimeShare = 100 - recurringShare;
  pdf.text("Recurring vs one-time volunteers", margin, y + barHeight - 1);
  const segmentWidth = maxBarWidth;
  const recurringWidth = (recurringShare / 100) * segmentWidth;
  const oneTimeWidth = segmentWidth - recurringWidth;
  pdf.setFillColor(250, 204, 21); // gold
  pdf.rect(margin + 50, y, recurringWidth, barHeight, "F");
  pdf.setFillColor(148, 163, 184); // slate
  pdf.rect(margin + 50 + recurringWidth, y, oneTimeWidth, barHeight, "F");
  pdf.text(
    `${recurringShare.toFixed(1)}% recurring / ${oneTimeShare.toFixed(1)}% one-time`,
    margin + 50,
    y + barHeight + 6
  );
  y += 18;

  pdf.setFontSize(11);
  for (const line of weeklyLines) {
    if (y > pageBottom) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, margin, y);
    y += 8;
  }

  y += 4;
  pdf.setFontSize(12);
  pdf.text("Volunteer Engagement Stats", margin, y);
  y += 8;

  pdf.setFontSize(11);
  for (const line of engagementLines) {
    if (y > pageBottom) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, margin, y);
    y += 8;
  }

  // Trend analysis table (last 8 weeks)
  const recentWeeks = mockWeeklyReports.slice(0, 8).reverse();
  if (recentWeeks.length > 0) {
    if (y + 30 > pageBottom) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFontSize(12);
    pdf.text("Trend Overview (last 8 weeks)", margin, y);
    y += 8;
    pdf.setFontSize(9);
    const colWeek = margin;
    const colAttend = margin + 40;
    const colEvents = margin + 80;
    const colRecurring = margin + 110;
    pdf.text("Week", colWeek, y);
    pdf.text("Attendance", colAttend, y);
    pdf.text("Events", colEvents, y);
    pdf.text("Recurring %", colRecurring, y);
    y += 5;
    recentWeeks.forEach((w) => {
      if (y > pageBottom) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(w.weekLabel, colWeek, y);
      pdf.text(String(w.totalAttendance), colAttend, y);
      pdf.text(String(w.totalEvents), colEvents, y);
      pdf.text(`${w.recurringSharePct}%`, colRecurring, y);
      y += 5;
    });
  }

  // Top organizations breakdown
  if (mockAdminMetrics.topOrganizations.length > 0) {
    if (y + 30 > pageBottom) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFontSize(12);
    pdf.text("Top Organizations (all time)", margin, y);
    y += 8;
    pdf.setFontSize(9);
    const colOrg = margin;
    const colOrgAttend = margin + 70;
    const colOrgEvents = margin + 110;
    pdf.text("Organization", colOrg, y);
    pdf.text("Attendance", colOrgAttend, y);
    pdf.text("Events", colOrgEvents, y);
    y += 5;
    mockAdminMetrics.topOrganizations.forEach((org) => {
      if (y > pageBottom) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(org.organizer, colOrg, y);
      pdf.text(String(org.attendance), colOrgAttend, y);
      pdf.text(String(org.events), colOrgEvents, y);
      y += 5;
    });
  }

  // Participation distribution (histogram buckets)
  if (mockAdminMetrics.histogramRows.length > 0) {
    if (y + 30 > pageBottom) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFontSize(12);
    pdf.text("Participation Distribution (events attended per volunteer)", margin, y);
    y += 8;
    pdf.setFontSize(9);
    const colBucket = margin;
    const colCount = margin + 60;
    const maxCount =
      mockAdminMetrics.histogramRows.reduce((m, r) => Math.max(m, r.count), 1) || 1;
    const distBarWidth = contentWidth / 2;
    pdf.text("Bucket", colBucket, y);
    pdf.text("Volunteers", colCount, y);
    y += 5;
    mockAdminMetrics.histogramRows.forEach((rowBucket) => {
      if (y > pageBottom) {
        pdf.addPage();
        y = 20;
      }
      const width = (rowBucket.count / maxCount) * distBarWidth;
      pdf.text(rowBucket.bucket, colBucket, y + 3);
      pdf.setFillColor(59, 130, 246); // blue
      pdf.rect(colCount, y, width, 4, "F");
      pdf.text(String(rowBucket.count), colCount + width + 4, y + 3);
      y += 8;
    });
  }

  pdf.save(`lemontree-weekly-report-${row.weekLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

export default function AdminReportsPage() {
  const thisWeek = mockWeeklyReports[0];

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        <div>
          <Title order={2}>Reports</Title>
          <Text c="dimmed" fz="sm">
            Weekly engagement summaries ready for review and PDF export.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, md: 1 }} spacing="lg">
          <Card withBorder radius="xl" p="lg">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>This Week&apos;s Report</Text>
              <Button
                size="xs"
                radius="md"
                color="yellow"
                leftSection={<IconDownload size={14} />}
                onClick={() => exportWeeklyReportPdf(0)}
                styles={{
                  root: {
                    WebkitTapHighlightColor: "transparent",
                    transition: "background-color 120ms ease, color 120ms ease",
                    "&:active": { transform: "none" },
                  },
                }}
              >
                Export PDF
              </Button>
            </Group>
            {thisWeek ? (
              <Stack gap={4}>
                <Text fz="sm">Week: {thisWeek.weekLabel}</Text>
                <Text fz="sm">Total attendance: {thisWeek.totalAttendance}</Text>
                <Text fz="sm">Unique volunteers: {thisWeek.uniqueVolunteers}</Text>
                <Text fz="sm">Total events: {thisWeek.totalEvents}</Text>
                <Text fz="sm">Recurring share: {thisWeek.recurringSharePct}%</Text>
                <Text fz="sm">Top organization: {thisWeek.topOrganization}</Text>
              </Stack>
            ) : (
              <Text c="dimmed" fz="sm">
                No report data available.
              </Text>
            )}
          </Card>
        </SimpleGrid>

        <Card withBorder radius="xl" p="lg">
          <Text fw={600} mb="md">
            Weekly Summary History
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Week</Table.Th>
                <Table.Th>Attendance</Table.Th>
                <Table.Th>Unique Volunteers</Table.Th>
                <Table.Th>Events</Table.Th>
                <Table.Th>Recurring Share</Table.Th>
                <Table.Th>Top Organization</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {mockWeeklyReports.map((row, idx) => (
                <Table.Tr key={row.weekStartIso}>
                  <Table.Td>{row.weekLabel}</Table.Td>
                  <Table.Td>{row.totalAttendance}</Table.Td>
                  <Table.Td>{row.uniqueVolunteers}</Table.Td>
                  <Table.Td>{row.totalEvents}</Table.Td>
                  <Table.Td>{row.recurringSharePct}%</Table.Td>
                  <Table.Td>{row.topOrganization}</Table.Td>
                  <Table.Td>
                    <Button
                      size="compact-xs"
                      color="yellow"
                      leftSection={<IconDownload size={12} />}
                      onClick={() => exportWeeklyReportPdf(idx)}
                      styles={{
                        root: {
                          WebkitTapHighlightColor: "transparent",
                          transition: "background-color 120ms ease, color 120ms ease",
                          "&:active": { transform: "none" },
                        },
                      }}
                    >
                      Export PDF
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  );
}
