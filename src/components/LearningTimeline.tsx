"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Brain,
  Database,
  Activity,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronRight,
  GitCommit,
  Check,
  AlertCircle,
  Layers,
} from "lucide-react";
import { Incident, IncidentStatus } from "@/types";
import { AgentInvestigationResult, HistoricalEvidenceItem } from "@/lib/agent";
import { RetainPostMortemResult } from "@/lib/hindsight";
import { isRecentlyLearnedEvidence } from "@/components/EvidenceChain";

export interface LearningTimelineProps {
  incident: Incident;
  agentData?: AgentInvestigationResult | null;
  historicalEvidence?: HistoricalEvidenceItem[];
  isNovel?: boolean;
  currentStatus: IncidentStatus;
  resolutionSuccess?: RetainPostMortemResult | null;
  resolutionError?: string | null;
  storedIncidents?: Incident[];
  onOpenResolveModal?: () => void;
  defaultExpanded?: boolean;
}

export type TimelineStepStatus = "completed" | "active" | "pending" | "error" | "novel";

export interface TimelineStepItem {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  status: TimelineStepStatus;
  timestamp: string;
  badge?: string;
  badgeColor?: "green" | "blue" | "cyan" | "amber" | "red" | "neutral";
  detail: string;
  metaSnippet?: string;
  metaSnippetLabel?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  linkUrl?: string;
  linkLabel?: string;
}

export default function LearningTimeline({
  incident,
  agentData,
  historicalEvidence = [],
  isNovel = false,
  currentStatus,
  resolutionSuccess,
  resolutionError,
  storedIncidents = [],
  onOpenResolveModal,
  defaultExpanded = true,
}: LearningTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // -------------------------------------------------------------
  // Dynamic State Derivations (0 additional API calls)
  // -------------------------------------------------------------
  const isResolved =
    currentStatus === "Resolved" ||
    Boolean(incident.resolutionDetails) ||
    Boolean(resolutionSuccess);

  const isMemoryRetained =
    Boolean(incident.memoryCaptured) ||
    Boolean(resolutionSuccess) ||
    Boolean(incident.memoryId);

  const isMemoryFailed = Boolean(resolutionError) && !isMemoryRetained;

  // Check if current incident applied recently learned organizational memory
  const recentlyLearnedItem = useMemo(() => {
    return historicalEvidence.find((item) => isRecentlyLearnedEvidence(item));
  }, [historicalEvidence]);

  // Check if this incident was reused by a subsequent incident in the local store
  const reusedBySubsequentIncident = useMemo(() => {
    if (!incident.id) return null;
    return storedIncidents.find((other) => {
      if (other.id === incident.id) return false;
      const similar = other.similarIncidentIds || [];
      if (similar.includes(incident.id)) return true;
      const foundation = other.aiAnalysis?.evidenceFoundation || "";
      if (foundation.includes(incident.id)) return true;
      if (other.aiAnalysis?.mostRecentEvidence?.id === incident.id) return true;
      const workedIds = other.aiAnalysis?.whatWorkedBefore?.flatMap((w) => w.incidentIds) || [];
      if (workedIds.includes(incident.id)) return true;
      const failedIds = other.aiAnalysis?.whatFailedBefore?.flatMap((f) => f.incidentIds) || [];
      if (failedIds.includes(incident.id)) return true;
      const reasonsCited = other.aiAnalysis?.recommendationReasons?.flatMap((r) => r.evidenceCited) || [];
      if (reasonsCited.includes(incident.id)) return true;
      return false;
    });
  }, [incident.id, storedIncidents]);

  // Root cause text
  const rootCause =
    agentData?.analysis.likelyRootCause ||
    incident.aiAnalysis?.likelyRootCause ||
    "Root cause analyzed via telemetry & memory correlation.";

  const analysisTime =
    agentData?.latencyMs
      ? `${agentData.latencyMs}ms window`
      : incident.aiAnalysis?.analysisDuration || "1.2s window";

  // Build the 6 lifecycle milestone steps strictly according to real state
  const steps: TimelineStepItem[] = useMemo(() => {
    const list: TimelineStepItem[] = [];

    // STEP 1: Incident Detected
    list.push({
      id: "created",
      stepNumber: "01",
      title: "Incident Detected",
      subtitle: "Telemetry & alert ingestion",
      status: "completed",
      timestamp: incident.startedTimestamp || incident.started || "Just now",
      badge: incident.severity.toUpperCase(),
      badgeColor: incident.severity === "Critical" ? "red" : "amber",
      detail: `${incident.service} service reported ${incident.severity} error: "${incident.error}"`,
      metaSnippetLabel: "INGESTION SOURCE",
      metaSnippet: `Datadog APM • Edge Cluster • ID: ${incident.id}`,
    });

    // STEP 2: Agent Investigated
    const hasAnalysis = Boolean(agentData?.analysis || incident.aiAnalysis);
    list.push({
      id: "investigated",
      stepNumber: "02",
      title: "Agent Investigated",
      subtitle: "Groq LLM telemetry reasoning",
      status: hasAnalysis ? "completed" : "active",
      timestamp: analysisTime,
      badge: hasAnalysis ? "SYNTHESIZED" : "INVESTIGATING",
      badgeColor: hasAnalysis ? "blue" : "neutral",
      detail: rootCause,
      metaSnippetLabel: "REASONING ENGINE",
      metaSnippet: `Groq openai/gpt-oss-20b • ${
        agentData?.analysis?.confidenceScore || incident.aiAnalysis?.confidenceScore || 96
      }% confidence assessment`,
    });

    // STEP 3: Memory Recall
    if (isNovel || historicalEvidence.length === 0) {
      list.push({
        id: "recalled",
        stepNumber: "03",
        title: "No Closely Matching Memory Found",
        subtitle: "Novel incident diagnostic",
        status: "novel",
        timestamp: "First-principles",
        badge: "NOVEL INCIDENT",
        badgeColor: "amber",
        detail:
          "No matching historical post-mortems in Hindsight Cloud bank. RecallOps applied first-principles telemetric reasoning rather than precedent.",
        metaSnippetLabel: "HINDSIGHT BANK",
        metaSnippet: "shopease-incidents • 0 precedent vectors matched",
      });
    } else {
      const matchCount = historicalEvidence.length;
      const topMatch = historicalEvidence[0];
      list.push({
        id: "recalled",
        stepNumber: "03",
        title: "Historical Memory Recalled",
        subtitle: "Hindsight semantic query",
        status: "completed",
        timestamp: `${matchCount} matches`,
        badge: recentlyLearnedItem ? "RECENT RECALL" : "MEMORY RETRIEVED",
        badgeColor: recentlyLearnedItem ? "cyan" : "green",
        detail: `Retrieved ${matchCount} relevant historical post-mortems. Top correlation: ${
          topMatch?.incidentId || "INC-1001"
        } (${topMatch?.title || "Checkout contention"}).`,
        metaSnippetLabel: "CORRELATION CITATION",
        metaSnippet: `Hindsight Cloud (shopease-incidents) • Top match: ${
          topMatch?.matchPercentage || "98%"
        }`,
      });
    }

    // STEP 4: Incident Remediation
    if (isResolved) {
      const summary =
        incident.resolutionDetails?.summary ||
        "Applied recommended remediation runbook and restored normal production operations.";
      const mttr = incident.resolutionDetails?.resolutionTime || "14 minutes";
      list.push({
        id: "resolved",
        stepNumber: "04",
        title: "Incident Resolved",
        subtitle: "Remediation runbook applied",
        status: "completed",
        timestamp: mttr,
        badge: "RESOLVED",
        badgeColor: "green",
        detail: summary,
        metaSnippetLabel: "VERIFICATION RUNBOOK",
        metaSnippet: `Verified healthy • MTTR: ${mttr}`,
      });
    } else {
      list.push({
        id: "resolved",
        stepNumber: "04",
        title: "Resolution Pending",
        subtitle: "Awaiting remediation sign-off",
        status: "pending",
        timestamp: "In progress",
        badge: "PENDING",
        badgeColor: "neutral",
        detail:
          "Remediation steps in progress by SRE on-call. Awaiting confirmation of service recovery.",
        metaSnippetLabel: "NEXT ACTION",
        metaSnippet: "Click 'Resolve Incident & Save to Memory' once mitigation is verified.",
      });
    }

    // STEP 5: Memory Retained in Hindsight Cloud
    if (isMemoryFailed) {
      list.push({
        id: "retained",
        stepNumber: "05",
        title: "Memory Retention Failed",
        subtitle: "Hindsight Cloud API error",
        status: "error",
        timestamp: "Action required",
        badge: "FAILED",
        badgeColor: "red",
        detail:
          resolutionError ||
          "Failed to retain incident experience into Hindsight Cloud bank. Network or auth error.",
        metaSnippetLabel: "RECOVERY",
        metaSnippet: "Retry available to retain post-mortem into shopease-incidents.",
        actionButton: onOpenResolveModal
          ? {
              label: "Retry Retention",
              onClick: onOpenResolveModal,
            }
          : undefined,
      });
    } else if (isMemoryRetained) {
      const memId =
        incident.memoryId || resolutionSuccess?.memoryId || "shopease-postmortem-captured";
      list.push({
        id: "retained",
        stepNumber: "05",
        title: "Memory Retained in Hindsight",
        subtitle: "shopease-incidents bank updated",
        status: "completed",
        timestamp: "Retained",
        badge: "MEMORY STORED",
        badgeColor: "green",
        detail: `Incident resolution, root cause, and anti-patterns permanently indexed in Hindsight Cloud (Bank: shopease-incidents).`,
        metaSnippetLabel: "HINDSIGHT RECORD",
        metaSnippet: `Memory ID: ${memId} • Bank: shopease-incidents`,
      });
    } else {
      list.push({
        id: "retained",
        stepNumber: "05",
        title: "Memory Retention Pending",
        subtitle: "Awaiting incident resolution",
        status: "pending",
        timestamp: "Pending",
        badge: "AWAITING RESOLVE",
        badgeColor: "neutral",
        detail:
          "Once this incident is resolved, its post-mortem, effective fixes, and anti-patterns will be retained into Hindsight Cloud.",
        metaSnippetLabel: "TARGET BANK",
        metaSnippet: "shopease-incidents (auto-sync upon resolution)",
      });
    }

    // STEP 6: Memory Reused (The Closed Learning Loop)
    if (recentlyLearnedItem) {
      // Current incident utilized a recently learned memory!
      list.push({
        id: "reused",
        stepNumber: "06",
        title: "Recently Learned Experience Applied",
        subtitle: "Closed-loop memory reuse",
        status: "completed",
        timestamp: "Closed Loop",
        badge: "LOOP CLOSED",
        badgeColor: "cyan",
        detail: `Successfully recalled ${recentlyLearnedItem.incidentId} (${
          recentlyLearnedItem.title || "Recently retained incident"
        }) as verified organizational memory. Applied verified fix without repeating past mistakes.`,
        metaSnippetLabel: "RECALLED PRECEDENT",
        metaSnippet: `Prior Incident: ${recentlyLearnedItem.incidentId} • Similarity: ${
          recentlyLearnedItem.matchPercentage || "High"
        }`,
        linkUrl: `/memory/${recentlyLearnedItem.incidentId}`,
        linkLabel: `View ${recentlyLearnedItem.incidentId} Memory`,
      });
    } else if (reusedBySubsequentIncident) {
      // This incident was retained and reused by another incident!
      list.push({
        id: "reused",
        stepNumber: "06",
        title: `Reused by Future Incident (${reusedBySubsequentIncident.id})`,
        subtitle: "Active organizational asset",
        status: "completed",
        timestamp: "Reused",
        badge: "REUSED IN PROD",
        badgeColor: "cyan",
        detail: `This incident's post-mortem was retrieved by RecallOps during triage of ${
          reusedBySubsequentIncident.id
        } (${reusedBySubsequentIncident.service}), accelerating MTTR.`,
        metaSnippetLabel: "CONSUMING INCIDENT",
        metaSnippet: `${reusedBySubsequentIncident.id}: ${reusedBySubsequentIncident.title}`,
        linkUrl: `/incidents/${reusedBySubsequentIncident.id}`,
        linkLabel: `Inspect ${reusedBySubsequentIncident.id}`,
      });
    } else if (isMemoryRetained) {
      // Memory is stored and active in the bank, ready for any future incident
      list.push({
        id: "reused",
        stepNumber: "06",
        title: "Available for Future Triage",
        subtitle: "Active in organizational memory",
        status: "completed",
        timestamp: "Active",
        badge: "INDEXED IN BANK",
        badgeColor: "green",
        detail:
          "Indexed in Hindsight Cloud bank 'shopease-incidents'. Any future incident with matching error signatures will recall this resolution.",
        metaSnippetLabel: "VECTOR AVAILABILITY",
        metaSnippet: "Searchable by all RecallOps agents across ShopEase",
      });
    } else {
      // Still pending resolution
      list.push({
        id: "reused",
        stepNumber: "06",
        title: "Future Incident Reuse",
        subtitle: "Awaiting retention",
        status: "pending",
        timestamp: "Pending",
        badge: "UPCOMING",
        badgeColor: "neutral",
        detail:
          "Will become searchable organizational memory as soon as resolution is captured and retained in Hindsight.",
        metaSnippetLabel: "LIFECYCLE STATUS",
        metaSnippet: "Awaiting Step 4 (Resolution) and Step 5 (Retention)",
      });
    }

    return list;
  }, [
    incident,
    agentData,
    historicalEvidence,
    isNovel,
    isResolved,
    isMemoryRetained,
    isMemoryFailed,
    resolutionError,
    resolutionSuccess,
    recentlyLearnedItem,
    reusedBySubsequentIncident,
    analysisTime,
    rootCause,
    onOpenResolveModal,
  ]);

  // Overall status summary badge
  const headerSummaryBadge = useMemo(() => {
    if (recentlyLearnedItem) {
      return {
        text: "PRIOR POST-MORTEM REUSED",
        classes: "bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30",
      };
    }
    if (reusedBySubsequentIncident) {
      return {
        text: "REUSED BY FUTURE INCIDENT",
        classes: "bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30",
      };
    }
    if (isMemoryRetained) {
      return {
        text: "MEMORY CAPTURED IN HINDSIGHT",
        classes: "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30",
      };
    }
    if (isMemoryFailed) {
      return {
        text: "RETENTION FAILED",
        classes: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30",
      };
    }
    if (isNovel) {
      return {
        text: "FIRST-PRINCIPLES INVESTIGATION",
        classes: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
      };
    }
    return {
      text: "LIFECYCLE IN PROGRESS",
      classes: "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30",
    };
  }, [
    recentlyLearnedItem,
    reusedBySubsequentIncident,
    isMemoryRetained,
    isMemoryFailed,
    isNovel,
  ]);

  return (
    <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-4 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#080808] border border-[#27272A] flex items-center justify-center text-[#22D3EE] shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[#FAFAFA] font-mono tracking-tight">
                ORGANIZATIONAL LEARNING TIMELINE
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${headerSummaryBadge.classes}`}
              >
                {headerSummaryBadge.text}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">
              Incident Lifecycle: Ingestion → Telemetry Analysis → Memory Recall → Resolution → Hindsight Retention → Closed-Loop Reuse
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors self-start sm:self-auto cursor-pointer"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Collapse Timeline" : "Expand Timeline"}</span>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Expanded Content: 6-Step Stepper Cards */}
      {isExpanded && (
        <div className="flex flex-col gap-5 pt-1">
          {/* Stepper Progress Bar (Desktop & Tablet) */}
          <div className="hidden lg:grid grid-cols-6 gap-2 relative">
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const isDone = step.status === "completed" || step.status === "novel";
              const isCurrent = step.status === "active";
              const isErr = step.status === "error";

              return (
                <div key={step.id} className="flex flex-col gap-2 relative">
                  {/* Top Node Indicator & Connecting Bar */}
                  <div className="flex items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-all border ${
                        isErr
                          ? "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
                          : step.status === "novel"
                          ? "bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]"
                          : step.badgeColor === "cyan"
                          ? "bg-[#22D3EE]/15 border-[#22D3EE]/40 text-[#22D3EE]"
                          : isDone
                          ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
                          : isCurrent
                          ? "bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#3B82F6] animate-pulse"
                          : "bg-[#171717] border-[#27272A] text-[#71717A]"
                      }`}
                    >
                      {isErr ? (
                        <AlertTriangle size={13} />
                      ) : step.status === "novel" ? (
                        <Shield size={13} />
                      ) : step.badgeColor === "cyan" ? (
                        <Sparkles size={13} />
                      ) : isDone ? (
                        <Check size={13} />
                      ) : (
                        <span>{step.stepNumber}</span>
                      )}
                    </div>

                    {!isLast && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                          isDone
                            ? step.badgeColor === "cyan"
                              ? "bg-[#22D3EE]/50"
                              : "bg-[#22C55E]/50"
                            : "bg-[#27272A]"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Title Header */}
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
                      STEP {step.stepNumber}
                    </div>
                    <div className="text-xs font-semibold text-[#FAFAFA] truncate">
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards Grid: 6 Detailed Milestone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {steps.map((step) => {
              const isDone = step.status === "completed";
              const isNovelStep = step.status === "novel";
              const isErr = step.status === "error";
              const isActive = step.status === "active";
              const isPending = step.status === "pending";

              // Color accents
              let borderClass = "border-[#27272A]";
              let iconBg = "bg-[#171717] text-[#71717A] border-[#27272A]";
              let badgeClass = "bg-[#171717] text-[#71717A] border-[#27272A]";

              if (isErr) {
                borderClass = "border-[#EF4444]/40";
                iconBg = "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
                badgeClass = "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
              } else if (step.badgeColor === "cyan") {
                borderClass = "border-[#22D3EE]/40 bg-[#22D3EE]/[0.02]";
                iconBg = "bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30";
                badgeClass = "bg-[#22D3EE]/15 text-[#22D3EE] border-[#22D3EE]/30";
              } else if (isNovelStep) {
                borderClass = "border-[#F59E0B]/40";
                iconBg = "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
                badgeClass = "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30";
              } else if (isDone) {
                borderClass = "border-[#27272A] hover:border-[#3F3F46]";
                iconBg = "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
                badgeClass = "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
              } else if (isActive) {
                borderClass = "border-[#3B82F6]/50";
                iconBg = "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30 animate-pulse";
                badgeClass = "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30";
              }

              return (
                <div
                  key={step.id}
                  className={`rounded-lg bg-[#080808] border ${borderClass} p-3.5 flex flex-col justify-between gap-3 text-left transition-colors`}
                >
                  <div className="flex flex-col gap-2">
                    {/* Top Row: Step # + Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A]">
                        STEP {step.stepNumber}
                      </span>
                      {step.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium ${badgeClass}`}
                        >
                          {step.badge}
                        </span>
                      )}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div>
                      <div className="text-xs font-semibold text-[#FAFAFA] leading-tight">
                        {step.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] mt-0.5">
                        {step.subtitle}
                      </div>
                    </div>

                    {/* Detail Body */}
                    <p className="text-[11px] text-[#A1A1AA] leading-relaxed line-clamp-3">
                      {step.detail}
                    </p>
                  </div>

                  {/* Bottom Meta & Action */}
                  <div className="pt-2 border-t border-[#171717] flex flex-col gap-2">
                    {step.metaSnippet && (
                      <div>
                        {step.metaSnippetLabel && (
                          <div className="text-[9px] font-mono uppercase tracking-wider text-[#71717A]">
                            {step.metaSnippetLabel}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-[#D4D4D8] truncate">
                          {step.metaSnippet}
                        </div>
                      </div>
                    )}

                    {step.actionButton && (
                      <button
                        onClick={step.actionButton.onClick}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-[#EF4444] text-[10px] font-mono font-medium transition-colors cursor-pointer"
                      >
                        <RefreshCw size={11} />
                        <span>{step.actionButton.label}</span>
                      </button>
                    )}

                    {step.linkUrl && (
                      <Link
                        href={step.linkUrl}
                        className="flex items-center justify-between text-[10px] font-mono text-[#22D3EE] hover:underline pt-0.5"
                      >
                        <span>{step.linkLabel || "Inspect Memory"}</span>
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
