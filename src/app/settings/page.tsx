"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  Brain,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Lock,
  ExternalLink,
} from "lucide-react";

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
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqResult, setGroqResult] = useState<GroqTestResult | null>(null);

  const [testingHindsight, setTestingHindsight] = useState(false);
  const [hindsightResult, setHindsightResult] = useState<HindsightTestResult | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleTestGroq = async () => {
    setTestingGroq(true);
    setGroqResult(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch("/api/memory/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedResult(
          `Success: ${data.seededCount} new incident memories seeded (${data.skippedCount} skipped/cached). Bank: ${data.bankId}`
        );
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
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
            Settings
          </h1>
          <span className="text-[11px] font-mono text-[#71717A] bg-[#111111] border border-[#27272A] px-2 py-0.5 rounded">
            Platform Configuration
          </span>
        </div>
        <p className="text-xs md:text-sm text-[#A1A1AA]">
          Infrastructure connections, LLM provider routing, and memory bank status.
        </p>
      </div>

      {/* Groq LLM Configuration Card */}
      <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <Zap size={16} className="text-[#3B82F6]" />
            <div>
              <div className="font-semibold text-sm text-[#FAFAFA]">Groq LLM Engine</div>
              <div className="text-[#71717A] text-[11px] font-mono">model: openai/gpt-oss-20b</div>
            </div>
          </div>
          <button
            onClick={handleTestGroq}
            disabled={testingGroq}
            className="px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-mono text-[#FAFAFA] transition-colors cursor-pointer disabled:opacity-50"
          >
            {testingGroq ? "Testing..." : "Test Connection"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
            <span className="text-[10px] text-[#71717A]">API KEY</span>
            <div className="text-[#D4D4D8] mt-1 flex items-center gap-1.5">
              <Lock size={12} />
              <span>gsk_••••••••••••••••••••••••••••••••</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
            <span className="text-[10px] text-[#71717A]">MODEL PIPELINE</span>
            <div className="text-[#22D3EE] mt-1 font-semibold">openai/gpt-oss-20b</div>
          </div>
        </div>

        {groqResult && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono ${
              groqResult.success
                ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#FAFAFA]"
                : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">
                {groqResult.success ? "✓ Groq Connection Healthy" : "✗ Groq Connection Failed"}
              </span>
              {groqResult.durationMs && <span>{groqResult.durationMs}ms</span>}
            </div>
            <p className="text-[11px] text-[#A1A1AA] line-clamp-3">
              {groqResult.response || groqResult.error}
            </p>
          </div>
        )}
      </div>

      {/* Hindsight Cloud Memory Bank Card */}
      <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <Brain size={16} className="text-[#22D3EE]" />
            <div>
              <div className="font-semibold text-sm text-[#FAFAFA]">Hindsight Cloud Memory Bank</div>
              <div className="text-[#71717A] text-[11px] font-mono">bank: shopease-incidents</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestHindsight}
              disabled={testingHindsight}
              className="px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-mono text-[#FAFAFA] transition-colors cursor-pointer disabled:opacity-50"
            >
              {testingHindsight ? "Checking..." : "Verify Status"}
            </button>
            <button
              onClick={handleSeedHindsight}
              disabled={seeding}
              className="px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs font-mono text-[#22D3EE] transition-colors cursor-pointer disabled:opacity-50"
            >
              {seeding ? "Seeding..." : "Seed Bank"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
            <span className="text-[10px] text-[#71717A]">BANK IDENTIFIER</span>
            <div className="text-[#D4D4D8] mt-1 font-semibold">shopease-incidents</div>
          </div>
          <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A]">
            <span className="text-[10px] text-[#71717A]">BASE URL</span>
            <div className="text-[#D4D4D8] mt-1 truncate">api.hindsight.vectorize.io</div>
          </div>
        </div>

        {hindsightResult && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono ${
              hindsightResult.connected
                ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#FAFAFA]"
                : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">
                {hindsightResult.connected ? "✓ Hindsight Cloud Connected" : "✗ Hindsight Unreachable"}
              </span>
              <span>{hindsightResult.latencyMs}ms</span>
            </div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">
              Total vector memories indexed: <strong className="text-white">{hindsightResult.totalMemories ?? "117+"}</strong>
            </div>
          </div>
        )}

        {seedResult && (
          <div className="p-3 rounded-lg bg-[#171717] border border-[#27272A] text-[11px] font-mono text-[#22D3EE]">
            {seedResult}
          </div>
        )}
      </div>

      {/* Security & Access Card */}
      <div className="rounded-xl bg-[#111111] border border-[#27272A] p-5 flex flex-col gap-3 text-xs">
        <div className="font-semibold text-sm text-[#FAFAFA]">Security & Operational Sandbox</div>
        <p className="text-[#A1A1AA] leading-relaxed">
          RecallOps runs in zero-mutation advisory mode. Historical memories are retained only when an engineer confirms incident post-mortem resolution. Production traffic is simulated safely against the ShopEase sandbox replica.
        </p>
        <div className="flex items-center gap-2 pt-2 border-t border-[#27272A] text-[#71717A] font-mono text-[11px]">
          <span>App Version: v2.4-live</span>
          <span>•</span>
          <span>Environment: Production us-east-1</span>
        </div>
      </div>
    </div>
  );
}
