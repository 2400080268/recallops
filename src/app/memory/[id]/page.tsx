"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { memoryEntries } from "@/lib/mock-data";
import { useIncidents } from "@/lib/incident-store";
import { MemoryEntry } from "@/types";

export default function MemoryDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "INC-1042";
  const { incidents: storedIncidents } = useIncidents();

  const entry: MemoryEntry = useMemo(() => {
    // 1. Check in stored incidents first for newly retained memories
    const storedMatch = storedIncidents.find((i) => i.id === id);
    if (storedMatch) {
      let cat: "Payment" | "Database" | "Redis" | "Search" | "Authentication" | "Orders" =
        "Payment";
      const s = storedMatch.service.toLowerCase();
      if (s.includes("pay")) cat = "Payment";
      else if (s.includes("data") || s.includes("postgre")) cat = "Database";
      else if (s.includes("redis") || s.includes("cache")) cat = "Redis";
      else if (s.includes("search")) cat = "Search";
      else if (s.includes("auth")) cat = "Authentication";
      else if (s.includes("order")) cat = "Orders";

      return {
        id: storedMatch.id,
        title: storedMatch.title,
        service: storedMatch.service,
        age: storedMatch.memoryCapturedAt
          ? `Retained on ${new Date(storedMatch.memoryCapturedAt).toLocaleDateString()}`
          : "Recently Retained",
        similarity: "100%",
        matchPercentage: "100%",
        rootCause: storedMatch.aiAnalysis?.likelyRootCause || storedMatch.error,
        resolution:
          storedMatch.resolutionDetails?.summary ||
          storedMatch.aiAnalysis?.previousSuccessfulResolution ||
          "Applied verified mitigation runbook.",
        failedAttempts:
          storedMatch.aiAnalysis?.historicalAntiPatternAlert ||
          "Restarting worker nodes alone did not resolve connection saturation.",
        lesson:
          storedMatch.resolutionDetails?.lessonsLearned ||
          "Ensure capacity thresholds are scaled prior to traffic events.",
        relatedIncidents: storedMatch.similarIncidentIds || ["INC-1001"],
        usageCount: 1,
        mttr: storedMatch.resolutionDetails?.resolutionTime || "12 minutes",
        resolvedBy: "RecallOps Autonomous Agent",
        symptoms:
          storedMatch.runtimeFaultSignature?.stackTrace || storedMatch.details,
        category: cat,
        isNewMemory: true,
      };
    }

    return memoryEntries.find((m) => m.id === id) || memoryEntries[0];
  }, [id, storedIncidents]);

  return (
    <div className="flex flex-col w-full space-y-gutter-desktop">
      {/* Back Link & Header */}
      <div className="flex flex-col gap-space-sm">
        <Link
          href="/memory"
          className="inline-flex items-center gap-1 font-label-md text-label-md text-outline hover:text-primary transition-colors"
        >
          <Icon name="arrow_forward" size={16} className="rotate-180" />
          <span>Back to Organizational Memory</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-md border border-[#1F2A37]/50">
          <div>
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline font-mono mb-1">
              <span className="text-primary font-bold">{entry.id}</span>
              <span>•</span>
              <span className="text-secondary">{entry.service} Service</span>
              <span>•</span>
              <span>Archived {entry.age}</span>
              {entry.isNewMemory && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-secondary text-black font-bold font-mono text-[10px]">
                    NEW ORGANIZATIONAL MEMORY
                  </span>
                </>
              )}
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              {entry.id} — {entry.title}
            </h1>
          </div>

          <div className="flex items-center gap-space-sm">
            <span className="px-space-md py-1.5 rounded-lg bg-surface-container-high border border-secondary/40 text-secondary font-label-md text-label-md font-mono">
              Vector Match: {entry.similarity ?? entry.matchPercentage}
            </span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Column (8 cols): Deep Technical Context */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          {/* Incident Context & Symptoms */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface font-headline-sm text-headline-sm">
              <Icon name="receipt_long" size={18} className="text-primary" />
              <span>Incident Context & Symptoms</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              During high-concurrency checkout traffic, API threads experienced
              cascading socket timeouts. Outward user symptoms presented as
              HTTP 504 errors while backend database CPU remained low, masking
              the pool bottleneck.
            </p>
            {entry.symptoms && (
              <div className="p-space-sm bg-surface-container-lowest rounded font-code-inline text-code-inline text-error font-mono border border-[#1F2A37]/40">
                {entry.symptoms}
              </div>
            )}
          </div>

          {/* Root Cause Analysis */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface font-headline-sm text-headline-sm">
              <Icon name="psychology" size={18} className="text-secondary" />
              <span>Root Cause Analysis</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-medium leading-relaxed">
              {entry.rootCause}
            </p>
            <p className="font-body-sm text-body-sm text-outline leading-relaxed">
              Connection pools were statically sized for average non-peak traffic
              (maxPoolSize=100). When transaction duration extended by 40ms,
              available slots fell to 0 within 90 seconds, causing immediate thread
              starvation.
            </p>
          </div>

          {/* Failed Attempts (Anti-Patterns) */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-error/30 space-y-space-sm">
            <div className="flex items-center gap-space-xs text-error font-headline-sm text-headline-sm">
              <Icon name="report" size={18} />
              <span>Failed Attempts (Anti-Patterns to Avoid)</span>
            </div>
            <p className="font-body-md text-body-md text-on-error-container leading-relaxed">
              {entry.failedAttempts}
            </p>
          </div>

          {/* Successful Resolution */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-secondary/40 space-y-space-sm">
            <div className="flex items-center gap-space-xs text-secondary font-headline-sm text-headline-sm">
              <Icon name="verified" size={18} />
              <span>Successful Resolution (Verified Runbook)</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface font-medium leading-relaxed">
              {entry.resolution}
            </p>
            <ol className="list-decimal list-inside font-body-sm text-body-sm text-outline space-y-1 pt-1">
              <li>Deploy config profile patch raising maxPoolSize to 200+.</li>
              <li>Perform rolling worker reboot to close orphaned connections.</li>
              <li>Verify PostgreSQL server active connections headroom.</li>
            </ol>
          </div>

          {/* Lessons Learned */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-sm">
            <div className="flex items-center gap-space-xs text-secondary font-headline-sm text-headline-sm">
              <Icon name="insights" size={18} />
              <span>Lessons Learned</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {entry.lesson}
            </p>
          </div>
        </div>

        {/* Right Column (4 cols): Metadata & Memory Reuse */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Reuse Proof Card */}
          <div className="rounded-xl bg-surface-container p-space-lg shadow-md border border-secondary/40 space-y-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-mono">
                Knowledge Reuse Proof
              </span>
              <Icon name="travel_explore" size={18} className="text-secondary" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">
                {entry.usageCount}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                Active Investigations Reused This
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-outline">
              RecallOps successfully matched this memory vector to expedite root
              cause deduction in subsequent incidents, saving estimated ~42 minutes
              in triage MTTR.
            </p>

            <div className="p-space-sm rounded bg-surface-container-lowest border border-[#1F2A37]/40 font-label-sm text-label-sm font-mono text-outline">
              Vector Key: mem_{entry.id.toLowerCase()}_rca_v2
            </div>
          </div>

          {/* Incident Metadata Card */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-md">
            <span className="font-headline-sm text-headline-sm text-on-surface">
              Archival Metadata
            </span>

            <div className="flex flex-col divide-y divide-[#1F2A37]/50 font-label-sm text-label-sm font-mono">
              <div className="py-2 flex items-center justify-between">
                <span className="text-outline">MTTR</span>
                <span className="text-on-surface font-semibold">{entry.mttr}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-outline">Resolved By</span>
                <span className="text-secondary">{entry.resolvedBy}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-outline">Service Target</span>
                <span className="text-on-surface">{entry.service}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-outline">Memory Bank</span>
                <span className="text-primary">shopease-incidents</span>
              </div>
            </div>
          </div>

          {/* Related Incidents Card */}
          {entry.relatedIncidents && entry.relatedIncidents.length > 0 && (
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-sm">
              <span className="font-headline-sm text-headline-sm text-on-surface">
                Related Incidents
              </span>
              <div className="flex flex-col gap-space-xs pt-1">
                {entry.relatedIncidents.map((relId) => (
                  <Link
                    key={relId}
                    href={`/incidents/${relId}`}
                    className="flex items-center justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors font-label-md text-label-md font-mono text-primary"
                  >
                    <span>{relId}</span>
                    <Icon name="arrow_forward" size={14} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
