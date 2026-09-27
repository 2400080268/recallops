"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  AlertTriangle,
  Search,
  Brain,
  SlidersHorizontal,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Command,
} from "lucide-react";
import { useIncidents } from "@/lib/incident-store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { incidents } = useIncidents();

  // Find latest active or investigated incident for the "Investigation" nav link
  const latestIncidentId = incidents.find((i) => i.status === "In Progress" || i.status === "Open")?.id || incidents[0]?.id || "INC-1001";

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/simulator", label: "Incident Simulator", icon: Zap },
    { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    { href: `/incidents/${latestIncidentId}`, label: "Investigation", icon: Search },
    { href: "/memory", label: "Memory", icon: Brain },
    { href: "/settings", label: "Settings", icon: SlidersHorizontal },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    if (href.startsWith("/incidents/")) {
      return pathname.startsWith("/incidents/") && pathname !== "/incidents";
    }
    if (href === "/incidents") {
      return pathname === "/incidents";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FAFAFA] flex flex-col font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#080808] z-50 flex flex-col justify-between border-r border-[#27272A] transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo / Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#27272A]">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-7 h-7 rounded-md bg-[#171717] border border-[#27272A] flex items-center justify-center text-[#22D3EE]">
                <Zap size={15} className="fill-current text-[#22D3EE]" />
              </div>
              <span className="font-semibold text-[15px] text-[#FAFAFA] tracking-tight">
                RecallOps
              </span>
            </Link>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] border border-[#27272A] bg-[#111111] px-1.5 py-0.5 rounded font-medium">
              ENTERPRISE
            </span>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] px-2 mb-2 font-medium">
              PLATFORM
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-[13px] ${
                      active
                        ? "bg-[#171717] text-[#FAFAFA] font-medium border border-[#27272A]"
                        : "text-[#A1A1AA] hover:bg-[#111111] hover:text-[#FAFAFA]"
                    }`}
                  >
                    <IconComponent
                      size={16}
                      className={active ? "text-[#22D3EE]" : "text-[#71717A]"}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[#27272A]">
          <div className="px-2 py-2 flex flex-col gap-1">
            <div className="text-[13px] font-medium text-[#FAFAFA]">
              ShopEase Engineering
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#71717A] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
              <span>Production • us-east-1</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="md:pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-14 bg-[#080808] z-40 px-4 md:px-6 flex items-center justify-between border-b border-[#27272A]">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#71717A] font-mono">
              <span className="text-[#D4D4D8]">ShopEase</span>
              <span>/</span>
              <span>Production</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">us-east-1</span>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden lg:flex items-center max-w-md w-full mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
                <Search size={14} />
              </div>
              <input
                type="text"
                readOnly
                placeholder="Search incidents, memory, runs..."
                className="w-full pl-9 pr-12 py-1.5 bg-[#111111] border border-[#27272A] rounded-lg text-xs text-[#A1A1AA] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46] cursor-pointer"
                onClick={() => {
                  const searchInput = document.querySelector<HTMLInputElement>("#global-search-input");
                  searchInput?.focus();
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="text-[10px] font-mono text-[#71717A] bg-[#171717] px-1.5 py-0.5 rounded border border-[#27272A]">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Status & User Profile */}
          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111111] border border-[#27272A] text-xs text-[#D4D4D8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
              <span className="hidden sm:inline font-medium">All Systems Operational</span>
              <span className="sm:hidden font-medium">Healthy</span>
            </div>

            {/* Notifications Button */}
            <button
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#171717] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 border-l border-[#27272A]">
              <div className="w-7 h-7 rounded-full bg-[#171717] border border-[#3F3F46] flex items-center justify-center text-xs font-mono font-medium text-[#22D3EE]">
                FE
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[12px] font-medium text-[#FAFAFA] leading-tight">
                  FE
                </span>
                <span className="text-[10px] text-[#71717A] leading-tight">
                  Principal SRE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 mt-14 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}