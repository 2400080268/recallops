"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Zap,
  Search,
  CheckCircle2,
  Activity,
  ArrowRight,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useIncidents } from "@/lib/incident-store";

export default function IncidentsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedService, setSelectedService] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<string>("All");
  const { incidents, stats } = useIncidents();

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.error.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === "All" || incident.severity === selectedSeverity;

      const matchesService =
        selectedService === "All" ||
        incident.service.toLowerCase().includes(selectedService.toLowerCase());

      const matchesTab =
        activeTab === "All" || incident.status === activeTab;

      return matchesSearch && matchesSeverity && matchesService && matchesTab;
    });
  }, [incidents, searchQuery, selectedSeverity, selectedService, activeTab]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              Incidents
            </h1>
            <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#111111] border border-[#27272A] px-2 py-0.5 rounded">
              Triage Ledger
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#A1A1AA]">
            Real-time incident ledger, automated triage records, and post-mortems across ShopEase.
          </p>
        </div>

        <Link
          href="/simulator"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-xs transition-colors self-start sm:self-auto shadow-sm"
        >
          <Zap size={14} className="fill-current text-white" />
          <span>Simulate Incident</span>
        </Link>
      </div>

      {/* Filter and Tab Section */}
      <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3.5">
        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search incidents, ID, service, error signatures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#080808] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-[#080808] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical (P0)</option>
              <option value="High">High (P1)</option>
              <option value="Medium">Medium (P2)</option>
              <option value="Low">Low (P3)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-[#080808] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
            >
              <option value="All">All Services</option>
              <option value="Checkout">Checkout</option>
              <option value="Payment">Payment</option>
              <option value="Orders">Orders</option>
              <option value="Database">Database</option>
              <option value="Auth">Auth</option>
              <option value="Search">Search</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-[#27272A] pb-2 text-xs">
          {[
            { id: "All", label: "All", count: stats.total },
            { id: "Open", label: "Open", count: stats.open },
            { id: "In Progress", label: "In Progress", count: stats.inProgress },
            { id: "Resolved", label: "Resolved", count: stats.resolved },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md transition-colors font-medium flex items-center gap-1.5 ${
                  active
                    ? "bg-[#171717] text-[#FAFAFA]"
                    : "text-[#71717A] hover:text-[#A1A1AA]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono text-[#71717A] bg-[#080808] px-1.5 py-0.2 rounded border border-[#27272A]">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Incidents Table / List */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredIncidents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#71717A] font-mono">
              No incidents match the selected filter criteria.
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isP1 = incident.severity === "Critical" || incident.severity === "High";
              const isResolved = incident.status === "Resolved";
              const isInvestigating = incident.status === "In Progress";

              return (
                <div
                  key={incident.id}
                  className="p-3.5 rounded-lg bg-[#080808] border border-[#27272A] hover:border-[#3F3F46] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isResolved ? (
                        <div className="w-6 h-6 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                          <CheckCircle2 size={13} />
                        </div>
                      ) : isP1 ? (
                        <div className="w-6 h-6 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                          <AlertCircle size={13} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
                          <Activity size={13} />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#71717A]">
                          {incident.id}
                        </span>
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="font-medium text-[#FAFAFA] hover:text-[#3B82F6] transition-colors"
                        >
                          {incident.title}
                        </Link>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
                          {incident.service}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            incident.severity === "Critical"
                              ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40"
                              : incident.severity === "High"
                              ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                              : "bg-[#171717] text-[#A1A1AA] border border-[#27272A]"
                          }`}
                        >
                          {incident.severity}
                        </span>
                        {incident.aiAnalysis && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/30">
                            AI Analyzed
                          </span>
                        )}
                        {incident.memoryCaptured && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                            Memory Retained
                          </span>
                        )}
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
                          <span className="text-[#A1A1AA]">{incident.status}</span>
                        </span>
                        <span>•</span>
                        <span>{incident.timeAgo || "Active"}</span>
                        <span>•</span>
                        <span className="truncate max-w-xs">{incident.error}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center self-end">
                    <Link
                      href={`/incidents/${incident.id}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isResolved
                          ? "bg-[#111111] hover:bg-[#171717] border border-[#27272A] text-[#A1A1AA] hover:text-white"
                          : "bg-[#3B82F6] hover:bg-blue-600 text-white"
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <FileText size={13} />
                          <span>View Postmortem</span>
                        </>
                      ) : (
                        <>
                          <span>Investigate</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
