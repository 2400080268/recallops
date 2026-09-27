"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { IncidentStatus, Severity } from "@/types";
import { useIncidents } from "@/lib/incident-store";

export default function IncidentsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedService, setSelectedService] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<string>("All");
  const { incidents, stats } = useIncidents();

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Search filter
      const matchesSearch =
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.error.toLowerCase().includes(searchQuery.toLowerCase());

      // Severity filter
      const matchesSeverity =
        selectedSeverity === "All" || incident.severity === selectedSeverity;

      // Service filter
      const matchesService =
        selectedService === "All" || incident.service === selectedService;

      // Tab filter
      const matchesTab =
        activeTab === "All" || incident.status === activeTab;

      return matchesSearch && matchesSeverity && matchesService && matchesTab;
    });
  }, [incidents, searchQuery, selectedSeverity, selectedService, activeTab]);

  const counts = useMemo(() => {
    return {
      all: stats.total,
      open: stats.open,
      inProgress: stats.inProgress,
      resolved: stats.resolved,
    };
  }, [stats]);

  return (
    <div className="flex flex-col w-full space-y-gutter-desktop">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
              Live SRE Triage
            </span>
            <span className="h-1 w-1 rounded-full bg-outline"></span>
            <span className="font-label-sm text-label-sm text-outline">
              ShopEase Cluster
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Incidents
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            View, search, and manage all ShopEase incidents.
          </p>
        </div>

        <Link
          href="/simulator"
          className="flex items-center gap-2 px-space-lg py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md self-start md:self-auto"
        >
          <Icon name="bolt" size={18} className="text-on-primary" />
          <span>Simulate Incident</span>
        </Link>
      </div>

      {/* Filter and Tab Section */}
      <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md space-y-space-md border border-[#1F2A37]/50">
        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
              <Icon name="search" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search incidents, ID, service, error signatures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-space-md py-2 bg-surface-container-lowest border border-[#1F2A37] rounded-lg text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
            />
          </div>

          {/* Severity Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg px-space-md py-2 text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Service Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg px-space-md py-2 text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
            >
              <option value="All">All Services</option>
              <option value="Payment">Payment</option>
              <option value="Orders">Orders</option>
              <option value="Search">Search</option>
              <option value="Database">Database</option>
              <option value="Auth">Auth</option>
              <option value="Checkout">Checkout</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-space-xs border-b border-surface-container-high/40 pb-space-xs pt-1 overflow-x-auto">
          {[
            { id: "All", label: "All", count: counts.all },
            { id: "Open", label: "Open", count: counts.open, alert: counts.open > 0 },
            { id: "In Progress", label: "In Progress", count: counts.inProgress },
            { id: "Resolved", label: "Resolved", count: counts.resolved },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-space-xs px-space-md py-2 rounded-lg font-label-md text-label-md transition-colors ${
                  active
                    ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                    tab.alert
                      ? "bg-error-container text-error font-bold"
                      : active
                      ? "bg-surface-container-highest text-primary"
                      : "bg-surface-container text-outline"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2A37] text-outline font-label-sm text-label-sm uppercase tracking-wider font-mono">
                <th className="py-space-sm px-space-md">Incident</th>
                <th className="py-space-sm px-space-md">Service</th>
                <th className="py-space-sm px-space-md">Severity</th>
                <th className="py-space-sm px-space-md">Status</th>
                <th className="py-space-sm px-space-md">Started</th>
                <th className="py-space-sm px-space-md">Duration</th>
                <th className="py-space-sm px-space-md text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2A37]/60">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-space-xl text-center text-outline font-body-md text-body-md"
                  >
                    No incidents match your current filters.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const isCritical = incident.severity === "Critical";
                  const isHigh = incident.severity === "High";
                  const isMed = incident.severity === "Medium";
                  const isOpen = incident.status === "Open";

                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-surface-container transition-colors group cursor-pointer"
                    >
                      {/* Incident ID & Title */}
                      <td className="py-space-md px-space-md">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="flex flex-col min-w-0"
                        >
                          <div className="flex items-center gap-space-xs">
                            <span className="font-mono text-outline font-medium group-hover:text-primary transition-colors text-label-md">
                              {incident.id}
                            </span>
                            {isOpen && (
                              <span className="h-2 w-2 rounded-full bg-error animate-ping"></span>
                            )}
                          </div>
                          <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-fixed-dim truncate">
                            {incident.title}
                          </span>
                        </Link>
                      </td>

                      {/* Service */}
                      <td className="py-space-md px-space-md">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="flex flex-col"
                        >
                          <span className="font-body-md text-body-md text-on-surface">
                            {incident.service}
                          </span>
                          <span className="font-label-sm text-label-sm text-outline font-mono truncate max-w-[140px]">
                            {incident.serviceVersion ?? "production"}
                          </span>
                        </Link>
                      </td>

                      {/* Severity */}
                      <td className="py-space-md px-space-md">
                        <Link href={`/incidents/${incident.id}`}>
                          <span
                            className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-mono font-medium ${
                              isCritical || isHigh
                                ? "bg-error-container text-error"
                                : isMed
                                ? "bg-surface-container-highest text-secondary"
                                : "bg-surface-container-high text-primary"
                            }`}
                          >
                            Sev: {incident.severity}
                          </span>
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="py-space-md px-space-md">
                        <Link href={`/incidents/${incident.id}`}>
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
                        </Link>
                      </td>

                      {/* Started */}
                      <td className="py-space-md px-space-md font-label-sm text-label-sm text-outline font-mono">
                        <Link href={`/incidents/${incident.id}`}>
                          {incident.started}
                        </Link>
                      </td>

                      {/* Duration */}
                      <td className="py-space-md px-space-md font-label-sm text-label-sm text-outline font-mono">
                        <Link href={`/incidents/${incident.id}`}>
                          {incident.duration}
                        </Link>
                      </td>

                      {/* Action */}
                      <td className="py-space-md px-space-md text-right">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-secondary-fixed-dim transition-colors font-medium"
                        >
                          <span>Investigate</span>
                          <Icon
                            name="chevron_right"
                            size={16}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
