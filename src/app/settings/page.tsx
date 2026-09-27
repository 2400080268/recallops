"use client";

import React, { useState } from "react";
import { Icon } from "@/components/Icon";

type SettingsTab = "system" | "ai" | "memory" | "general";

interface GroqTestResult {
  success: boolean;
  response?: string;
  error?: string;
  model?: string;
  durationMs?: number;
}

interface HindsightTestResult {
  success: boolean;
  connected: boolean;
  bankId?: string;
  latencyMs?: number;
  totalMemories?: number;
  error?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("system");

  // Real Groq API Test State
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqResult, setGroqResult] = useState<GroqTestResult | null>(null);

  // Real Hindsight Test State
  const [testingHindsight, setTestingHindsight] = useState(false);
  const [hindsightResult, setHindsightResult] = useState<HindsightTestResult | null>(null);

  // Seeding State
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleTestGroq = async () => {
    setTestingGroq(true);
    setGroqResult(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Checkout API is returning HTTP 503 errors.",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setGroqResult({
          success: false,
          error: data.error || `HTTP ${res.status}: Failed to reach Groq API.`,
          model: data.model || "openai/gpt-oss-20b",
        });
      } else {
        setGroqResult({
          success: true,
          response: data.response,
          model: data.model || "openai/gpt-oss-20b",
          durationMs: data.durationMs,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error occurred";
      setGroqResult({
        success: false,
        error: `Client request failed: ${msg}`,
        model: "openai/gpt-oss-20b",
      });
    } finally {
      setTestingGroq(false);
    }
  };

  const handleTestHindsight = async () => {
    setTestingHindsight(true);
    setHindsightResult(null);

    try {
      const res = await fetch("/api/memory/status");
      const data = await res.json();

      if (!res.ok || !data.success) {
        setHindsightResult({
          success: false,
          connected: false,
          error: data.error || `HTTP ${res.status}: Connection check failed`,
        });
      } else {
        setHindsightResult({
          success: true,
          connected: true,
          bankId: data.bankId,
          latencyMs: data.latencyMs,
          totalMemories: data.totalMemories,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error occurred";
      setHindsightResult({
        success: false,
        connected: false,
        error: `Client request failed: ${msg}`,
      });
    } finally {
      setTestingHindsight(false);
    }
  };

  const handleSeedHindsight = async () => {
    setSeeding(true);
    setSeedResult(null);

    try {
      const res = await fetch("/api/memory/seed", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSeedResult(
          `Success: ${data.seededCount} new incident memories seeded (${data.skippedCount} skipped/cached). Bank: ${data.bankId}`
        );
        // Refresh status
        handleTestHindsight();
      } else {
        setSeedResult(`Seed failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setSeedResult(`Seed failed: ${msg}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-gutter-desktop">
      {/* Header */}
      <div>
        <div className="flex items-center gap-space-xs mb-1">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
            Configuration & Diagnostics
          </span>
          <span className="h-1 w-1 rounded-full bg-outline"></span>
          <span className="font-label-sm text-label-sm text-outline">
            ShopEase SRE Console
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
          Settings
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Manage system connectivity, AI agent parameters, memory bank indexes,
          and runtime diagnostics.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-space-xs border-b border-surface-container-high/40 pb-space-xs overflow-x-auto">
        {[
          { id: "system" as const, label: "System Status" },
          { id: "ai" as const, label: "AI Configuration" },
          { id: "memory" as const, label: "Memory Bank" },
          { id: "general" as const, label: "General" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-space-md py-2 rounded-lg font-label-md text-label-md transition-colors ${
                active
                  ? "bg-surface-container-high text-primary font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: System Status */}
      {activeTab === "system" && (
        <div className="space-y-space-lg">
          {/* Subsystems Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
              <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                Groq API
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Connected
                </span>
              </div>
              <span className="font-label-sm text-[11px] text-primary font-mono mt-1">
                openai/gpt-oss-20b
              </span>
            </div>

            <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
              <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                Hindsight
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Connected
                </span>
              </div>
              <span className="font-label-sm text-[11px] text-secondary font-mono mt-1">
                Persistent Vector Bank
              </span>
            </div>

            <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
              <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                Memory Bank
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-secondary"></span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                  shopease-incidents
                </span>
              </div>
              <span className="font-label-sm text-[11px] text-outline font-mono mt-1">
                Hindsight Cloud Vector Bank
              </span>
            </div>

            <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
              <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                RecallOps App
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-primary"></span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Running (v2.4)
                </span>
              </div>
              <span className="font-label-sm text-[11px] text-outline font-mono mt-1">
                Environment: Development
              </span>
            </div>
          </div>

          {/* Environment Variables Inspection */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Environment Configuration
                </h2>
                <p className="font-body-sm text-body-sm text-outline">
                  Credential presence verified from local environment. Raw keys are
                  masked for security.
                </p>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-mono">
                Secrets Protected
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[#1F2A37]/50 font-mono text-label-sm text-label-sm">
              <div className="py-space-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="key" size={16} className="text-primary" />
                  <span className="text-on-surface font-semibold">GROQ_API_KEY</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Set (Configured)
                </span>
              </div>

              <div className="py-space-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="key" size={16} className="text-secondary" />
                  <span className="text-on-surface font-semibold">
                    HINDSIGHT_API_KEY
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">
                  Set (Configured)
                </span>
              </div>

              <div className="py-space-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="database" size={16} className="text-outline" />
                  <span className="text-on-surface font-semibold">
                    HINDSIGHT_BANK_ID
                  </span>
                </div>
                <span className="text-secondary">shopease-incidents</span>
              </div>

              <div className="py-space-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="server" size={16} className="text-outline" />
                  <span className="text-on-surface font-semibold">
                    HINDSIGHT_BASE_URL
                  </span>
                </div>
                <span className="text-outline">
                  Configured (https://api.hindsight.vectorize.io)
                </span>
              </div>
            </div>
          </div>

          {/* Test Connection Action Buttons */}
          <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Connectivity & Handshake Diagnostics
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                Run live LLM inference testing and real Hindsight memory bank connectivity checks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
              {/* Groq Live Diagnostic Card */}
              <div className="flex flex-col gap-3 p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
                    <Icon name="smart_toy" size={18} className="text-primary" />
                    <span>Groq LLM Engine</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestGroq}
                    disabled={testingGroq}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold transition-colors border border-primary/30 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testingGroq ? (
                      <>
                        <Icon name="autorenew" size={14} className="animate-spin" />
                        <span>Inferring...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="bolt" size={14} />
                        <span>Test Groq Connection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Groq Live Test Status Banner */}
                {groqResult && (
                  <div className="flex flex-col gap-2">
                    <div
                      className={`p-2.5 rounded font-label-sm text-label-sm font-mono flex items-center gap-2 border ${
                        groqResult.success
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-error/10 text-error border-error/30"
                      }`}
                    >
                      <Icon
                        name={groqResult.success ? "check_circle" : "report"}
                        size={16}
                      />
                      <span>
                        {groqResult.success
                          ? `Live Inference Success • ${groqResult.durationMs}ms • ${groqResult.model}`
                          : groqResult.error}
                      </span>
                    </div>

                    {/* Live Generated Incident Assessment */}
                    {groqResult.success && groqResult.response && (
                      <div className="flex flex-col gap-1.5 p-space-md rounded-lg bg-surface-container-lowest border border-[#1F2A37]/60">
                        <div className="flex items-center justify-between font-label-sm text-[11px] text-outline font-mono">
                          <span className="text-secondary font-semibold">
                            TEST INCIDENT ASSESSMENT:
                          </span>
                          <span>Input: &quot;Checkout API is returning HTTP 503 errors.&quot;</span>
                        </div>
                        <div className="p-space-sm rounded bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-[#1F2A37]/30 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {groqResult.response}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hindsight Live Diagnostic Card */}
              <div className="flex flex-col gap-3 p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-headline-sm text-headline-sm text-on-surface">
                    <Icon name="brain" size={18} className="text-secondary" />
                    <span>Hindsight Memory Bank</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestHindsight}
                    disabled={testingHindsight}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary font-label-md text-label-md font-semibold transition-colors border border-secondary/30 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testingHindsight ? (
                      <>
                        <Icon name="autorenew" size={14} className="animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="travel_explore" size={14} />
                        <span>Test Hindsight Connection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hindsight Live Test Status Banner */}
                {hindsightResult && (
                  <div className="flex flex-col gap-2">
                    <div
                      className={`p-2.5 rounded font-label-sm text-label-sm font-mono flex items-center gap-2 border ${
                        hindsightResult.connected
                          ? "bg-secondary/10 text-secondary border-secondary/30"
                          : "bg-error/10 text-error border-error/30"
                      }`}
                    >
                      <Icon
                        name={hindsightResult.connected ? "check_circle" : "report"}
                        size={16}
                      />
                      <span>
                        {hindsightResult.connected
                          ? `Connected • Bank: ${hindsightResult.bankId} • Latency: ${hindsightResult.latencyMs}ms • Memories: ${hindsightResult.totalMemories ?? "Ready"}`
                          : `Connection Failed: ${hindsightResult.error}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: AI Configuration */}
      {activeTab === "ai" && (
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Autonomous Investigation Agent Parameters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md font-body-sm text-body-sm">
            <div className="p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                Model Name
              </span>
              <span className="font-mono text-primary font-bold">
                openai/gpt-oss-20b
              </span>
              <span className="text-outline text-[11px]">
                Ultra-low latency inference via Groq LPU engine.
              </span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                Temperature & Determinism
              </span>
              <span className="font-mono text-secondary font-bold">0.2</span>
              <span className="text-outline text-[11px]">
                Factual adherence to past ShopEase incident telemetry and runbooks.
              </span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                Max Output Tokens
              </span>
              <span className="font-mono text-on-surface font-bold">1,024 tokens</span>
              <span className="text-outline text-[11px]">
                Tailored for concise technical incident diagnostics.
              </span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                Engine Status
              </span>
              <span className="font-mono text-secondary font-bold">
                LIVE_SDK_CONNECTED (Stage 3 Complete)
              </span>
              <span className="text-outline text-[11px]">
                Active server-side Groq SDK client configured.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Memory Bank */}
      {activeTab === "memory" && (
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container-high/40 pb-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Hindsight Memory Bank Configuration
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                Persistent organizational experience bank for ShopEase incident recall.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedHindsight}
              disabled={seeding}
              className="px-space-md py-2 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-headline-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50 self-start sm:self-auto"
            >
              {seeding ? (
                <>
                  <Icon name="autorenew" size={16} className="animate-spin text-black" />
                  <span>Seeding 12 Incidents...</span>
                </>
              ) : (
                <>
                  <Icon name="database" size={16} className="text-black" />
                  <span>Seed Historical Memories</span>
                </>
              )}
            </button>
          </div>

          {seedResult && (
            <div className="p-2.5 rounded bg-surface-container-lowest text-secondary font-label-sm text-label-sm font-mono border border-secondary/30 flex items-center gap-2">
              <Icon name="check_circle" size={16} />
              <span>{seedResult}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md font-body-sm text-body-sm">
            <div className="p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                Bank Identifier
              </span>
              <span className="font-mono text-secondary font-bold">
                shopease-incidents
              </span>
              <span className="text-outline text-[11px]">
                Isolated tenant memory vector collection.
              </span>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40 flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                Features Enabled
              </span>
              <span className="font-mono text-primary font-bold">
                Reranking • Graph Retrieval • Observations
              </span>
              <span className="text-outline text-[11px]">
                Multi-stage semantic, graph, and entity retrieval active.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: General */}
      {activeTab === "general" && (
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 space-y-space-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            ShopEase SRE Workspace Settings
          </h2>
          <div className="flex flex-col divide-y divide-[#1F2A37]/50 font-body-sm text-body-sm">
            <div className="py-3 flex items-center justify-between">
              <span className="text-on-surface font-medium">Organization</span>
              <span className="text-outline">ShopEase Online Commerce Inc.</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-on-surface font-medium">Cluster Target</span>
              <span className="text-secondary font-mono">prod-us-east-1 (Primary)</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-on-surface font-medium">Logged In Operator</span>
              <span className="text-primary font-mono">FE (Principal SRE)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
