"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const navItems = [
  { href: "/", label: "Dashboard", icon: "grid_view" },
  { href: "/simulator", label: "Incident Simulator", icon: "bolt", iconClass: "text-secondary" },
  { href: "/incidents", label: "Incidents", icon: "emergency" },
  { href: "/memory", label: "Memory", icon: "psychology", iconClass: "text-primary" },
  { href: "/settings", label: "Settings", icon: "tune" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-r border-[#1F2A37]/50 transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo / Header */}
          <div className="h-14 px-space-md flex items-center justify-between bg-surface-container-lowest border-b border-[#1F2A37]/40">
            <Link
              href="/"
              className="flex items-center gap-space-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                alt="RecallOps Emblem"
                className="h-8 w-8 object-contain rounded-lg"
                src="/recallops-logo.svg"
              />
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                RecallOps
              </span>
            </Link>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container-high text-secondary font-mono uppercase">
              v2.4-prod
            </span>
          </div>

          {/* Navigation */}
          <div className="px-space-md py-space-sm">
            <div className="text-[10px] font-label-sm uppercase tracking-wider text-outline px-space-xs mb-space-xs font-mono">
              Operational Control
            </div>
            <nav className="flex flex-col gap-space-xs">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-space-md px-space-md py-2 rounded-lg transition-colors font-body-md text-body-md ${
                      active
                        ? "bg-surface-container-high text-primary font-semibold shadow-inner"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={
                        active
                          ? "text-primary"
                          : item.iconClass || "text-on-surface-variant"
                      }
                      size={20}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-xs border border-[#1F2A37]/60">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                ShopEase Eng
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-mono">
                  Prod
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
              <Icon name="verified" className="text-secondary text-[14px]" size={14} />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-14 bg-surface-container-lowest/90 backdrop-blur-xl z-40 px-space-md md:px-space-xl flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.3)] border-b border-[#1F2A37]/50">
          <div className="flex items-center gap-space-md md:gap-space-lg">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface md:hidden"
              aria-label="Toggle navigation menu"
            >
              <Icon name="list_alt" size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span className="text-on-surface font-medium">RecallOps</span>
              <Icon name="chevron_right" className="text-outline" size={14} />
              <span className="font-mono text-outline">core-telemetry</span>
            </div>

            {/* Region Badge */}
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-low font-label-sm text-label-sm text-on-surface border border-[#1F2A37]/40">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
              <span className="font-mono">Production • us-east-1</span>
            </div>
          </div>

          <div className="flex items-center gap-space-md md:gap-space-lg">
            {/* Clocks */}
            <div className="hidden lg:flex items-center gap-space-sm font-label-sm text-label-sm text-outline font-mono">
              <span className="flex items-center gap-1">
                <Icon name="clock" size={14} className="text-outline" />
                16:42:09 UTC
              </span>
              <span className="text-surface-variant">|</span>
              <span>12:42:09 EDT</span>
            </div>

            {/* Notifications Button */}
            <button
              aria-label="Notifications"
              className="relative p-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <Icon name="notifications" size={20} />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] font-bold">
                2
              </span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative">
                <Icon name="person" className="text-on-primary" size={18} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-secondary"></span>
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-none">
                  FE
                </span>
                <span className="font-label-sm text-[10px] text-outline font-mono leading-none mt-1">
                  Principal SRE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="w-full pt-14 px-gutter md:px-gutter-desktop pb-space-xl bg-surface-container-lowest min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}