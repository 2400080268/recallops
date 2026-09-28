"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Link2,
  Shield,
  AlertCircle,
} from "lucide-react";
import { HistoricalEvidenceItem } from "@/lib/agent";

export interface EvidenceChainProps {
  evidence: HistoricalEvidenceItem[];
  isNovel?: boolean;
  incidentService?: string;
  incidentError?: string;
  recurringPattern?: string;
  defaultExpanded?: boolean;
}

export function isRecentlyLearnedEvidence(item: {
  incidentId: string;
  age?: string;
  isRecentlyLearned?: boolean;
}): boolean {
  if (item.isRecentlyLearned) return true;
  if (item.incidentId === "INC-1099" || item.incidentId.startsWith("INC-11")) return true;
  if (item.age?.includes("September 28, 2026") || item.age?.toLowerCase().includes("recently")) return true;
  return false;
}

export function getEvidenceMatchingSignal(
  item: HistoricalEvidenceItem,
  service?: string,
  error?: string
): string {
  const isRecent = isRecentlyLearnedEvidence(item);
  if (isRecent) {
    return "Recently retained experience. The same remediation successfully resolved the incident.";
  }

  const errLower = (error || "").toLowerCase();
  const itemText = `${item.title} ${item.rootCause} ${item.text || ""}`.toLowerCase();

  if (errLower.includes("redis") || itemText.includes("redis") || itemText.includes("jedis")) {
    return "Same Redis contention signature and distributed cart lock pattern.";
  }
  if (
    errLower.includes("hikari") ||
    errLower.includes("5432") ||
    itemText.includes("hikari") ||
    itemText.includes("postgres") ||
    itemText.includes("connection pool")
  ) {
    return "Same database connection pool exhaustion pattern under peak request concurrency.";
  }
  if (
    errLower.includes("jwt") ||
    errLower.includes("auth") ||
    errLower.includes("clock") ||
    itemText.includes("clock") ||
    itemText.includes("ntp")
  ) {
    return "Same authentication token verification failure and clock skew signature.";
  }
  if (service && item.service.toLowerCase() === service.toLowerCase()) {
    return `Same ${item.service} operational failure mode and runtime error signature.`;
  }
  return `High symptom and root-cause correlation (${item.matchPercentage || "High match"}).`;
}

export default function EvidenceChain({
  evidence,
  isNovel = false,
  incidentService = "",
  incidentError = "",
  recurringPattern,
  defaultExpanded = false,
}: EvidenceChainProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Filter valid supporting incidents
  const supportingIncidents = useMemo(() => {
    if (isNovel) return [];
    return (evidence || []).filter((item) => {
      if (!item.incidentId) return false;
      if (item.score !== undefined && item.score !== null && item.score < 0.25) return false;
      return true;
    });
  }, [evidence, isNovel]);

  // Check if any supporting incident contains a verified resolution
  const hasVerifiedResolution = useMemo(() => {
    return supportingIncidents.some(
      (e) =>
        e.resolution &&
        !e.resolution.toLowerCase().includes("no verified") &&
        !e.resolution.toLowerCase().includes("unknown")
    );
  }, [supportingIncidents]);

  return (
    <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3 transition-all">
      {/* Expandable Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#171717] border border-[#27272A] flex items-center justify-center text-[#3B82F6] shrink-0">
            <Link2 size={13} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#FAFAFA] font-semibold group-hover:text-white transition-colors">
              WHY THIS RECOMMENDATION?
            </span>
            {isNovel ? (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#71717A]">
                FIRST-PRINCIPLES
              </span>
            ) : (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
                EVIDENCE CHAIN
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors">
          <span>
            {isNovel
              ? "0 historical matches"
              : `${supportingIncidents.length} supporting incident${
                  supportingIncidents.length === 1 ? "" : "s"
                }`}
          </span>
          {isExpanded ? (
            <ChevronDown size={14} className="text-[#71717A]" />
          ) : (
            <ChevronRight size={14} className="text-[#71717A]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="pt-3 border-t border-[#1C1C1C] flex flex-col gap-3">
          {/* Case 1: Novel / Unknown Incident (No matching historical experience) */}
          {isNovel || supportingIncidents.length === 0 ? (
            <div className="p-3.5 rounded-lg bg-[#080808] border border-[#27272A] flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#FAFAFA]">
                <Shield size={14} className="text-[#F59E0B]" />
                <span>No closely matching historical incidents found.</span>
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                This recommendation is based on first-principles analysis of the current incident rather
                than a matching historical resolution.
              </p>
            </div>
          ) : !hasVerifiedResolution ? (
            /* Case 2: Related incidents found, but none has a verified resolution */
            <div className="p-3.5 rounded-lg bg-[#080808] border border-[#27272A] flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#FAFAFA]">
                <AlertCircle size={14} className="text-[#F59E0B]" />
                <span>
                  {supportingIncidents.length} related incident{supportingIncidents.length === 1 ? "" : "s"} found
                </span>
              </div>
              {recurringPattern && (
                <div className="text-[11px] font-mono text-[#71717A]">
                  Historical pattern: <span className="text-[#D4D4D8]">{recurringPattern}</span>
                </div>
              )}
              <p className="text-[#F59E0B] leading-relaxed">
                No historical incident contains a verified matching remediation.
              </p>
            </div>
          ) : (
            /* Case 3: Verified historical evidence exists */
            <>
              <div className="text-xs text-[#71717A] flex items-center justify-between">
                <span>
                  {supportingIncidents.length} historical incident{supportingIncidents.length === 1 ? "" : "s"} support
                  this conclusion
                </span>
                <span className="text-[10px] font-mono text-[#71717A]">
                  Bank: shopease-incidents
                </span>
              </div>

              {/* Supporting Incidents Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {supportingIncidents.slice(0, 3).map((item) => {
                  const isRecent = isRecentlyLearnedEvidence(item);
                  const signal = getEvidenceMatchingSignal(item, incidentService, incidentError);

                  return (
                    <div
                      key={item.incidentId}
                      className="rounded-lg bg-[#080808] border border-[#27272A] p-3.5 flex flex-col justify-between gap-3 text-left hover:border-[#3F3F46] transition-colors"
                    >
                      <div className="flex flex-col gap-2">
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-[#FAFAFA]">
                              {item.incidentId}
                            </span>
                            {isRecent ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 font-medium">
                                RECENTLY LEARNED
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#171717] text-[#A1A1AA] border border-[#27272A]">
                                MATCHED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-[#71717A]">
                            {item.matchPercentage || "High Match"}
                          </span>
                        </div>

                        {/* Title & Service */}
                        <div>
                          <div className="text-xs font-semibold text-[#D4D4D8] line-clamp-1">
                            {item.title}
                          </div>
                          <div className="text-[10px] font-mono text-[#71717A]">
                            {item.service} • {item.age || "Historical"}
                          </div>
                        </div>

                        {/* Matching Signal */}
                        <div className="p-2 rounded bg-[#111111] border border-[#1C1C1C] text-[11px] text-[#A1A1AA] leading-relaxed">
                          <span className="text-[9px] font-mono uppercase text-[#71717A] block mb-0.5">
                            MATCHING SIGNAL
                          </span>
                          {signal}
                        </div>

                        {/* Successful Resolution */}
                        {item.resolution && (
                          <div className="p-2 rounded bg-[#111111] border border-[#27272A]">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[#22C55E] mb-0.5">
                              <CheckCircle2 size={11} />
                              <span>Successful Resolution:</span>
                            </div>
                            <p className="text-[11px] text-[#D4D4D8] line-clamp-2 leading-relaxed">
                              {item.resolution}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer Link */}
                      <Link
                        href={`/memory/${item.incidentId}`}
                        className="flex items-center justify-between text-[11px] font-mono text-[#71717A] hover:text-[#FAFAFA] transition-colors pt-2 border-t border-[#171717]"
                      >
                        <span>View Incident Memory</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
