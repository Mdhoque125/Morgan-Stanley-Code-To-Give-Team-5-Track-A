"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AdminDataProvider, useAdminData } from "@/context/AdminDataContext";
import { ZestyAdminAssistant } from "@/components/ZestyAdminAssistant";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Contacts", href: "/admin/contacts" },
  { label: "Reports", href: "/admin/reports" },
];

function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-yellow-50 border-r border-yellow-200 flex flex-col overflow-hidden">
      <div className="px-4 pt-5 pb-3 shrink-0">
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
          Admin Menu
        </p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-white border border-yellow-200 shadow-sm text-gray-900"
                    : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function AdminMain({ children }: { children: ReactNode }) {
  const { resourceStats } = useAdminData();
  return (
    <>
      {children}
      <ZestyAdminAssistant resourceStats={resourceStats ?? null} />
    </>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-yellow-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between bg-yellow-400 px-5 py-3 shrink-0 border-b border-yellow-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-300 shadow-sm">
            <img src="/lemontree-logo.svg" alt="Lemontree logo" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-800 leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-700/70">
              Analytics &amp; Network Overview
            </p>
          </div>
        </div>
        <Link
          href="/hub"
          className="rounded-full bg-primary-500 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-primary-600 transition-colors"
        >
          ← Back to Explorer
        </Link>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <AdminDataProvider>
            <AdminMain>{children}</AdminMain>
          </AdminDataProvider>
        </main>
      </div>
    </div>
  );
}
