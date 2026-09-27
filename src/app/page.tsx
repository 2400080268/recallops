"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { services } from "@/lib/mock-data";
import { useIncidents } from "@/lib/incident-store";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const { incidents, stats } = useIncidents();

  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-space-md mb-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs mb-1">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                Telemetry • Overview
              </span>
              <span className="h-1 w-1 rounded-full bg-outline"></span>
              <span className="font-label-sm text-label-sm text-outline">
                Realtime Stream
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Dashboard
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Monitor incidents, system health, and response activity across
              ShopEase production.
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start md:self-auto">
            <div className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-low shadow-sm border border-[#1F2A37]/50">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface font-mono">
                Live Correlation: Active
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low shadow-sm border border-[#1F2A37]/50">
              {(["24h", "7d", "30d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-colors ${
                    timeRange === range
                      ? "bg-surface-container-high text-primary font-medium shadow-inner"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
        {/* Total Incidents */}
        <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-colors border border-[#1F2A37]/50">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-surface-variant/30 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-mono">
              Total Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline group-hover:text-on-surface transition-colors">
              <Icon name="report_problem" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                {stats.total}
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-mono flex items-center gap-0.5">
                <Icon name="trending_up" size={14} />
                +3 this week
              </span>
            </div>
            <div className="mt-space-md h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
              <div
                className="h-full bg-error"
                style={{ width: `${(stats.sev1 / (stats.total || 1)) * 100}%` }}
              ></div>
              <div
                className="h-full bg-secondary"
                style={{ width: `${(stats.sev2 / (stats.total || 1)) * 100}%` }}
              ></div>
              <div
                className="h-full bg-primary"
                style={{ width: `${(stats.sev3 / (stats.total || 1)) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-space-xs font-label-sm text-[10px] text-outline font-mono">
              <span>Sev-1: {stats.sev1}</span>
              <span>Sev-2: {stats.sev2}</span>
              <span>Sev-3: {stats.sev3}</span>
            </div>
          </div>
        </div>

        {/* Open Critical */}
        <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-colors border border-[#1F2A37]/50">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-error-container/40 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-error font-mono">
              Open Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-error-container/20 flex items-center justify-center text-error">
              <Icon name="local_fire_department" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                {stats.open}
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-mono uppercase tracking-wide">
                Requires triage
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm truncate">
              {stats.open > 0 ? `${stats.open} active incidents pending resolution` : "No open incidents requiring triage"}
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-colors border border-[#1F2A37]/50">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary-container/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-mono">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <Icon
                name="autorenew"
                size={18}
                className={stats.inProgress > 0 ? "animate-spin" : ""}
              />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                {stats.inProgress}
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-mono">
                AI Agent investigating
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm truncate">
              {stats.inProgress > 0 ? "RecallOps investigation active" : "No investigations currently running"}
            </p>
          </div>
        </div>

        {/* Resolved (7d) */}
        <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-colors border border-[#1F2A37]/50">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-space-md">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-mono">
              Resolved
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <Icon name="check_circle" size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                {stats.resolved}
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono font-medium">
                Mitigations applied
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm truncate">
              Telemetry and runbooks preserved
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Recent Incidents & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
        {/* Recent Incidents (8 columns) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col h-full shadow-md border border-[#1F2A37]/50">
            <div className="flex items-center justify-between pb-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Recent Incidents
                </span>
                <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container text-outline font-mono">
                  ShopEase Prod
                </span>
              </div>
              <Link
                href="/incidents"
                className="font-label-md text-label-md text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1 group"
              >
                <span>View all</span>
                <Icon
                  name="arrow_forward"
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-surface-container-lowest/60 overflow-hidden">
              {incidents.slice(0, 5).map((incident) => {
                const isCriticalOrHigh =
                  incident.severity === "Critical" ||
                  incident.severity === "High";
                const isOpen = incident.status === "Open";

                return (
                  <Link
                    key={incident.id}
                    href={`/incidents/${incident.id}`}
                    className={`flex items-center justify-between p-space-md rounded-lg hover:bg-surface-container transition-all cursor-pointer group ${
                      isOpen ? "bg-surface-container-lowest/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-space-md min-w-0">
                      <span className="font-label-sm text-label-sm text-outline font-mono group-hover:text-primary transition-colors">
                        {incident.id}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-fixed-dim truncate">
                            {incident.title}
                          </span>
                          {isOpen && (
                            <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-space-sm mt-0.5">
                          <span className="font-label-sm text-label-sm text-outline font-mono">
                            Service:{" "}
                            <span className="text-on-surface-variant font-medium">
                              {incident.service}
                            </span>
                          </span>
                          <span className="h-1 w-1 rounded-full bg-outline"></span>
                          <span className="font-label-sm text-label-sm text-outline font-mono">
                            {incident.started}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md shrink-0">
                      <span
                        className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-mono font-medium ${
                          isCriticalOrHigh
                            ? "bg-error-container text-on-error-container"
                            : "bg-surface-container-highest text-secondary"
                        }`}
                      >
                        Sev: {incident.severity === "Medium" ? "Med" : incident.severity}
                      </span>

                      <span
                        className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-mono ${
                          incident.status === "Resolved"
                            ? "bg-surface-container-high text-primary"
                            : incident.status === "Open"
                            ? "bg-error-container text-error font-bold animate-pulse"
                            : "bg-surface-container-high text-secondary"
                        }`}
                      >
                        {incident.status}
                      </span>

                      <Icon
                        name="chevron_right"
                        size={18}
                        className="text-outline group-hover:text-on-surface group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Status (4 columns) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col h-full shadow-md border border-[#1F2A37]/50">
            <div className="flex items-center justify-between pb-space-md">
              <span className="font-headline-sm text-headline-sm text-on-surface">
                System Status
              </span>
              <span className="font-label-sm text-label-sm font-mono text-outline">
                Cluster: East-Primary
              </span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container mb-space-md flex items-center justify-between shadow-inner border border-[#1F2A37]/40">
              <div className="flex items-center gap-space-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  All systems operational
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-mono">
                99.98% SLA
              </span>
            </div>

            <div className="flex flex-col gap-space-sm flex-1 justify-between">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="p-space-sm rounded-lg hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                      <span className="font-body-md text-body-md text-on-surface font-medium">
                        {service.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-space-sm font-mono font-label-sm text-label-sm">
                      <span className="text-secondary">{service.status}</span>
                      <span className="text-outline">{service.latency}</span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${service.loadPercentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Actions & AI Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Quick Actions (5 columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between h-full shadow-md border border-[#1F2A37]/50">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Quick Actions
                </span>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  Runbook v2.4
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Trigger autonomous drill routines or drill directly into vector
                contextual memory.
              </p>
            </div>

            <div className="flex flex-col gap-space-sm">
              <Link
                href="/simulator"
                className="w-full py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-space-xs shadow-lg hover:bg-primary transition-all active:scale-[0.99] group text-center"
              >
                <Icon
                  name="bolt"
                  size={20}
                  className="text-on-primary group-hover:rotate-12 transition-transform"
                />
                <span>Simulate New Incident</span>
              </Link>

              <div className="grid grid-cols-2 gap-space-sm">
                <Link
                  href="/incidents"
                  className="py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-md text-body-md flex items-center justify-center gap-1.5 transition-colors border border-[#1F2A37]/30"
                >
                  <Icon name="list_alt" size={18} className="text-outline" />
                  <span>All Incidents</span>
                </Link>

                <Link
                  href="/memory"
                  className="py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-md text-body-md flex items-center justify-center gap-1.5 transition-colors border border-[#1F2A37]/30"
                >
                  <Icon
                    name="psychology"
                    size={18}
                    className="text-secondary"
                  />
                  <span>Search Memory</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* AI Response Activity (7 columns) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between h-full shadow-md relative overflow-hidden border border-[#1F2A37]/50">
            <div className="absolute right-0 top-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs mb-space-sm">
                <div className="flex items-center gap-space-xs">
                  <Icon name="insights" size={20} className="text-secondary" />
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    AI Response Activity
                  </span>
                </div>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary font-mono self-start sm:self-auto">
                  92% automated root cause precision
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface">
                RecallOps investigated{" "}
                <span className="font-semibold text-primary">
                  14 incidents
                </span>{" "}
                this week using organizational memory vectors.
              </p>
            </div>

            <div className="mt-space-md pt-space-md">
              <div className="flex items-end justify-between h-20 gap-2 mb-space-xs px-space-xs">
                {[
                  { day: "Mon", height: "35%", active: false },
                  { day: "Tue", height: "55%", active: false },
                  { day: "Wed", height: "20%", active: false },
                  { day: "Thu", height: "85%", active: true },
                  { day: "Fri", height: "60%", active: false },
                  { day: "Sat", height: "15%", active: false },
                  { day: "Sun", height: "40%", active: false },
                ].map(({ day, height, active }) => (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        active
                          ? "bg-secondary shadow-[0_0_12px_rgba(93,230,255,0.4)]"
                          : "bg-surface-container-highest group-hover:bg-secondary"
                      }`}
                      style={{ height }}
                    ></div>
                    <span
                      className={`font-label-sm text-[10px] font-mono ${
                        active
                          ? "text-secondary font-bold"
                          : "text-outline"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-space-xs font-label-sm text-label-sm text-outline font-mono border-t border-[#1F2A37]/30 mt-1">
                <span>Historical correlation hits: 88</span>
                <span className="text-secondary font-medium">
                  Avg MTTK: 1.8 mins
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}