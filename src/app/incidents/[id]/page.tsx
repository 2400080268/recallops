"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { incidents, memoryEntries } from "@/lib/mock-data";
import { AgentInvestigationResult } from "@/lib/agent";
import { useIncidents, updateIncidentInStore } from "@/lib/incident-store";
import { IncidentStatus } from "@/types";
import { RetainPostMortemResult } from "@/lib/hindsight";

export default function IncidentInvestigationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "INC-1098";

  // Reactive Incident Store
  const { incidents: storedIncidents, getIncident, updateStatus } = useIncidents();

  // Find incident or default to INC-1098
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
  const [investigationStep, setInvestigationStep] = useState(0);
  const [agentData, setAgentData] = useState<AgentInvestigationResult | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // Resolve Modal & Learning State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionTime, setResolutionTime] = useState("12 minutes");
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
    setInvestigationStep(1);

    // Update status to In Progress
    updateStatus(baseIncident.id, "In Progress");
    setCurrentStatus("In Progress");

    const t1 = setTimeout(() => setInvestigationStep(2), 500);
    const t2 = setTimeout(() => setInvestigationStep(3), 1100);

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

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        setInvestigationError(data.error || "Failed to complete agent investigation");
        showToast("Investigation failed: " + (data.error || "Unknown error"));
      } else {
        setAgentData(data);
        setInvestigationStep(4);
        showToast(`Investigation synthesized by RecallOps in ${data.latencyMs}ms`);

        // Save synthesized analysis back into incident store so it persists
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
              pipelineSteps: [
                {
                  title: "Parsed incident telemetry & error signatures",
                  time: "0ms",
                  completed: true,
                },
                {
                  title: `Queried Hindsight memory (${data.toolCalls[0]?.resultCount || 2} records)`,
                  time: "420ms",
                  completed: true,
                },
                {
                  title: "Retrieved historical incident experiences",
                  time: "890ms",
                  completed: true,
                },
                {
                  title: "Synthesized root cause & verified runbook",
                  time: `${data.latencyMs}ms`,
                  completed: true,
                },
              ],
            },
            recommendedActions: data.analysis.recommendedActions,
          });
        }
      }
    } catch (err: unknown) {
      clearTimeout(t1);
      clearTimeout(t2);
      const msg = err instanceof Error ? err.message : "Network error";
      setInvestigationError(msg);
      showToast("Network error during investigation");
    } finally {
      setInvestigating(false);
    }
  };

  // Resolve active analysis data (live agentData or static fallback)
  const currentConfidence = agentData
    ? agentData.analysis.confidenceScore
    : (baseIncident.aiAnalysis?.confidenceScore ?? 94);

  const currentDuration = agentData
    ? agentData.analysis.analysisDuration
    : (baseIncident.aiAnalysis?.analysisDuration ?? "1.4s analysis duration");

  const currentRootCause = agentData
    ? agentData.analysis.likelyRootCause
    : (baseIncident.aiAnalysis?.likelyRootCause ??
       "Database connection pool exhaustion on primary PostgreSQL cluster");

  const currentEvidenceFoundation = agentData
    ? agentData.analysis.evidenceFoundation
    : (baseIncident.aiAnalysis?.evidenceFoundation ??
       "Found matching incidents in ShopEase organizational memory with similar runtime signatures.");

  const currentResolution = agentData
    ? agentData.analysis.previousSuccessfulResolution
    : (baseIncident.aiAnalysis?.previousSuccessfulResolution ??
       "Increase database connection pool limit from 100 to 250 in cluster config and restart affected worker pods.");

  const currentAntiPattern = agentData
    ? agentData.analysis.historicalAntiPatternAlert
    : (baseIncident.aiAnalysis?.historicalAntiPatternAlert ??
       "Restarting only the worker pods without increasing the connection pool limit does NOT resolve connection saturation.");

  const currentDecisionContext = agentData
    ? agentData.analysis.decisionContext
    : (baseIncident.aiAnalysis?.decisionContext ??
       "Historical incidents with matching symptoms involved database connection saturation following traffic surges.");

  const currentRecommendedActions = agentData
    ? agentData.analysis.recommendedActions
    : (baseIncident.recommendedActions ?? []);

  const currentHistoricalEvidence = useMemo(() => {
    if (agentData && agentData.historicalEvidence.length > 0) {
      return agentData.historicalEvidence;
    }
    if (baseIncident.aiAnalysis) {
      // Fallback to memory entries
      return memoryEntries.slice(0, 3).map((m) => ({
        id: m.id,
        incidentId: m.id,
        title: m.title,
        service: m.service,
        similarity: m.matchPercentage ?? m.similarity ?? "94%",
        matchPercentage: m.matchPercentage ?? m.similarity ?? "94%",
        rootCause: m.rootCause,
        resolution: m.resolution,
        failedAttempts: m.failedAttempts,
        age: m.age,
        text: m.rootCause,
      }));
    }
    return [];
  }, [agentData, baseIncident.aiAnalysis]);

  // Check if any returned historical evidence item was recently learned
  const recentlyLearnedEvidence = useMemo(() => {
    return currentHistoricalEvidence.filter((ev) => {
      return storedIncidents.some(
        (inc) =>
          inc.id === ev.incidentId &&
          inc.memoryCaptured &&
          inc.id !== baseIncident.id
      );
    });
  }, [currentHistoricalEvidence, storedIncidents, baseIncident.id]);

  // Modal open handler
  const handleOpenResolveModal = () => {
    setResolutionSuccess(null);
    setResolutionError(null);

    if (baseIncident.resolutionDetails) {
      setResolutionSummary(baseIncident.resolutionDetails.summary || "");
      setResolutionTime(baseIncident.resolutionDetails.resolutionTime || "12 minutes");
      setLessonsLearned(baseIncident.resolutionDetails.lessonsLearned || "");
    } else {
      setResolutionSummary(
        currentResolution ||
          "Applied recommended remediation runbook and restored normal production operations."
      );
      setResolutionTime("12 minutes");
      setLessonsLearned(
        currentAntiPattern ||
          "Configure proactive alerting thresholds and update runbook documentation in organizational memory."
      );
    }
    setIsResolveModalOpen(true);
  };

  // Real Hindsight Retain on Resolution Confirm
  const handleConfirmResolution = async () => {
    setResolving(true);
    setResolutionError(null);

    const activeAnalysis = agentData ? agentData.analysis : baseIncident.aiAnalysis;

    try {
      const res = await fetch(`/api/incidents/${baseIncident.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionSummary:
            resolutionSummary || "Mitigation completed successfully and normal service restored.",
          mttr: resolutionTime || "12 minutes",
          lessonsLearned:
            lessonsLearned || "Standard remediation procedure verified and captured.",
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
        setResolutionError(
          data.error || "Failed to retain memory in Hindsight Cloud. Please retry."
        );
        showToast("Memory capture failed: " + (data.error || "Unknown error"));
      } else {
        const resDetails = {
          summary: resolutionSummary || "Mitigation completed successfully.",
          resolutionTime: resolutionTime || "12 minutes",
          lessonsLearned: lessonsLearned || "Standard remediation procedure verified.",
          resolvedAt: data.timestamp || new Date().toISOString(),
        };

        // Update local store: mark as Resolved AND mark memoryCaptured: true
        updateStatus(baseIncident.id, "Resolved", resDetails, {
          memoryCaptured: true,
          memoryId: data.memoryId || baseIncident.id,
          memoryCapturedAt: data.timestamp || new Date().toISOString(),
        });

        setCurrentStatus("Resolved");
        setResolutionSuccess(data);
        showToast(`Incident ${baseIncident.id} resolved and stored into Hindsight memory!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network connection failed";
      setResolutionError(msg);
      showToast("Network error during resolution");
    } finally {
      setResolving(false);
    }
  };

  const handleFalseAlarm = () => {
    const resDetails = {
      summary: "Incident flagged as false alarm; baseline telemetry within normal tolerance.",
      resolutionTime: "2 minutes",
      lessonsLearned: "Recalibrate anomaly detection threshold for baseline fluctuations.",
      resolvedAt: new Date().toISOString(),
    };
    updateStatus(baseIncident.id, "Resolved", resDetails);
    setCurrentStatus("Resolved");
    showToast("Incident marked as False Alarm. Baseline anomaly suppressed.");
  };

  const handleApplyFix = () => {
    setApplyingFix(true);
    setTimeout(() => {
      setApplyingFix(false);
      setFixApplied(true);
      showToast("Config profile elevated: maxPoolSize=250 applied. Rolling worker restart in progress.");
    }, 1200);
  };

  const handleRestartWorkers = () => {
    showToast(`Rolling restart initiated for pod/${baseIncident.service.toLowerCase()}-worker-7f9b8.`);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-8 z-50 flex items-center gap-space-sm p-space-md rounded-xl bg-surface-container-high border border-secondary/50 text-secondary shadow-[0_0_20px_rgba(93,230,255,0.3)] animate-fadeIn">
          <Icon name="check_circle" size={20} className="text-secondary" />
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Resolve Incident & Hindsight Learning Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-surface-container-low border border-[#1F2A37] p-space-xl shadow-2xl flex flex-col gap-space-lg">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1F2A37]/50 pb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Icon name="check_circle" size={24} />
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Resolve Incident & Retain Memory
                  </h2>
                  <p className="font-label-sm text-label-sm text-outline font-mono">
                    Target: {baseIncident.id} • {baseIncident.service} Service
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsResolveModalOpen(false);
                  setResolutionSuccess(null);
                }}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Modal Success View: Memory Captured in Hindsight */}
            {resolutionSuccess ? (
              <div className="flex flex-col gap-space-md py-space-sm animate-fadeIn">
                <div className="flex items-center gap-space-sm p-space-md rounded-xl bg-primary/10 border border-primary/30 text-primary">
                  <Icon name="verified" size={28} className="text-primary shrink-0" />
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Incident Resolved & Retained in Hindsight
                    </h3>
                    <p className="font-label-sm text-label-sm text-outline font-mono">
                      Post-mortem recorded into Hindsight Cloud (shopease-incidents)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-space-md rounded-lg bg-surface-container-lowest border border-[#1F2A37]/40 text-sm font-mono">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Icon name="check" size={16} />
                    <span>✓ Incident marked as Resolved</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Icon name="check" size={16} />
                    <span>✓ Post-mortem document generated</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary font-semibold">
                    <Icon name="cloud_done" size={16} />
                    <span>✓ Organizational memory updated in Hindsight Cloud</span>
                  </div>
                </div>

                <div className="p-space-md rounded-xl bg-secondary/10 border border-secondary/30 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-secondary font-mono uppercase tracking-wider font-semibold">
                    RecallOps Learned from this Incident
                  </span>
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Memory Captured: {baseIncident.id}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    {baseIncident.service} Service • {resolutionSummary || "Remediation verified"}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary font-mono mt-1">
                    Bank: {resolutionSuccess.bankId || "shopease-incidents"} • Document:{" "}
                    {resolutionSuccess.memoryId || baseIncident.id}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-[#1F2A37]/40">
                  <Link
                    href={`/memory/${baseIncident.id}`}
                    className="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-headline-sm font-semibold transition-colors shadow-sm"
                  >
                    <Icon name="open_in_new" size={16} className="text-black" />
                    <span className="text-black">View Memory</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsResolveModalOpen(false);
                      setResolutionSuccess(null);
                    }}
                    className="px-space-lg py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-sm text-headline-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Modal Input Form */
              <div className="flex flex-col gap-space-md">
                {resolutionError && (
                  <div className="p-space-sm rounded-lg bg-error/10 border border-error/30 text-error font-mono text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Icon name="report" size={16} className="shrink-0" />
                      <span>{resolutionError}</span>
                    </div>
                    <button
                      onClick={handleConfirmResolution}
                      className="px-2 py-1 rounded bg-error text-on-error font-bold uppercase text-[10px] shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Field 1: Resolution Summary */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-mono uppercase">
                    Resolution Summary <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    rows={3}
                    disabled={resolving}
                    className="w-full rounded-lg bg-surface-container-lowest border border-[#1F2A37] p-3 text-on-surface font-body-sm text-body-sm focus:border-secondary focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="Describe what was done to mitigate the incident..."
                  />
                </div>

                {/* Field 2: Resolution Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-mono uppercase">
                    Resolution Time / MTTR
                  </label>
                  <input
                    type="text"
                    value={resolutionTime}
                    onChange={(e) => setResolutionTime(e.target.value)}
                    disabled={resolving}
                    className="w-full rounded-lg bg-surface-container-lowest border border-[#1F2A37] px-3 py-2 text-on-surface font-mono text-sm focus:border-secondary focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="e.g. 12 minutes"
                  />
                </div>

                {/* Field 3: Lessons Learned */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-mono uppercase">
                    Lessons Learned & Follow-up Actions
                  </label>
                  <textarea
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    rows={3}
                    disabled={resolving}
                    className="w-full rounded-lg bg-surface-container-lowest border border-[#1F2A37] p-3 text-on-surface font-body-sm text-body-sm focus:border-secondary focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="Key takeaways to prevent future recurrence..."
                  />
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container text-xs text-outline font-mono flex items-center gap-2 border border-[#1F2A37]/30">
                  <Icon name="brain" size={16} className="text-secondary shrink-0" />
                  <span>
                    Confirming resolution calls Hindsight <code className="text-secondary">retain()</code> to persist this post-mortem into organizational memory.
                  </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-space-sm border-t border-[#1F2A37]/50 pt-space-md">
                  <button
                    onClick={() => setIsResolveModalOpen(false)}
                    disabled={resolving}
                    className="px-space-lg py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-sm text-headline-sm transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmResolution}
                    disabled={resolving}
                    className="flex items-center gap-space-xs px-space-xl py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-60"
                  >
                    {resolving ? (
                      <>
                        <Icon name="autorenew" size={18} className="animate-spin text-black" />
                        <span className="text-black">Retaining in Hindsight...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={18} />
                        <span>Confirm & Retain Memory</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incident Hero Header Card */}
      <div className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low px-space-xl py-space-md rounded-xl shadow-md border border-[#1F2A37]/50">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                {baseIncident.title}
              </h1>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm uppercase border border-[#1F2A37]/30">
                simulated
              </span>
            </div>
            <div className="flex items-center gap-space-sm font-label-md text-label-md text-outline">
              <span className="flex items-center gap-1 text-on-surface-variant font-medium">
                <span
                  className={`h-2 w-2 rounded-full ${
                    currentStatus === "Resolved"
                      ? "bg-primary"
                      : "bg-secondary animate-pulse"
                  }`}
                ></span>
                {currentStatus === "Resolved" ? "Resolved Incident" : "Active Incident"}
              </span>
              <span className="text-surface-variant">•</span>
              <span>Started {baseIncident.started}</span>
              <span className="text-surface-variant">•</span>
              <span className="text-primary font-mono font-semibold">
                {baseIncident.id}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Primary Agent Action in Hero */}
            <button
              onClick={handleInvestigate}
              disabled={investigating}
              type="button"
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-headline-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-60"
            >
              {investigating ? (
                <>
                  <Icon name="autorenew" size={16} className="animate-spin text-black" />
                  <span className="text-black">Investigating...</span>
                </>
              ) : (
                <>
                  <Icon name="smart_toy" size={16} className="text-black" />
                  <span className="text-black">
                    {agentData || baseIncident.aiAnalysis
                      ? "Re-run Agent Investigation"
                      : "Investigate with RecallOps"}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-error/10 text-error font-label-sm text-label-sm font-semibold tracking-wide uppercase border border-error/20">
              <Icon name="local_fire_department" size={15} />
              {baseIncident.severity} Severity
            </div>

            <div
              className={`flex items-center gap-1.5 px-space-sm py-1 rounded font-label-sm text-label-sm font-mono border ${
                currentStatus === "Resolved"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : currentStatus === "In Progress"
                  ? "bg-secondary/15 text-secondary border-secondary/30"
                  : "bg-surface-container-high text-on-surface border-[#1F2A37]/40"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  currentStatus === "Resolved"
                    ? "bg-primary"
                    : currentStatus === "In Progress"
                    ? "bg-secondary animate-pulse"
                    : "bg-error animate-ping"
                }`}
              ></span>
              {currentStatus}
            </div>

            {/* Memory Captured Badge in Hero */}
            {baseIncident.memoryCaptured && (
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-secondary/15 text-secondary font-label-sm text-label-sm font-mono border border-secondary/30">
                <Icon name="psychology" size={15} />
                <span>Memory Captured</span>
              </div>
            )}

            <button
              onClick={() => showToast("Incident snapshot copied to clipboard.")}
              type="button"
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm transition-colors shadow-sm border border-[#1F2A37]/50"
            >
              <Icon name="share" size={16} className="text-outline" />
              <span>Share</span>
            </button>

            <button
              onClick={handleFalseAlarm}
              type="button"
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-body-sm text-body-sm transition-colors shadow-sm border border-[#1F2A37]/50"
            >
              <Icon name="notification_important" size={16} className="text-error" />
              <span>False Alarm</span>
            </button>

            {currentStatus === "Resolved" ? (
              <button
                onClick={handleOpenResolveModal}
                type="button"
                className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md border border-primary/30"
              >
                <Icon name="check_circle" size={18} className="text-primary" />
                <span>Resolved (Edit Note)</span>
              </button>
            ) : (
              <button
                onClick={handleOpenResolveModal}
                type="button"
                className="flex items-center gap-space-xs px-space-lg py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold transition-all shadow-md active:scale-95"
              >
                <Icon name="check_circle" size={18} />
                <span>Resolve Incident</span>
              </button>
            )}
          </div>
        </div>

        {/* Resolved Status Details Banner */}
        {currentStatus === "Resolved" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-md rounded-xl bg-primary/10 border border-primary/30 shadow-md animate-fadeIn">
            <div className="flex items-center gap-space-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-black">
                <Icon name="verified" size={22} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Incident Mitigated & Resolved
                  </span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    MTTR: {baseIncident.resolutionDetails?.resolutionTime ?? "12 minutes"}
                  </span>
                  {baseIncident.memoryCaptured && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/30 flex items-center gap-1">
                      <Icon name="cloud_done" size={12} />
                      <span>Added to Organizational Memory</span>
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {baseIncident.resolutionDetails?.summary ??
                    "Remediation verified and production telemetry normalized."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {baseIncident.memoryCaptured && (
                <Link
                  href={`/memory/${baseIncident.id}`}
                  className="px-space-md py-1.5 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-label-md text-label-md font-semibold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Icon name="travel_explore" size={14} className="text-black" />
                  <span className="text-black">View in Memory</span>
                </Link>
              )}
              <button
                onClick={handleOpenResolveModal}
                className="self-start sm:self-auto px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-medium transition-colors border border-[#1F2A37]/50"
              >
                Edit Resolution Note
              </button>
            </div>
          </div>
        )}

        {/* Recently Learned Experience Callout Banner (Proof of Learning Loop) */}
        {recentlyLearnedEvidence.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-md rounded-xl bg-secondary/15 border-2 border-secondary/40 text-on-surface shadow-lg animate-fadeIn">
            <div className="flex items-center gap-space-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-black shadow-md">
                <Icon name="psychology" size={22} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Recently Learned Experience Applied
                  </span>
                  <span className="px-2 py-0.5 rounded bg-secondary text-black font-mono text-xs font-bold shadow-sm">
                    Learned from {recentlyLearnedEvidence.map((e) => e.incidentId).join(", ")}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-outline">
                  RecallOps autonomously retrieved post-mortem memory retained in Hindsight Cloud from{" "}
                  <span className="text-secondary font-mono font-semibold">
                    {recentlyLearnedEvidence[0].incidentId}
                  </span>{" "}
                  and referenced its verified resolution for this investigation.
                </p>
              </div>
            </div>
            <Link
              href={`/memory/${recentlyLearnedEvidence[0].incidentId}`}
              className="self-start sm:self-auto flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary font-label-md text-label-md font-semibold transition-colors border border-secondary/40 shrink-0"
            >
              <span>Inspect Learned Memory</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest px-space-sm py-1 rounded-lg shadow-inner border border-[#1F2A37]/40">
          <div className="flex items-center gap-space-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                activeTab === "overview"
                  ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-low"
              }`}
              type="button"
            >
              <Icon name="info" size={16} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("investigation")}
              className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                activeTab === "investigation"
                  ? "bg-surface-container-high text-secondary font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-low"
              }`}
              type="button"
            >
              <Icon name="psychology" size={16} className="text-secondary" />
              <span>Investigation</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-secondary animate-ping"></span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                activeTab === "logs"
                  ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-low"
              }`}
              type="button"
            >
              <Icon name="terminal" size={16} />
              <span>Logs</span>
              <span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-sm text-label-sm font-mono">
                4.2k
              </span>
            </button>

            <button
              onClick={() => setActiveTab("metrics")}
              className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                activeTab === "metrics"
                  ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-low"
              }`}
              type="button"
            >
              <Icon name="monitoring" size={16} />
              <span>Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-colors ${
                activeTab === "timeline"
                  ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-low"
              }`}
              type="button"
            >
              <Icon name="timeline" size={16} />
              <span>Timeline</span>
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-space-md px-space-md py-1 font-label-sm text-label-sm text-outline font-mono">
            <span className="flex items-center gap-1.5 text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
              ENGINE_AI_ACTIVE
            </span>
            <span className="text-surface-variant">|</span>
            <span>MODEL: openai/gpt-oss-20b</span>
          </div>
        </div>
      </div>

      {/* Main Investigation Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Card 1: Telemetry & Context */}
          <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-md border border-[#1F2A37]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="p-1.5 rounded bg-surface-container-high text-primary border border-[#1F2A37]/40">
                  <Icon name="receipt_long" size={18} />
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                  Incident Telemetry & Context
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline font-mono">
                ID: {baseIncident.id}
              </span>
            </div>

            {/* Target & Severity Grid */}
            <div className="grid grid-cols-2 gap-space-sm p-space-sm bg-surface-container rounded-lg border border-[#1F2A37]/40">
              <div className="flex flex-col gap-0.5">
                <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                  Target Service
                </span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  {baseIncident.service} Service
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-mono">
                  {baseIncident.serviceVersion ?? "v3.8.1 (production)"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                  Impact Severity
                </span>
                <div className="flex items-center gap-1.5">
                  <Icon name="warning" size={16} className="text-error" />
                  <span className="font-body-md text-body-md text-error font-semibold">
                    {baseIncident.impactSeverity ?? `${baseIncident.severity} / P1 Sev`}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  {baseIncident.sloBreachWarning ?? "SLO Breach Imminent"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 mt-space-xs">
                <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                  Started Timestamp
                </span>
                <span className="font-body-md text-body-md text-on-surface">
                  {baseIncident.startedTimestamp ?? "Sep 27, 2026, 10:16 PM"}
                </span>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  {baseIncident.elapsedSeconds ?? 120}s elapsed
                </span>
              </div>
              <div className="flex flex-col gap-0.5 mt-space-xs">
                <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                  Error Spike Rate
                </span>
                <div className="flex items-center gap-1.5">
                  <Icon name="trending_up" size={16} className="text-error" />
                  <span className="font-body-md text-body-md text-error font-mono font-bold">
                    {baseIncident.errorSpikeRate ?? "+31.4% spike"}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  {baseIncident.errorBaseline ?? "Baseline: 0.18%"}
                </span>
              </div>
            </div>

            {/* Runtime Fault Signature */}
            <div className="flex flex-col gap-space-xs bg-surface-container rounded-lg p-space-md border border-[#1F2A37]/40">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                  Runtime Fault Signature
                </span>
                <span className="font-label-sm text-label-sm text-error font-mono font-semibold">
                  {baseIncident.runtimeFaultSignature?.code ?? baseIncident.error}
                </span>
              </div>
              <pre className="p-space-sm bg-surface-container-lowest rounded font-code-inline text-code-inline text-error font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-[#1F2A37]/50 max-h-48">
                {baseIncident.runtimeFaultSignature?.stackTrace ??
                  `org.postgresql.util.PSQLException: The connection attempt failed.
Caused by: java.net.SocketTimeoutException: connect timed out [port:5432]
at com.shopease.payment.db.HikariPoolManager.getConnection(HikariPoolManager.kt:142)`}
              </pre>
            </div>

            {/* Recent Deployment Correlation */}
            <div className="p-space-md rounded-lg bg-surface-container-high flex flex-col gap-space-xs border border-[#1F2A37]/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-semibold">
                  <Icon name="history_toggle_off" size={16} />
                  <span>Recent Deployment Correlation</span>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  {baseIncident.recentDeployment?.timeAgo ?? "18m ago"}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface">
                Configuration profile{" "}
                <span className="font-mono text-primary bg-surface-container-lowest px-1 py-0.5 rounded border border-[#1F2A37]/30">
                  {baseIncident.recentDeployment?.profile ?? "db-pool-v4"}
                </span>{" "}
                applied to cluster{" "}
                {baseIncident.recentDeployment?.cluster ?? "payment-primary-us-east"}.
              </p>
              <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
                <span>
                  Author:{" "}
                  {baseIncident.recentDeployment?.author ??
                    "release-bot (ArgoCD Pipeline #8942)"}
                </span>
                <span>•</span>
                <span className="text-secondary font-mono">
                  {baseIncident.recentDeployment?.commit ?? "Commit a79f40e"}
                </span>
              </div>
            </div>

            {/* Live Connection Pool Utilization */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between font-label-sm text-label-sm font-mono">
                <span className="text-outline uppercase">
                  Live Resource Utilization
                </span>
                <span className="text-error font-semibold">
                  {fixApplied
                    ? "98 / 250 max (39% NOMINAL)"
                    : `${baseIncident.connectionPoolUtilization?.current ?? 98} / ${
                        baseIncident.connectionPoolUtilization?.max ?? 100
                      } max (98% SATURATED)`}
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    fixApplied ? "bg-primary" : "bg-error"
                  }`}
                  style={{ width: fixApplied ? "39%" : "98%" }}
                ></div>
              </div>
              <div className="flex justify-between text-outline font-label-sm text-label-sm font-mono mt-0.5">
                <span>
                  Available: {fixApplied ? "152" : (baseIncident.connectionPoolUtilization?.available ?? 2)}
                </span>
                <span>
                  Waiting Threads:{" "}
                  {fixApplied
                    ? "0 queued"
                    : `${baseIncident.connectionPoolUtilization?.waitingThreads ?? 412} queued`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Recommended Action Checklist */}
          <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-md border border-[#1F2A37]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="p-1.5 rounded bg-surface-container-high text-secondary border border-[#1F2A37]/40">
                  <Icon name="checklist" size={18} />
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                  Recommended Action Checklist
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-mono">
                {currentRecommendedActions.length} Steps Synthesized
              </span>
            </div>

            <div className="flex flex-col gap-space-sm">
              {currentRecommendedActions.map((action) => (
                <div
                  key={action.step}
                  className="flex items-start gap-space-md p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors border border-[#1F2A37]/30"
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold mt-0.5 ${
                      action.step === 1
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-container-highest text-on-surface"
                    }`}
                  >
                    {action.step}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-body-md text-on-surface font-medium">
                        {action.title}
                      </span>
                      {action.tag && (
                        <span
                          className={`font-label-sm text-label-sm font-mono font-bold ${
                            action.tagType === "critical"
                              ? "text-error"
                              : action.tagType === "warning"
                              ? "text-yellow-400"
                              : "text-secondary"
                          }`}
                        >
                          {action.tag}
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-outline mt-0.5">
                      {action.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={handleRestartWorkers}
                className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary font-body-sm text-body-sm font-semibold transition-colors shadow-sm border border-[#1F2A37]/40"
              >
                <Icon name="restart_alt" size={16} />
                <span>Restart Workers</span>
              </button>
              <button
                type="button"
                onClick={handleApplyFix}
                disabled={applyingFix || fixApplied}
                className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-2 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-headline-sm font-semibold transition-colors shadow-md disabled:opacity-60"
              >
                <Icon name="tune" size={16} />
                <span>
                  {applyingFix
                    ? "Applying Fix..."
                    : fixApplied
                    ? "Fix Applied"
                    : "Apply Mitigating Fix"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): RecallOps AI Agent */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* Card 1: Agent Header & Pipeline */}
          <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-md border border-[#1F2A37]/50">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-lg border border-[#1F2A37]/40">
              <div className="flex items-center gap-space-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container shadow-sm">
                  <Icon name="smart_toy" size={20} className="text-on-primary" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                      RecallOps Agent v2.4
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm font-mono border border-[#1F2A37]/30">
                      {agentData
                        ? "LIVE_AGENT_SYNTHESIS"
                        : baseIncident.aiAnalysis
                        ? "AUTOMATED_SYNTHESIS"
                        : "AWAITING_INVESTIGATION"}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline font-mono">
                    {agentData || baseIncident.aiAnalysis
                      ? `Investigation Synthesized • ${currentDuration}`
                      : "Ready to investigate • Connect Groq + Hindsight"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(agentData || baseIncident.aiAnalysis) && (
                  <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container font-label-sm text-label-sm text-secondary font-mono border border-[#1F2A37]/30">
                    <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
                    {currentConfidence}% Confidence
                  </div>
                )}

                <button
                  onClick={handleInvestigate}
                  disabled={investigating}
                  type="button"
                  className="px-space-md py-1 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  title="Run real Groq + Hindsight investigation loop"
                >
                  {investigating ? (
                    <>
                      <Icon name="autorenew" size={14} className="animate-spin text-black" />
                      <span className="text-black">Investigating...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="psychology" size={14} className="text-black" />
                      <span className="text-black">
                        {agentData || baseIncident.aiAnalysis
                          ? "Re-Investigate"
                          : "Investigate"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner with Retry */}
            {investigationError && (
              <div className="p-space-md rounded-xl bg-error/10 border border-error/30 text-error flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <Icon name="report" size={20} className="text-error shrink-0" />
                  <span>{investigationError}</span>
                </div>
                <button
                  onClick={handleInvestigate}
                  className="px-space-md py-1 rounded-lg bg-error text-on-error font-headline-sm text-headline-sm font-semibold shrink-0 hover:bg-error/90 transition-colors flex items-center gap-1.5"
                >
                  <Icon name="refresh" size={14} />
                  <span>Retry Investigation</span>
                </button>
              </div>
            )}

            {/* Active Investigation Loading State with Exact Stage 6 Progress */}
            {investigating && (
              <div className="p-space-lg rounded-xl bg-surface-container-lowest border-2 border-secondary/40 flex flex-col gap-space-md shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary font-headline-sm text-headline-sm font-semibold">
                    <Icon name="autorenew" size={20} className="animate-spin text-secondary" />
                    <span>RecallOps Agent Investigating Incident...</span>
                  </div>
                  <span className="hidden sm:inline-block font-label-sm text-label-sm font-mono text-outline">
                    Groq (openai/gpt-oss-20b) + Hindsight (shopease-incidents)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container text-xs font-mono text-secondary border border-secondary/30">
                    <Icon name="check_circle" size={16} className="text-secondary shrink-0" />
                    <span>✓ Incident received</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono border transition-all ${
                      investigationStep >= 1
                        ? "bg-surface-container text-secondary border-secondary/30"
                        : "bg-surface-container-low text-outline border-transparent"
                    }`}
                  >
                    <Icon
                      name={investigationStep >= 1 ? "check_circle" : "hourglass_empty"}
                      size={16}
                      className={investigationStep >= 1 ? "text-secondary shrink-0" : "text-outline shrink-0"}
                    />
                    <span>{investigationStep >= 1 ? "✓ Incident parsed" : "○ Parsing incident"}</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono border transition-all ${
                      investigationStep >= 2
                        ? "bg-secondary/15 text-secondary border-secondary/40 font-semibold"
                        : "bg-surface-container-low text-outline border-transparent"
                    }`}
                  >
                    <Icon
                      name={investigationStep >= 2 ? "autorenew" : "radio_button_unchecked"}
                      size={16}
                      className={
                        investigationStep >= 2
                          ? "animate-spin text-secondary shrink-0"
                          : "text-outline shrink-0"
                      }
                    />
                    <span>
                      {investigationStep >= 3 ? "✓ Memory searched" : "● Searching memory"}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono border transition-all ${
                      investigationStep >= 3
                        ? "bg-secondary/15 text-secondary border-secondary/40 font-semibold"
                        : "bg-surface-container-low text-outline border-transparent"
                    }`}
                  >
                    <Icon
                      name={investigationStep >= 3 ? "autorenew" : "radio_button_unchecked"}
                      size={16}
                      className={
                        investigationStep >= 3
                          ? "animate-spin text-secondary shrink-0"
                          : "text-outline shrink-0"
                      }
                    />
                    <span>
                      {investigationStep >= 4 ? "✓ Synthesized" : "○ Synthesizing"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hindsight Tool Memory Telemetry Banner */}
            {agentData && agentData.toolCalls.length > 0 && (
              <div className="p-space-sm rounded-lg bg-surface-container-lowest border border-secondary/30 flex flex-col gap-1 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1 text-secondary">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Icon name="psychology" size={14} className="text-secondary" />
                    <span>Hindsight Memory Bank Queried (shopease-incidents)</span>
                  </div>
                  <span className="text-outline text-[11px]">
                    {agentData.latencyMs}ms • model: {agentData.model}
                  </span>
                </div>
                <div className="text-outline text-[11px]">
                  Tool: <span className="text-primary font-bold">{agentData.toolCalls[0].tool}</span> • Recalled:{" "}
                  <span className="text-secondary font-bold">{agentData.toolCalls[0].resultCount}</span> incident memories • Query: &quot;
                  {agentData.toolCalls[0].query}&quot;
                </div>
              </div>
            )}

            {/* Investigation Pipeline Execution / Activity Timeline */}
            {(agentData || baseIncident.aiAnalysis) && (
              <div className="flex flex-col gap-space-sm p-space-md bg-surface-container rounded-lg border border-[#1F2A37]/40">
                <span className="font-label-sm text-label-sm text-outline font-mono uppercase tracking-wider">
                  Agent Activity Timeline & Pipeline Execution
                </span>
                <div className="flex flex-col gap-space-sm relative">
                  {agentData?.timeline ? (
                    agentData.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-space-md">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-highest text-secondary">
                          <Icon name="check" size={14} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-1">
                          <span className="font-body-sm text-body-sm text-on-surface font-medium">
                            {step.title}
                            <span className="text-outline font-normal ml-1">
                              — {step.detail}
                            </span>
                          </span>
                          <span className="font-label-sm text-label-sm text-outline font-mono shrink-0">
                            {step.timeMs}ms
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-space-md">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-highest text-secondary">
                          <Icon name="check" size={14} />
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface">
                          Parsed incident telemetry, stack traces, and pod health snapshots
                        </span>
                        <span className="ml-auto font-label-sm text-label-sm text-outline font-mono">
                          0ms
                        </span>
                      </div>

                      <div className="flex items-center gap-space-md">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-highest text-secondary">
                          <Icon name="check" size={14} />
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface">
                          Memory search initiated via search_incident_memory
                        </span>
                        <span className="ml-auto font-label-sm text-label-sm text-outline font-mono">
                          320ms
                        </span>
                      </div>

                      <div className="flex items-center gap-space-md">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-highest text-secondary">
                          <Icon name="check" size={14} />
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface">
                          Retrieved historical incident experiences from Hindsight Cloud
                        </span>
                        <span className="ml-auto font-label-sm text-label-sm text-outline font-mono">
                          980ms
                        </span>
                      </div>

                      <div className="flex items-center gap-space-md">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-black shadow-sm">
                          <Icon name="done_all" size={14} />
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                          Synthesized root cause & validated active remediation strategy
                        </span>
                        <span className="ml-auto font-label-sm text-label-sm text-secondary font-mono">
                          1520ms
                        </span>
                      </div>
                    </>
                  )}

                  {/* Stage 7: Memory Retained Timeline Event */}
                  {baseIncident.status === "Resolved" && baseIncident.memoryCaptured && (
                    <div className="flex items-center gap-space-md animate-fadeIn pt-1 border-t border-[#1F2A37]/30">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-black shadow-sm">
                        <Icon name="cloud_done" size={14} />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-1">
                        <span className="font-body-sm text-body-sm text-on-surface font-semibold text-primary">
                          Organizational memory updated
                          <span className="text-outline font-normal ml-1">
                            — Retained post-mortem into Hindsight Cloud (shopease-incidents)
                          </span>
                        </span>
                        <span className="font-label-sm text-label-sm text-primary font-mono shrink-0">
                          {baseIncident.memoryCapturedAt
                            ? new Date(baseIncident.memoryCapturedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Captured"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Standby CTA when fresh simulated incident has not been investigated yet */}
            {!agentData && !baseIncident.aiAnalysis && !investigating && (
              <div className="p-space-xl rounded-xl bg-surface-container-lowest border-2 border-dashed border-secondary/30 flex flex-col items-center justify-center text-center gap-space-md shadow-md py-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary border border-secondary/30 shadow-inner">
                  <Icon name="psychology" size={32} className="text-secondary animate-pulse" />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Awaiting RecallOps Agent Investigation
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline">
                    Incident <span className="text-primary font-mono font-semibold">{baseIncident.id}</span> ({baseIncident.service}) has been ingested. Click below to execute real Groq reasoning and query Hindsight Cloud organizational memory.
                  </p>
                </div>
                <button
                  onClick={handleInvestigate}
                  disabled={investigating}
                  className="flex items-center gap-space-sm px-space-xl py-2.5 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-headline-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  <Icon name="smart_toy" size={20} className="text-black" />
                  <span className="text-black">Investigate with RecallOps</span>
                </button>
              </div>
            )}

            {/* Investigation Result: Likely Root Cause, Runbook, Anti-Patterns, Decision Context */}
            {(agentData || baseIncident.aiAnalysis) && (
              <div className="flex flex-col gap-space-md p-space-lg rounded-xl bg-surface-container-lowest shadow-inner border border-[#1F2A37]/40">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-secondary font-mono uppercase tracking-wider">
                    Likely Root Cause
                  </span>
                  <div className="font-headline-md text-headline-md text-on-surface font-semibold">
                    {currentRootCause}
                  </div>
                </div>

                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                    Historical Evidence Foundation
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {currentEvidenceFoundation}
                  </p>
                </div>

                {/* Verified Runbook */}
                <div className="flex flex-col gap-space-xs p-space-md rounded-lg bg-surface-container-low border border-[#1F2A37]/40">
                  <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md font-semibold">
                    <Icon name="verified" size={16} className="text-secondary" />
                    <span>Previous Successful Resolution (Verified Runbook)</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">
                    {currentResolution}
                  </p>
                </div>

                {/* Anti-Pattern Alert */}
                <div className="flex flex-col gap-space-xs p-space-md rounded-lg bg-error/10 border border-error/25">
                  <div className="flex items-center gap-space-xs text-error font-label-md text-label-md font-semibold">
                    <Icon name="report" size={16} className="text-error" />
                    <span>Historical Anti-Pattern Alert</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-error-container">
                    {currentAntiPattern}
                  </p>
                </div>

                {/* Decision Context */}
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                    Decision Context & Reasoning
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {currentDecisionContext}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-space-xs border-t border-[#1F2A37]/30">
                  <Link
                    href="/memory"
                    className="flex items-center gap-space-xs text-secondary hover:text-secondary-fixed-dim font-headline-sm text-headline-sm font-semibold transition-colors"
                  >
                    <span>View Full Memory Graph</span>
                    <Icon name="arrow_forward" size={18} />
                  </Link>
                  <span className="font-label-sm text-label-sm text-outline font-mono">
                    Cluster: prod-us-east-1
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Organizational Memory Evidence */}
          {(agentData || baseIncident.aiAnalysis) && (
            <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-md border border-[#1F2A37]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="p-1.5 rounded bg-surface-container-high text-primary border border-[#1F2A37]/40">
                    <Icon name="travel_explore" size={18} />
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                    Organizational Memory Evidence ({currentHistoricalEvidence.length} Similar Incidents)
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary font-mono">
                  Hindsight Bank: shopease-incidents
                </span>
              </div>

              <div className="flex flex-col gap-space-md">
                {currentHistoricalEvidence.length === 0 ? (
                  <div className="p-space-lg text-center text-outline font-body-sm text-body-sm bg-surface-container rounded-lg">
                    No closely matching historical incidents were found in organizational memory.
                  </div>
                ) : (
                  currentHistoricalEvidence.map((memory) => {
                    const isRecentlyLearned = storedIncidents.some(
                      (inc) =>
                        inc.id === memory.incidentId &&
                        inc.memoryCaptured &&
                        inc.id !== baseIncident.id
                    );

                    return (
                      <div
                        key={memory.incidentId || memory.id}
                        className={`flex flex-col gap-space-sm p-space-md rounded-xl transition-colors shadow-sm border ${
                          isRecentlyLearned
                            ? "bg-surface-container border-secondary/50 shadow-[0_0_15px_rgba(93,230,255,0.15)]"
                            : "bg-surface-container hover:bg-surface-container-high border-[#1F2A37]/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-space-xs">
                          <div className="flex items-center gap-space-sm">
                            <span className="font-mono text-primary font-bold text-headline-sm">
                              {memory.incidentId || memory.id}
                            </span>
                            <span className="text-surface-variant">•</span>
                            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                              {memory.title}
                            </span>
                            {isRecentlyLearned && (
                              <span className="px-2 py-0.5 rounded bg-secondary text-black font-bold font-mono text-[10px] animate-pulse">
                                RECENTLY LEARNED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-semibold">
                              {memory.matchPercentage ?? memory.similarity}
                            </span>
                            <span>•</span>
                            <span>{memory.service}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm font-body-sm text-body-sm">
                          <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded border border-[#1F2A37]/30">
                            <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                              Identified Root Cause
                            </span>
                            <span className="text-on-surface font-medium">{memory.rootCause}</span>
                          </div>
                          <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded border border-[#1F2A37]/30">
                            <span className="font-label-sm text-label-sm text-secondary font-mono uppercase">
                              Verified Resolution
                            </span>
                            <span className="text-on-surface font-medium">{memory.resolution}</span>
                          </div>
                        </div>

                        {memory.failedAttempts && (
                          <div className="p-space-xs rounded bg-error/10 border border-error/20 font-body-sm text-xs text-on-error-container">
                            <span className="font-semibold text-error">Failed Attempt: </span>
                            {memory.failedAttempts}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="font-label-sm text-label-sm text-outline font-mono">
                            {memory.age ?? "Historical Archive"}
                          </span>
                          <Link
                            href={`/memory/${memory.incidentId || memory.id}`}
                            className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-secondary-fixed-dim transition-colors font-medium"
                          >
                            <span>View Incident Archive</span>
                            <Icon name="open_in_new" size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Session Status Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-space-md py-space-sm bg-surface-container-low rounded-lg text-outline font-label-sm text-label-sm font-mono border border-[#1F2A37]/50 gap-2">
        <div className="flex flex-wrap items-center gap-space-md">
          <span className="text-on-surface font-medium">RecallOps Active Agent Session</span>
          <span>•</span>
          <span>Engine: Groq (openai/gpt-oss-20b)</span>
          <span>•</span>
          <span>Memory Bank: Hindsight Cloud (shopease-incidents)</span>
        </div>
        <div className="flex items-center gap-space-sm">
          <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
          <span className="text-secondary font-semibold">
            Real Learning Loop Active (Retain + Recall)
          </span>
        </div>
      </div>
    </div>
  );
}
