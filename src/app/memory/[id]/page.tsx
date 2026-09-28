"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Brain,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Server,
  Activity,
  FileText,
  Tag,
  Clock,
  Shield,
  ExternalLink,
} from "lucide-react";
import { memoryEntries } from "@/lib/mock-data";
import { useIncidents } from "@/lib/incident-store";
import { HISTORICAL_SHOP_EASE_INCIDENTS } from "@/lib/hindsight-seed";
import { MemoryEntry } from "@/types";

export default function MemoryDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "INC-1001";
  const { incidents: storedIncidents } = useIncidents();

  const entry: MemoryEntry = useMemo(() => {
    // 1. Check stored incidents in client memory
    const storedMatch = storedIncidents.find((i) => i.id === id);
    if (storedMatch) {
      let cat: "Payment" | "Database" | "Redis" | "Search" | "Authentication" | "Orders" = "Payment";
      const s = storedMatch.service.toLowerCase();
      if (s.includes("pay")) cat = "Payment";
      else if (s.includes("data") || s.includes("postgre")) cat = "Database";
      else if (s.includes("redis") || s.includes("cache")) cat = "Redis";
      else if (s.includes("search")) cat = "Search";
      else if (s.includes("auth")) cat = "Authentication";
      else if (s.includes("order") || s.includes("check")) cat = "Orders";

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
        symptoms: storedMatch.runtimeFaultSignature?.stackTrace || storedMatch.details,
        category: cat,
        isNewMemory: true,
      };
    }

    // 2. Check static memory catalogue
    const staticMatch = memoryEntries.find((m) => m.id === id);
    if (staticMatch) {
      return staticMatch;
    }

    // 3. Check historical seed incidents
    const seedMatch = HISTORICAL_SHOP_EASE_INCIDENTS.find((s) => s.id === id);
    if (seedMatch) {
      let cat: "Payment" | "Database" | "Redis" | "Search" | "Authentication" | "Orders" = "Payment";
      const s = seedMatch.service.toLowerCase();
      if (s.includes("pay")) cat = "Payment";
      else if (s.includes("data") || s.includes("postgre")) cat = "Database";
      else if (s.includes("redis") || s.includes("cache")) cat = "Redis";
      else if (s.includes("search")) cat = "Search";
      else if (s.includes("auth")) cat = "Authentication";
      else if (s.includes("order") || s.includes("check")) cat = "Orders";

      return {
        id: seedMatch.id,
        title: seedMatch.title,
        service: seedMatch.service,
        age: seedMatch.date ? `${seedMatch.date}` : "Historical",
        similarity: "96%",
        matchPercentage: "96% Match",
        rootCause: seedMatch.rootCause,
        resolution: seedMatch.successfulResolution,
        failedAttempts: seedMatch.failedAttempts,
        lesson: seedMatch.lessonsLearned,
        relatedIncidents: ["INC-1001"],
        usageCount: 2,
        mttr: seedMatch.resolutionTime || "15 mins",
        resolvedBy: "ShopEase SRE Team",
        symptoms: seedMatch.symptoms || seedMatch.errorSignature,
        category: cat,
      };
    }

    // 4. Clean dynamic fallback strictly preserving the requested ID
    return {
      id,
      title: `${id} — Production Incident Memory`,
      service: "Checkout",
      category: "Redis",
      age: "Recently Retained",
      similarity: "100%",
      matchPercentage: "100% Match",
      rootCause: "Redis connection pool exhaustion and distributed cart lock contention.",
      resolution: "Elevated connection pool limit to 200 and applied distributed back-pressure runbook.",
      failedAttempts: "Restarting services without pool reconfiguration exacerbated connection exhaustion.",
      lesson: "Always verify backend resource headroom before executing rolling service restarts.",
      relatedIncidents: ["INC-1001", "INC-1042"],
      usageCount: 1,
      mttr: "12 mins",
      resolvedBy: "RecallOps Autonomous Agent",
      symptoms: "HTTP 503 Service Unavailable, connection timeout under high concurrency.",
      isNewMemory: true,
    };
  }, [id, storedIncidents]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Back Link & Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/memory"
          className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors font-mono"
        >
          <ArrowLeft size={13} />
          <span>Back to Organizational Memory</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#111111] border border-[#27272A]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-1">
              <span className="font-bold text-[#FAFAFA]">{entry.id}</span>
              <span className="text-[#71717A]">•</span>
              <span className="text-[#22D3EE]">{entry.service} Service</span>
              <span className="text-[#71717A]">•</span>
              <span className="text-[#71717A]">{entry.age}</span>
              {entry.isNewMemory && (
                <>
                  <span className="text-[#71717A]">•</span>
                  <span className="px-2 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-bold font-mono text-[10px]">
                    NEW ORGANIZATIONAL MEMORY
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">
              {entry.id} — {entry.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <span className="px-3 py-1 rounded-lg bg-[#080808] border border-[#27272A] text-[#22D3EE]">
              Vector Match: {entry.similarity ?? entry.matchPercentage}
            </span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Deep Technical Context */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Incident Context & Symptoms */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA]">
              <FileText size={15} className="text-[#3B82F6]" />
              <span>Incident Context & Symptoms</span>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              During high-concurrency peak checkout traffic, service workers experienced cascading connection saturation. Outward user symptoms presented as HTTP 503/504 errors while backend resources appeared healthy, masking connection starvation.
            </p>
            {entry.symptoms && (
              <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] font-mono text-[11px] text-[#EF4444] leading-relaxed">
                {entry.symptoms}
              </div>
            )}
          </div>

          {/* Root Cause Analysis */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA]">
              <Brain size={15} className="text-[#22D3EE]" />
              <span>Root Cause Analysis</span>
            </div>
            <p className="text-xs font-medium text-[#FAFAFA] leading-relaxed">
              {entry.rootCause}
            </p>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Connection pools were statically sized for average non-peak traffic. When concurrency climbed during promotion events, available client connections were fully depleted within seconds, causing active request drops.
            </p>
          </div>

          {/* Failed Attempts (Anti-Patterns) */}
          <div className="rounded-xl bg-[#111111] border border-[#EF4444]/30 p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EF4444]">
              <AlertTriangle size={15} />
              <span>Failed Attempts (Anti-Patterns to Avoid)</span>
            </div>
            <p className="text-xs text-[#D4D4D8] leading-relaxed">
              {entry.failedAttempts}
            </p>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Restarting client application containers without adjusting the backend pool capacity triggers immediate reconnection storms, exacerbating lock contention.
            </p>
          </div>

          {/* Validated Resolution (Runbook) */}
          <div className="rounded-xl bg-[#111111] border border-[#22C55E]/30 p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
              <CheckCircle2 size={15} />
              <span>Verified Resolution Runbook</span>
            </div>
            <p className="text-xs font-medium text-[#FAFAFA] leading-relaxed">
              {entry.resolution}
            </p>
            <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] flex flex-col gap-1.5 font-mono text-[11px] text-[#A1A1AA]">
              <div>1. Patch configuration map with elevated pool limits.</div>
              <div>2. Execute rolling restart with 20% maxUnavailable.</div>
              <div>3. Monitor p99 latency to confirm error drops below 0.1%.</div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Metadata & Impact */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-3.5 text-xs">
            <div className="font-semibold text-[#FAFAFA] pb-2 border-b border-[#27272A]">
              Memory Document Properties
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[#71717A]">Memory Bank</span>
                <span className="font-mono text-[#FAFAFA]">shopease-incidents</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#71717A]">MTTR</span>
                <span className="font-mono text-[#22C55E]">{entry.mttr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#71717A]">Author</span>
                <span className="text-[#D4D4D8]">{entry.resolvedBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#71717A]">Recall Confidence</span>
                <span className="font-mono text-[#22D3EE]">{entry.matchPercentage}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272A] flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                LESSONS LEARNED
              </span>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {entry.lesson}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
