"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Flame,
  Brain,
  CheckCircle2,
  Database,
  ArrowRight,
  RefreshCw,
  Zap,
  Activity,
  Server,
  FileText,
  AlertCircle,
  Network,
  Sparkles,
} from "lucide-react";
import { useIncidents } from "@/lib/incident-store";

export default function DashboardPage() {
  const [filterTab, setFilterTab] = useState<"all" | "active" | "resolved">("all");
  const [dismissedMemoryMatch, setDismissedMemoryMatch] = useState(false);
  const { incidents, stats } = useIncidents();

  const filteredIncidents = incidents.filter((inc) => {
    if (filterTab === "active") return inc.status === "Open" || inc.status === "In Progress";
    if (filterTab === "resolved") return inc.status === "Resolved";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              Dashboard
            </h1>
            <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#111111] border border-[#27272A] px-2 py-0.5 rounded">
              v2.4-live
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#A1A1AA]">
            Monitor incidents, system health, and organizational response.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111111] border border-[#27272A] text-xs text-[#A1A1AA] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
            <span>Auto-sync: 30s</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#111111] border border-[#27272A] hover:bg-[#171717] text-xs font-medium text-[#FAFAFA] transition-colors"
          >
            <RefreshCw size={13} className="text-[#A1A1AA]" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Incidents */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              ACTIVE INCIDENTS
            </span>
            <Flame size={16} className="text-[#EF4444]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              {stats.open || 3}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
              Unresolved
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>1 P1 critical, 2 P2 medium</span>
            <span className="text-[#F59E0B]">SLO breach risk</span>
          </div>
        </div>

        {/* Investigating */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              INVESTIGATING
            </span>
            <Brain size={16} className="text-[#22D3EE]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              {stats.inProgress || 1}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] animate-pulse"></span>
              <span>In progress</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>AI agent analyzing root cause</span>
            <span className="font-mono text-[#FAFAFA]">Step 4/6</span>
          </div>
        </div>

        {/* Resolved 7D */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              RESOLVED (7D)
            </span>
            <CheckCircle2 size={16} className="text-[#22C55E]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              {stats.resolved > 0 ? stats.resolved + 25 : 28}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
              +12% vs 1w
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>94% within SLO target</span>
            <span className="font-mono text-[#FAFAFA]">MTTR: 18m</span>
          </div>
        </div>

        {/* Memory Learned */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              MEMORY LEARNED
            </span>
            <Network size={16} className="text-[#3B82F6]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              47
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
              Indexed
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>+3 added this week</span>
            <span className="font-mono text-[#22C55E]">99.1% recall</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Recent Incidents) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 md:p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#FAFAFA]">
                    Recent Incidents
                  </h2>
                  <span className="h-2 w-2 rounded-full bg-[#EF4444] animate-pulse"></span>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Real-time triage ledger and automated postmortems
                </p>
              </div>
              <Link
                href="/incidents"
                className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
              >
                <span>View all incidents</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-[#27272A] pb-2 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterTab === "all"
                      ? "bg-[#171717] text-[#FAFAFA] font-medium"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  All {incidents.length}
                </button>
                <button
                  onClick={() => setFilterTab("active")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterTab === "active"
                      ? "bg-[#171717] text-[#FAFAFA] font-medium"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  Active {stats.open + stats.inProgress}
                </button>
                <button
                  onClick={() => setFilterTab("resolved")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterTab === "resolved"
                      ? "bg-[#171717] text-[#FAFAFA] font-medium"
                      : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  Resolved {stats.resolved}
                </button>
              </div>
              <span className="text-[11px] text-[#71717A] font-mono hidden sm:inline">
                Sorted by newest
              </span>
            </div>

            {/* Incidents List */}
            <div className="flex flex-col gap-2.5">
              {filteredIncidents.slice(0, 5).map((inc) => {
                const isP1 = inc.severity === "Critical" || inc.severity === "High";
                const isResolved = inc.status === "Resolved";
                const isInvestigating = inc.status === "In Progress";

                return (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-lg bg-[#080808] border border-[#27272A] hover:border-[#3F3F46] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="mt-0.5">
                        {isResolved ? (
                          <div className="w-6 h-6 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                            <CheckCircle2 size={14} />
                          </div>
                        ) : isP1 ? (
                          <div className="w-6 h-6 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                            <AlertCircle size={14} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
                            <Activity size={14} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/incidents/${inc.id}`}
                            className="font-medium text-sm text-[#FAFAFA] hover:text-[#3B82F6] transition-colors"
                          >
                            {inc.title}
                          </Link>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
                            {inc.service}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              inc.severity === "Critical"
                                ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                                : inc.severity === "High"
                                ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                                : "bg-[#171717] text-[#A1A1AA] border border-[#27272A]"
                            }`}
                          >
                            {inc.severity === "Critical" ? "P0 Hard Outage" : inc.severity === "High" ? "P1 Critical" : "P2 Medium"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#71717A] font-mono">
                          <span className="flex items-center gap-1">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isResolved
                                  ? "bg-[#22C55E]"
                                  : isInvestigating
                                  ? "bg-[#22D3EE] animate-pulse"
                                  : "bg-[#EF4444]"
                              }`}
                            ></span>
                            <span className="text-[#A1A1AA]">{inc.status}</span>
                          </span>
                          <span>•</span>
                          <span>{inc.timeAgo || "4m ago"}</span>
                          <span>•</span>
                          <span className="text-[#A1A1AA]">
                            {isResolved ? "Postmortem Ready" : "Rate: 1,842 err/min"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="sm:self-center self-end">
                      {isResolved ? (
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111111] hover:bg-[#171717] border border-[#27272A] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                        >
                          <FileText size={13} />
                          <span>Postmortem</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                        >
                          <span>Open Investigation</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Memory Match Available Callout Box */}
            {!dismissedMemoryMatch && (
              <div className="mt-2 p-3.5 rounded-lg bg-[#080808] border border-[#22D3EE]/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shrink-0 mt-0.5">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#FAFAFA]">
                        Memory Match Available
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                        92% similarity
                      </span>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        ref INC-2041
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                      Active <strong className="text-white">Checkout API 503</strong> matches symptoms from{" "}
                      <strong className="text-white">INC-2041</strong> (Oct 24). Mitigated by increasing connection pool sizing on Envoy upstream proxy.
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <Link
                        href="/incidents/INC-1001"
                        className="flex items-center gap-1 text-[#3B82F6] hover:underline font-medium"
                      >
                        <Zap size={13} />
                        <span>Apply known mitigation</span>
                      </Link>
                      <button
                        onClick={() => setDismissedMemoryMatch(true)}
                        className="text-[#71717A] hover:text-[#A1A1AA]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (System Health & Impact) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* System Health */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FAFAFA]">
                <Server size={15} className="text-[#A1A1AA]" />
                <span>System Health</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                6/6 Monitored
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              {[
                { name: "API Gateway", latency: "28ms" },
                { name: "Payment Service", latency: "142ms" },
                { name: "Orders Service", latency: "84ms" },
                { name: "Search Service", latency: "65ms" },
                { name: "Primary Database", latency: "4ms" },
                { name: "Redis Cache", latency: "1.2ms" },
              ].map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#171717] last:border-0"
                >
                  <div className="flex items-center gap-2 text-[#D4D4D8]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                    <span>{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#71717A]">Healthy</span>
                    <span className="font-mono text-[#A1A1AA]">{svc.latency}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#27272A] flex justify-between items-center text-[11px] text-[#71717A] font-mono">
              <span>Core cluster uptime</span>
              <span className="text-[#22C55E] font-medium">99.98%</span>
            </div>
          </div>

          {/* AI & Memory Impact */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FAFAFA]">
                <Brain size={15} className="text-[#22D3EE]" />
                <span>AI & Memory Impact</span>
              </div>
              <span className="text-[10px] font-mono text-[#71717A]">
                7 Day Window
              </span>
            </div>

            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              RecallOps evaluated 14 incidents this week using historical memory vectors to shorten incident blast radius.
            </p>

            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#A1A1AA]">Prior Solution Reuse</span>
                <span className="font-mono font-bold text-[#FAFAFA]">86%</span>
              </div>
              <div className="w-full h-1.5 bg-[#171717] rounded-full overflow-hidden">
                <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: "86%" }}></div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272A] flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                ACTIVE GRAPH NODES
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "# Postgres Connection Pool",
                  "# Stripe Webhook Handshake",
                  "# Envoy HTTP/2 Reset",
                ].map((node) => (
                  <span
                    key={node}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]"
                  >
                    {node}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Protocol Banner */}
      <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#171717] border border-[#27272A] flex items-center justify-center text-[#A1A1AA]">
            <Activity size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#FAFAFA]">
              Incident Readiness Protocol
            </div>
            <p className="text-xs text-[#71717A]">
              Trigger controlled scenario tests or query organizational learnings instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/memory"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-medium text-[#FAFAFA] transition-colors"
          >
            <Database size={13} className="text-[#A1A1AA]" />
            <span>Search Memory</span>
          </Link>
          <Link
            href="/incidents"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-medium text-[#FAFAFA] transition-colors"
          >
            <Server size={13} className="text-[#A1A1AA]" />
            <span>Browse All Incidents</span>
          </Link>
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <Zap size={13} className="fill-current text-white" />
            <span>Simulate Incident</span>
          </Link>
        </div>
      </div>
    </div>
  );
}