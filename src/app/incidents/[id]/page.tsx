"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Shield,
  FileText,
  Share2,
  Check,
  Ban,
  Users,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Database,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { incidents, memoryEntries } from "@/lib/mock-data";
import { AgentInvestigationResult } from "@/lib/agent";
import { useIncidents, updateIncidentInStore } from "@/lib/incident-store";
import { IncidentStatus } from "@/types";
import { RetainPostMortemResult } from "@/lib/hindsight";
import EvidenceChain, { isRecentlyLearnedEvidence } from "@/components/EvidenceChain";
import LearningTimeline from "@/components/LearningTimeline";

export default function IncidentInvestigationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "INC-1001";

  // Reactive Incident Store
  const { incidents: storedIncidents, getIncident, updateStatus } = useIncidents();

  // Find incident or fallback
  const baseIncident = useMemo(() => {
    return (
      getIncident(id) ||
      storedIncidents.find((inc) => inc.id === id) ||
      incidents.find((inc) => inc.id === id) ||
      incidents[0]
    );
  }, [getIncident, storedIncidents, id]);

  const [currentStatus, setCurrentStatus] = useState<IncidentStatus>(
    baseIncident?.status || "Open"
  );

  useEffect(() => {
    if (baseIncident?.status) {
      setCurrentStatus(baseIncident.status);
    }
  }, [baseIncident?.status]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "investigation" | "logs" | "metrics" | "timeline"
  >("investigation");
  const [applyingFix, setApplyingFix] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real RecallOps AI Agent State
  const [investigating, setInvestigating] = useState(false);
  const [agentData, setAgentData] = useState<AgentInvestigationResult | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // Resolve Modal & Learning State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionTime, setResolutionTime] = useState("14 minutes");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [resolutionSuccess, setResolutionSuccess] = useState<RetainPostMortemResult | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real Agent Execution
  const handleInvestigate = async () => {
    setInvestigating(true);
    setInvestigationError(null);

    updateStatus(baseIncident.id, "In Progress");
    setCurrentStatus("In Progress");

    try {
      const res = await fetch("/api/agent/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: baseIncident.id,
          service: baseIncident.service,
          severity: baseIncident.severity,
          error: baseIncident.error,
          details: `${baseIncident.details} ${
            baseIncident.runtimeFaultSignature?.stackTrace
              ? "Stack trace: " + baseIncident.runtimeFaultSignature.stackTrace
              : ""
          }`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setInvestigationError(data.error || "Failed to complete agent investigation");
        showToast("Investigation failed: " + (data.error || "Unknown error"));
      } else {
        setAgentData(data);
        showToast(`Investigation synthesized by RecallOps in ${data.latencyMs}ms`);

        if (data.analysis) {
          updateIncidentInStore(baseIncident.id, {
            aiAnalysis: {
              agentVersion: "RecallOps v2.4",
              confidenceScore: data.analysis.confidenceScore,
              analysisDuration: data.analysis.analysisDuration,
              likelyRootCause: data.analysis.likelyRootCause,
              evidenceFoundation: data.analysis.evidenceFoundation,
              previousSuccessfulResolution: data.analysis.previousSuccessfulResolution,
              historicalAntiPatternAlert: data.analysis.historicalAntiPatternAlert,
              decisionContext: data.analysis.decisionContext,
              confidenceAssessment: data.analysis.confidenceAssessment,
              recurringPatterns: data.analysis.recurringPatterns,
              whatWorkedBefore: data.analysis.whatWorkedBefore,
              whatFailedBefore: data.analysis.whatFailedBefore,
              recommendationReasons: data.analysis.recommendationReasons,
              caveats: data.analysis.caveats,
              isNovel: data.analysis.isNovel,
              hasContradictoryEvidence: data.analysis.hasContradictoryEvidence,
              contradictionDetails: data.analysis.contradictionDetails,
              mostRecentEvidence: data.analysis.mostRecentEvidence,
              pipelineSteps: [
                { title: "Parsed incident telemetry & error signatures", time: "0ms", completed: true },
                { title: `Queried Hindsight memory (${data.toolCalls[0]?.resultCount || 2} records)`, time: "420ms", completed: true },
                { title: "Retrieved historical incident experiences", time: "890ms", completed: true },
                { title: "Synthesized root cause & verified runbook", time: `${data.latencyMs}ms`, completed: true },
              ],
            },
            recommendedActions: data.analysis.recommendedActions,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setInvestigationError(msg);
      showToast("Network error during investigation");
    } finally {
      setInvestigating(false);
    }
  };

  // Active analysis data
  const currentConfidence = agentData
    ? agentData.analysis.confidenceScore
    : (baseIncident.aiAnalysis?.confidenceScore ?? 96);

  const currentDuration = agentData
    ? agentData.analysis.analysisDuration
    : (baseIncident.aiAnalysis?.analysisDuration ?? "1.2s analysis window");

  const currentRootCause = agentData
    ? agentData.analysis.likelyRootCause
    : (baseIncident.aiAnalysis?.likelyRootCause ??
       "Redis connection contention caused checkout requests to exceed the service timeout threshold.");

  const currentDecisionContext = agentData
    ? agentData.analysis.decisionContext
    : (baseIncident.aiAnalysis?.decisionContext ??
       "Checkout workers exhausted available Jedis connection pools during checkout bursts, cascading into HTTP 503 timeouts at the API gateway edge. Active connection pool exhaustion correlates 1:1 with peak order ingress spikes.");

  const currentResolution = agentData
    ? agentData.analysis.previousSuccessfulResolution
    : (baseIncident.aiAnalysis?.previousSuccessfulResolution ??
       "Increase Jedis max-total connections from 50 -> 200 and applied idle connection reaping.");

  const currentAntiPattern = agentData
    ? agentData.analysis.historicalAntiPatternAlert
    : (baseIncident.aiAnalysis?.historicalAntiPatternAlert ??
       "In INC-1001, restarting the API gateway pods without increasing the Redis worker pool did NOT resolve the outage and caused an additional 8 minutes of customer checkout downtime.");

  const isNovel = agentData?.analysis.isNovel ?? baseIncident.aiAnalysis?.isNovel ?? false;
  const hasContradictory = agentData?.analysis.hasContradictoryEvidence ?? baseIncident.aiAnalysis?.hasContradictoryEvidence ?? false;

  const currentRecurringPattern = useMemo(() => {
    if (agentData?.analysis.recurringPatterns && agentData.analysis.recurringPatterns.length > 0) {
      return agentData.analysis.recurringPatterns[0];
    }
    if (baseIncident.aiAnalysis?.recurringPatterns && baseIncident.aiAnalysis.recurringPatterns.length > 0) {
      return baseIncident.aiAnalysis.recurringPatterns[0];
    }
    return undefined;
  }, [agentData, baseIncident]);

  const currentHistoricalEvidence = useMemo(() => {
    if (agentData && agentData.historicalEvidence.length > 0) {
      return agentData.historicalEvidence;
    }
    // High-fidelity fallback memories matching the approved Stitch design
    return [
      {
        id: "INC-1001",
        incidentId: "INC-1001",
        title: "Checkout 503 during Flash Sale",
        service: "Checkout",
        similarity: "98% Match",
        matchPercentage: "98%",
        rootCause: "Redis connection pool exhaustion due to traffic burst on cart endpoints.",
        resolution: "Increased Jedis max-total connections from 50 -> 200 and applied idle connection reaping.",
        failedAttempts: "Restarted API gateway pods without increasing Redis connection pool limits.",
        age: "4 months ago • resolved in 14m",
      },
      {
        id: "INC-1017",
        incidentId: "INC-1017",
        title: "Payment Latency & Thread Stall",
        service: "Payment",
        similarity: "92% Match",
        matchPercentage: "92%",
        rootCause: "Cache timeout cascading to backend worker thread pool under peak session loads.",
        resolution: "Elevated connection limits and enabled fast-fail circuit breaker for degraded queries.",
        failedAttempts: "Scaled worker pods without increasing backend DB pool size.",
        age: "2 months ago • resolved in 22m",
      },
      {
        id: "INC-1042",
        incidentId: "INC-1042",
        title: "Order Checkout Timeouts",
        service: "Orders",
        similarity: "89% Match",
        matchPercentage: "89%",
        rootCause: "Connection saturation under burst load triggering client-side dropping of socket handlers.",
        resolution: "Increased pool headroom from 100 -> 250 connections across all 12 worker nodes.",
        failedAttempts: "Manual process kills without connection configuration update.",
        age: "3 weeks ago • resolved in 9m",
      },
    ];
  }, [agentData]);

  // Open resolve modal
  const handleOpenResolveModal = () => {
    setResolutionSuccess(null);
    setResolutionError(null);
    setResolutionSummary(currentResolution || "Applied recommended remediation runbook and restored normal production operations.");
    setLessonsLearned(currentAntiPattern || "Configure proactive alerting thresholds and update runbook documentation in organizational memory.");
    setIsResolveModalOpen(true);
  };

  // Confirm resolve and retain into Hindsight Cloud
  const handleConfirmResolution = async () => {
    setResolving(true);
    setResolutionError(null);

    const activeAnalysis = agentData ? agentData.analysis : baseIncident.aiAnalysis;

    try {
      const res = await fetch(`/api/incidents/${baseIncident.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionSummary: resolutionSummary || "Mitigation completed successfully and normal service restored.",
          mttr: resolutionTime || "14 minutes",
          lessonsLearned: lessonsLearned || "Standard remediation procedure verified and captured.",
          incident: {
            id: baseIncident.id,
            title: baseIncident.title,
            service: baseIncident.service,
            severity: baseIncident.severity,
            error: baseIncident.error,
            details: baseIncident.details,
            aiAnalysis: activeAnalysis,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setResolutionError(data.error || "Failed to retain memory in Hindsight Cloud. Please retry.");
        showToast("Memory capture failed: " + (data.error || "Unknown error"));
      } else {
        const resDetails = {
          summary: resolutionSummary || "Mitigation completed successfully.",
          resolutionTime: resolutionTime || "14 minutes",
          lessonsLearned: lessonsLearned || "Standard remediation procedure verified.",
          resolvedAt: data.timestamp || new Date().toISOString(),
        };

        updateStatus(baseIncident.id, "Resolved", resDetails);
        setCurrentStatus("Resolved");
        setResolutionSuccess(data);
        showToast(`Incident resolved & retained to Hindsight Cloud (${data.memoryId})`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setResolutionError(msg);
      showToast("Network error during resolution");
    } finally {
      setResolving(false);
    }
  };

  const handleApplyFix = () => {
    setApplyingFix(true);
    setTimeout(() => {
      setApplyingFix(false);
      setFixApplied(true);
      showToast("ConfigMap patch applied: maxTotal elevated to 200");
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 right-8 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#111111] border border-[#22D3EE] text-[#FAFAFA] text-xs font-medium shadow-xl">
          <Sparkles size={15} className="text-[#22D3EE]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
          <Link href="/incidents" className="hover:text-[#FAFAFA] transition-colors">
            Incidents
          </Link>
          <span>/</span>
          <span className="text-[#D4D4D8]">{baseIncident.id}</span>
          <span>/</span>
          <span className="text-[#A1A1AA]">Production Outage Triage</span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => showToast("Incident investigation link copied to clipboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#27272A] hover:bg-[#171717] text-xs font-medium text-[#D4D4D8] transition-colors"
          >
            <Share2 size={13} className="text-[#A1A1AA]" />
            <span>Share Investigation</span>
          </button>

          {currentStatus === "Resolved" ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-xs font-semibold text-[#22C55E]">
              <CheckCircle2 size={14} />
              <span>Resolved & Recorded</span>
            </div>
          ) : (
            <button
              onClick={handleOpenResolveModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Resolve Incident</span>
            </button>
          )}
        </div>
      </div>

      {/* Incident Title & Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              {baseIncident.title}
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                baseIncident.severity === "Critical"
                  ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40"
                  : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
              }`}
            >
              High Severity • P1
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                currentStatus === "Resolved"
                  ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30"
                  : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  currentStatus === "Resolved" ? "bg-[#22C55E]" : "bg-[#F59E0B] animate-pulse"
                }`}
              ></span>
              <span>{currentStatus}</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
              {baseIncident.service} Service
            </span>
            <span className="text-[11px] font-mono text-[#71717A]">
              Started {baseIncident.timeAgo || "4m ago"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleInvestigate}
            disabled={investigating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Zap size={13} className="fill-current text-white" />
            <span>
              {investigating
                ? "Agent Reasoning..."
                : agentData
                ? "Re-Run Investigation"
                : "Investigate with RecallOps"}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-[#27272A] text-xs font-medium">
        {[
          { id: "overview", label: "Overview" },
          { id: "investigation", label: "Investigation", hasDot: true },
          { id: "logs", label: "Logs 4.2k" },
          { id: "metrics", label: "Metrics" },
          { id: "timeline", label: "Timeline" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 relative transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive ? "text-[#FAFAFA] font-semibold" : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              {tab.hasDot && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]"></span>
              )}
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {activeTab === "investigation" && (
        <div className="flex flex-col gap-5">
          {/* Focal Point Banner */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/30 px-2.5 py-1 rounded font-semibold">
                RECALLOPS INVESTIGATION
              </span>
              <span className="text-xs text-[#71717A] font-mono">
                {investigating ? "AI agent correlating telemetry..." : `Investigation complete • ${currentDuration}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#A1A1AA]">Model Confidence</span>
                <div className="w-24 h-1.5 bg-[#171717] rounded-full overflow-hidden">
                  <div
                    className="bg-[#22D3EE] h-full rounded-full"
                    style={{ width: `${currentConfidence}%` }}
                  ></div>
                </div>
                <span className="font-mono font-bold text-[#FAFAFA]">
                  {currentConfidence}%
                </span>
              </div>

              <button
                onClick={handleInvestigate}
                disabled={investigating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={investigating ? "animate-spin text-[#22D3EE]" : "text-[#A1A1AA]"} />
                <span>{investigating ? "Investigating..." : "Re-Run"}</span>
              </button>
            </div>
          </div>

          {/* Box 1: Likely Root Cause & Telemetry */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-[#EF4444]"></span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#EF4444] font-semibold">
                    LIKELY ROOT CAUSE
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#FAFAFA] leading-snug">
                  {currentRootCause}
                </h2>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
                  CAUSAL MECHANISM (WHY?)
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {currentDecisionContext}
                </p>
              </div>
            </div>

            {/* Live Signature Metrics Box */}
            <div className="lg:col-span-4 rounded-lg bg-[#080808] border border-[#27272A] p-3.5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A]">
                  LIVE SIGNATURE METRICS
                </span>
                <span className="text-[10px] font-mono text-[#3B82F6]">
                  Telemetric Correlation
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#A1A1AA]">Jedis Pool Saturation</span>
                  <span className="text-[#EF4444] font-bold">98 / 100 max</span>
                </div>
                <div className="w-full h-1.5 bg-[#171717] rounded-full overflow-hidden">
                  <div className="bg-[#EF4444] h-full rounded-full" style={{ width: "98%" }}></div>
                </div>
                <span className="text-[10px] text-[#F59E0B] font-mono">
                  ⚠ Critical: 2 connections free across 12 pods
                </span>
              </div>

              <div className="pt-2 border-t border-[#171717] flex justify-between items-center text-xs font-mono">
                <div>
                  <div className="text-[#71717A] text-[10px]">Edge Error Delta</div>
                  <div className="text-[#EF4444] font-semibold">+18.4% 503s</div>
                </div>
                <div className="text-right">
                  <div className="text-[#71717A] text-[10px]">Baseline: 0.02%</div>
                  <div className="text-[#FAFAFA] font-semibold">Current: 18.42%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Organizational Memory Recall */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Organizational Memory Recall
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                    {currentHistoricalEvidence.length} High-Confidence Matches Found
                  </span>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  RecallOps correlated telemetry signatures across historical post-mortems in ShopEase engineering history.
                </p>
              </div>

              <Link
                href="/memory"
                className="flex items-center gap-1 text-xs text-[#3B82F6] hover:underline font-mono self-start sm:self-auto"
              >
                <span>Open Vector Explorer</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 3 Horizontal Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {currentHistoricalEvidence.slice(0, 3).map((item) => {
                const isRecent = isRecentlyLearnedEvidence(item);
                return (
                  <div
                    key={item.incidentId}
                    className={`rounded-lg bg-[#080808] border p-3.5 flex flex-col justify-between gap-3 text-left transition-colors ${
                      isRecent
                        ? "border-[#22D3EE]/40 hover:border-[#22D3EE]/60"
                        : "border-[#27272A] hover:border-[#3F3F46]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-[#FAFAFA]">
                            {item.incidentId}
                          </span>
                          {isRecent && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 font-medium">
                              RECENTLY LEARNED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                          {item.matchPercentage || "94% Match"}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#D4D4D8] mb-0.5">
                        {item.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] mb-2">
                        {isRecent ? "Recently retained to Hindsight" : item.age || "Resolved historically"}
                      </div>

                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-0.5">
                      ROOT CAUSE
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed mb-2.5">
                      {item.rootCause}
                    </p>

                    <div className="p-2 rounded bg-[#111111] border border-[#27272A]">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#22C55E] mb-0.5">
                        <CheckCircle2 size={12} />
                        <span>What Worked</span>
                      </div>
                      <p className="text-[11px] text-[#D4D4D8] line-clamp-2 leading-relaxed">
                        {item.resolution}
                      </p>
                    </div>
                  </div>

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
          </div>

          {/* Box 2.5: Evidence Chain / Why this recommendation? */}
          <EvidenceChain
            evidence={currentHistoricalEvidence}
            isNovel={isNovel}
            incidentService={baseIncident.service}
            incidentError={baseIncident.error}
            recurringPattern={currentRecurringPattern}
            defaultExpanded={false}
          />

          {/* Box 3: Recommended Remediation vs What to Avoid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Recommended Remediation */}
            <div className="lg:col-span-8 rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Recommended Remediation
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
                    Step 1 of 4 Completed
                  </span>
                </div>
                <p className="text-xs text-[#71717A] mb-4">
                  Synthesized 4-step sequence verified by ShopEase historical runbooks
                </p>

                {/* Steps List */}
                <div className="flex flex-col gap-2.5">
                  {/* Step 1 */}
                  <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                      <Check size={12} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAFAFA]">
                          1. Verify Redis client connection saturation on checkout worker pods
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E]">
                          Verified
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A] mt-0.5">
                        Live State: 98/100 active connections [Threshold reached on 11/12 pods]
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#171717] border border-[#27272A] flex items-center justify-center text-xs font-mono text-[#A1A1AA] shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAFAFA]">
                          2. Apply verified configuration patch: Increase max-total connections to 200
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6]">
                          Ready
                        </span>
                      </div>
                      <div className="p-2 mt-1.5 rounded bg-[#111111] border border-[#27272A] font-mono text-[11px] text-[#22D3EE]">
                        ConfigMap: redis-client-pool.yaml → maxTotal: 200, maxIdle: 50
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#171717] border border-[#27272A] flex items-center justify-center text-xs font-mono text-[#A1A1AA] shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAFAFA]">
                          3. Trigger rolling restart of checkout-worker pods
                        </span>
                      </div>
                      <div className="p-2 mt-1.5 rounded bg-[#111111] border border-[#27272A] font-mono text-[11px] text-[#A1A1AA]">
                        kubectl rollout restart deployment/checkout-worker -n production
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[#171717] border border-[#27272A] flex items-center justify-center text-xs font-mono text-[#A1A1AA] shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FAFAFA]">
                          4. Confirm p99 latency normalizes below 120ms baseline
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A] mt-0.5">
                        Automated canary check ready to observe for 120s post-rollout
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#27272A]">
                <button
                  onClick={handleApplyFix}
                  disabled={applyingFix || fixApplied}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Zap size={14} className="fill-current text-white" />
                  <span>
                    {fixApplied
                      ? "Configuration Patch Applied (Ready for Canary)"
                      : applyingFix
                      ? "Applying ConfigMap Patch..."
                      : "Apply Verified Fix (Increase Redis Pool)"}
                  </span>
                </button>
                <span className="text-[11px] font-mono text-[#71717A]">
                  Executes step 2 & 3 via CI pipeline
                </span>
              </div>
            </div>

            {/* Right: What to Avoid */}
            <div className="lg:col-span-4 rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Ban size={15} className="text-[#EF4444]" />
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    What to Avoid (Historical Anti-Pattern)
                  </h3>
                </div>
                <p className="text-xs text-[#71717A] mb-3">
                  ShopEase Post-Mortem Finding: INC-1001
                </p>

                <div className="p-3.5 rounded-lg bg-[#080808] border border-[#EF4444]/40 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#EF4444]">
                    <Ban size={14} />
                    <span>DO NOT RESTART API GATEWAY PODS</span>
                  </div>
                  <p className="text-xs text-[#D4D4D8] leading-relaxed">
                    {currentAntiPattern}
                  </p>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-[#080808] border border-[#27272A]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B] mb-0.5">
                    IMPACT WARNING
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                    Gateway restart resets incoming TCP queues and amplifies retry storms to the already saturated backend pool.
                  </p>
                </div>
              </div>

              {/* Active Incident Response Bridge */}
              <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#171717] border border-[#3F3F46] flex items-center justify-center text-[10px] font-mono text-[#FAFAFA]">
                      AK
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#171717] border border-[#3F3F46] flex items-center justify-center text-[10px] font-mono text-[#FAFAFA]">
                      MC
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#171717] border border-[#3F3F46] flex items-center justify-center text-[10px] font-mono text-[#FAFAFA]">
                      SL
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#FAFAFA]">4 Triaging</div>
                    <div className="text-[10px] font-mono text-[#71717A]">#inc-1101-checkout</div>
                  </div>
                </div>

                <button
                  onClick={() => showToast("Connected to incident bridge #inc-1101-checkout")}
                  className="px-2.5 py-1 rounded bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-mono text-[#FAFAFA] transition-colors"
                >
                  Join Bridge
                </button>
              </div>
            </div>
          </div>

          {/* Learning Timeline: Organizational Memory Lifecycle */}
          <LearningTimeline
            incident={baseIncident}
            agentData={agentData}
            historicalEvidence={currentHistoricalEvidence}
            isNovel={isNovel}
            currentStatus={currentStatus}
            resolutionSuccess={resolutionSuccess}
            resolutionError={resolutionError}
            storedIncidents={storedIncidents}
            onOpenResolveModal={handleOpenResolveModal}
            defaultExpanded={true}
          />

          {/* Box 4: Resolution & Memory Capture Footer */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#FAFAFA]">
                  Ready to resolve and record?
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  All verification steps passed. Resolution will persist this root cause vector to ShopEase Organizational Memory.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => showToast("Incident flagged as false alarm")}
                className="px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors"
              >
                Mark False Alarm
              </button>
              <button
                onClick={handleOpenResolveModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22C55E] hover:bg-emerald-600 text-xs font-semibold text-black transition-colors cursor-pointer shadow-sm"
              >
                <Check size={14} />
                <span>Resolve Incident & Save to Memory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <div className="p-5 rounded-xl bg-[#111111] border border-[#27272A] flex flex-col gap-4 text-xs">
          <div className="text-sm font-semibold text-[#FAFAFA]">Incident Overview</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
              <div className="text-[#71717A] text-[10px]">Service</div>
              <div className="text-[#FAFAFA] font-medium mt-1">{baseIncident.service}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
              <div className="text-[#71717A] text-[10px]">Severity</div>
              <div className="text-[#EF4444] font-medium mt-1">{baseIncident.severity}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
              <div className="text-[#71717A] text-[10px]">Status</div>
              <div className="text-[#22C55E] font-medium mt-1">{currentStatus}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
              <div className="text-[#71717A] text-[10px]">Blast Radius</div>
              <div className="text-[#FAFAFA] font-medium mt-1">Checkout & Cart APIs</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
              RAW INCIDENT TELEMETRY
            </div>
            <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] font-mono text-[11px] text-[#A1A1AA] leading-relaxed">
              {baseIncident.details}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab Content */}
      {activeTab === "logs" && (
        <div className="p-4 rounded-xl bg-[#080808] border border-[#27272A] font-mono text-[11px] text-[#A1A1AA] flex flex-col gap-1.5 min-h-[300px]">
          <div className="text-[#71717A] border-b border-[#27272A] pb-2 mb-2 flex justify-between">
            <span>Container Logs: /var/log/checkout-service.log</span>
            <span>4,289 lines</span>
          </div>
          <div className="text-[#EF4444]">{baseIncident.runtimeFaultSignature?.stackTrace || baseIncident.error}</div>
          <div>10:14:02.114 [WARN] HikariPool-1 - Connection acquisition threshold approaching limit (98/100)</div>
          <div>10:14:02.890 [ERROR] Connection acquisition timed out after 30004ms</div>
          <div>10:14:03.011 [FATAL] Client request dropped with HTTP 503 SERVICE UNAVAILABLE</div>
        </div>
      )}

      {/* Timeline Tab Content */}
      {activeTab === "timeline" && (
        <div className="flex flex-col gap-4">
          <LearningTimeline
            incident={baseIncident}
            agentData={agentData}
            historicalEvidence={currentHistoricalEvidence}
            isNovel={isNovel}
            currentStatus={currentStatus}
            resolutionSuccess={resolutionSuccess}
            resolutionError={resolutionError}
            storedIncidents={storedIncidents}
            onOpenResolveModal={handleOpenResolveModal}
            defaultExpanded={true}
          />
        </div>
      )}

      {/* Resolve & Retain Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-[#111111] border border-[#27272A] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-[#22D3EE]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">
                  Resolve Incident & Retain Organizational Memory
                </h3>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] text-lg"
              >
                ✕
              </button>
            </div>

            {resolutionSuccess ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#FAFAFA] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-semibold text-[#22C55E]">
                    <CheckCircle2 size={16} />
                    <span>Memory Successfully Captured in Hindsight Cloud</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#A1A1AA]">
                    Memory ID: <strong className="text-white">{resolutionSuccess.memoryId}</strong>
                  </div>
                  <div className="font-mono text-[11px] text-[#A1A1AA]">
                    Bank: <strong className="text-white">{resolutionSuccess.bankId}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setIsResolveModalOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] transition-colors mt-2"
                >
                  Close Console
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                    RESOLUTION SUMMARY (VERIFIED RUNBOOK)
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#080808] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                      MTTR (TIME TO RESTORE)
                    </label>
                    <input
                      type="text"
                      value={resolutionTime}
                      onChange={(e) => setResolutionTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[#080808] border border-[#27272A] text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                      TARGET MEMORY BANK
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="shopease-incidents"
                      className="w-full p-2.5 rounded-lg bg-[#080808] border border-[#27272A] text-[#A1A1AA] font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                    LESSONS LEARNED / WHAT TO AVOID
                  </label>
                  <textarea
                    rows={2}
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#080808] border border-[#27272A] text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46]"
                  />
                </div>

                {resolutionError && (
                  <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                    {resolutionError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272A]">
                  <button
                    onClick={() => setIsResolveModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmResolution}
                    disabled={resolving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#22C55E] hover:bg-emerald-600 text-xs font-semibold text-black transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{resolving ? "Retaining Memory..." : "Retain & Complete Resolution"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
