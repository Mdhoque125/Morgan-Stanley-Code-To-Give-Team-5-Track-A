import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@mantine/core/styles.css";
import { EventsProvider } from "@/context/EventsContext";
import { AuthProvider } from "@/context/AuthContext";
import { VolunteerProgressProvider } from "@/context/VolunteerProgressContext";
import { MantineProvider } from "@mantine/core";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Volunteer Flyering Hub",
  description: "Find flyering events, create events, and download localized PDF flyers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden antialiased bg-[#FCF8F2] text-slate-800`}
        suppressHydrationWarning
      >
        <MantineProvider defaultColorScheme="light">
          <AuthProvider>
            <EventsProvider>
              <VolunteerProgressProvider>{children}</VolunteerProgressProvider>
            </EventsProvider>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
