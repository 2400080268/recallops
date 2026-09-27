"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { memoryEntries, memoryStats } from "@/lib/mock-data";
import { useIncidents } from "@/lib/incident-store";
import { MemoryEntry } from "@/types";

const categories = [
  "All",
  "Payment",
  "Database",
  "Redis",
  "Search",
  "Authentication",
  "Orders",
] as const;

const quickPrompts = [
  "Checkout API 503 errors",
  "Redis connection pool exhaustion",
  "Payment gateway timeout during flash sale",
  "JWT authentication clock skew",
  "Database replica replication lag",
];

interface RecalledMemoryItem {
  id: string;
  text: string;
  type?: string | null;
  entities: string[];
  documentId?: string | null;
  tags?: string[] | null;
  score?: number | null;
  semanticScore?: number | null;
}

interface BankStatus {
  connected: boolean;
  bankId: string;
  latencyMs: number;
  totalMemories?: number;
}

export default function OrganizationalMemoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Hindsight Bank Connectivity State
  const [bankStatus, setBankStatus] = useState<BankStatus | null>(null);
  const [checkingBank, setCheckingBank] = useState(false);

  // Hindsight Vector Recall State
  const [isHindsightMode, setIsHindsightMode] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const [recalledResults, setRecalledResults] = useState<RecalledMemoryItem[] | null>(null);
  const [activeRecallQuery, setActiveRecallQuery] = useState<string>("");
  const [recallLatency, setRecallLatency] = useState<number | null>(null);
  const [recallError, setRecallError] = useState<string | null>(null);

  // Seeding State
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Check Hindsight Bank Status on load
  const checkStatus = async () => {
    setCheckingBank(true);
    try {
      const res = await fetch("/api/memory/status");
      const data = await res.json();
      if (res.ok && data.success) {
        setBankStatus({
          connected: true,
          bankId: data.bankId,
          latencyMs: data.latencyMs,
          totalMemories: data.totalMemories,
        });
      } else {
        setBankStatus({
          connected: false,
          bankId: data.bankId || "shopease-incidents",
          latencyMs: 0,
        });
      }
    } catch {
      setBankStatus({
        connected: false,
        bankId: "shopease-incidents",
        latencyMs: 0,
      });
    } finally {
      setCheckingBank(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Handle Seeding Bank
  const handleSeedBank = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/memory/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedResult(`Seeded ${data.seededCount} memories (${data.skippedCount} existing)`);
        checkStatus();
      } else {
        setSeedResult(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setSeedResult(`Failed: ${msg}`);
    } finally {
      setSeeding(false);
    }
  };

  // Handle Live Hindsight Recall Search
  const handleRecallSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsHindsightMode(true);
    setRecalling(true);
    setRecallError(null);
    setActiveRecallQuery(q);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setRecallLatency(Date.now() - startTime);

      if (!res.ok || !data.success) {
        setRecallError(data.error || "Failed to recall from Hindsight");
        setRecalledResults(null);
      } else {
        setRecalledResults(data.results || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network connection failed";
      setRecallError(msg);
      setRecalledResults(null);
    } finally {
      setRecalling(false);
    }
  };

  const handleClearHindsight = () => {
    setIsHindsightMode(false);
    setRecalledResults(null);
    setRecallError(null);
    setActiveRecallQuery("");
  };

  const { incidents: storedIncidents } = useIncidents();

  const newlyResolvedMemories: MemoryEntry[] = useMemo(() => {
    return storedIncidents
      .filter(
        (inc) => inc.status === "Resolved" && (inc.memoryCaptured || inc.resolutionDetails)
      )
      .map((inc) => {
        let cat: "Payment" | "Database" | "Redis" | "Search" | "Authentication" | "Orders" =
          "Payment";
        const s = inc.service.toLowerCase();
        if (s.includes("pay")) cat = "Payment";
        else if (s.includes("data") || s.includes("postgre")) cat = "Database";
        else if (s.includes("redis") || s.includes("cache")) cat = "Redis";
        else if (s.includes("search")) cat = "Search";
        else if (s.includes("auth")) cat = "Authentication";
        else if (s.includes("order")) cat = "Orders";

        return {
          id: inc.id,
          title: inc.title,
          service: inc.service,
          age: inc.memoryCapturedAt
            ? `Retained on ${new Date(inc.memoryCapturedAt).toLocaleDateString()}`
            : "Just now",
          similarity: "100%",
          matchPercentage: "100%",
          rootCause: inc.aiAnalysis?.likelyRootCause || inc.error,
          resolution:
            inc.resolutionDetails?.summary ||
            inc.aiAnalysis?.previousSuccessfulResolution ||
            "Applied verified mitigation runbook.",
          failedAttempts:
            inc.aiAnalysis?.historicalAntiPatternAlert ||
            "Restarting worker nodes alone did not resolve connection saturation.",
          lesson:
            inc.resolutionDetails?.lessonsLearned ||
            "Ensure capacity thresholds are scaled prior to traffic events.",
          relatedIncidents: inc.similarIncidentIds || ["INC-1001"],
          usageCount: 1,
          mttr: inc.resolutionDetails?.resolutionTime || "12 minutes",
          resolvedBy: "RecallOps Autonomous Agent",
          symptoms: inc.runtimeFaultSignature?.stackTrace || inc.details,
          category: cat,
          isNewMemory: true,
        };
      });
  }, [storedIncidents]);

  const allEntries = useMemo(() => {
    const existingIds = new Set(newlyResolvedMemories.map((m) => m.id));
    return [
      ...newlyResolvedMemories,
      ...memoryEntries.filter((m) => !existingIds.has(m.id)),
    ];
  }, [newlyResolvedMemories]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesSearch =
        entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.resolution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.lesson.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || entry.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allEntries, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col w-full space-y-gutter-desktop">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
              Hindsight Persistent Vector Bank
            </span>
            <span className="h-1 w-1 rounded-full bg-outline"></span>
            <span className="font-label-sm text-label-sm text-outline">
              shopease-incidents
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Organizational Memory
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Search knowledge RecallOps has accumulated from previous ShopEase incidents.
          </p>
        </div>

        {/* Live Bank Status Indicator & Seed Action */}
        <div className="flex flex-wrap items-center gap-2">
          {bankStatus?.connected ? (
            <div className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-low border border-secondary/30 font-label-sm text-label-sm text-secondary font-mono shadow-sm">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span>
                Hindsight Cloud Online ({bankStatus.latencyMs}ms • {bankStatus.bankId})
              </span>
            </div>
          ) : (
            <button
              onClick={checkStatus}
              disabled={checkingBank}
              className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-low border border-[#1F2A37]/50 font-label-sm text-label-sm text-outline font-mono hover:text-on-surface"
            >
              <span className="h-2 w-2 rounded-full bg-outline"></span>
              <span>
                {checkingBank ? "Connecting to Hindsight..." : "Check Bank Status"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSeedBank}
            disabled={seeding}
            className="px-space-md py-1.5 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Seed Hindsight Cloud with 12 ShopEase incident experiences"
          >
            {seeding ? (
              <>
                <Icon name="autorenew" size={14} className="animate-spin text-black" />
                <span>Seeding...</span>
              </>
            ) : (
              <>
                <Icon name="database" size={14} className="text-black" />
                <span>Seed Bank</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Seed Feedback Toast / Banner */}
      {seedResult && (
        <div className="p-3 rounded-lg bg-surface-container-low border border-secondary/40 font-label-sm text-label-sm font-mono text-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check_circle" size={16} />
            <span>{seedResult}</span>
          </div>
          <button
            onClick={() => setSeedResult(null)}
            className="text-outline hover:text-on-surface"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Memory Statistics and Growth Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* 4 Stats Cards (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-space-md">
          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
            <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
              Total Memories
            </span>
            <div className="font-headline-xl text-headline-xl font-bold text-on-surface mt-2">
              {bankStatus?.totalMemories !== undefined
                ? bankStatus.totalMemories
                : memoryStats.totalMemories + newlyResolvedMemories.length}
            </div>
            <span className="font-label-sm text-[11px] text-secondary font-mono mt-1">
              Active in Vector Bank
            </span>
          </div>

          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
            <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
              Recurring Patterns
            </span>
            <div className="font-headline-xl text-headline-xl font-bold text-primary mt-2">
              {memoryStats.recurringPatterns}
            </div>
            <span className="font-label-sm text-[11px] text-outline font-mono mt-1">
              Identified clusters
            </span>
          </div>

          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
            <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
              Validated Fixes
            </span>
            <div className="font-headline-xl text-headline-xl font-bold text-secondary mt-2">
              {memoryStats.validatedFixes}
            </div>
            <span className="font-label-sm text-[11px] text-outline font-mono mt-1">
              Proven runbooks
            </span>
          </div>

          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
            <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
              Services Repr.
            </span>
            <div className="font-headline-xl text-headline-xl font-bold text-on-surface mt-2">
              {memoryStats.servicesRepresented}
            </div>
            <span className="font-label-sm text-[11px] text-outline font-mono mt-1">
              ShopEase microservices
            </span>
          </div>
        </div>

        {/* Growth Mini Chart (4 cols) */}
        <div className="lg:col-span-4 rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between border border-[#1F2A37]/50 shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface">
              Knowledge Accumulation
            </span>
            <span className="font-label-sm text-[10px] text-secondary font-mono">
              6-Week Trajectory
            </span>
          </div>
          <div className="flex items-end justify-between h-14 gap-2 pt-2 px-1">
            {memoryStats.weeklyGrowth.map((week, idx) => (
              <div
                key={week.label}
                className="flex-1 flex flex-col items-center gap-1 h-full justify-end group"
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    idx === memoryStats.weeklyGrowth.length - 1
                      ? "bg-secondary shadow-[0_0_10px_rgba(93,230,255,0.4)]"
                      : "bg-surface-container-highest group-hover:bg-primary"
                  }`}
                  style={{ height: `${(week.count / 47) * 100}%` }}
                ></div>
                <span className="font-label-sm text-[9px] text-outline font-mono">
                  {week.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Vector Query Section */}
      <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md space-y-space-md border border-[#1F2A37]/50">
        {/* Search Bar with Hindsight Action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
              <Icon name="search" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search incidents, root causes, runbooks, or query Hindsight vector memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleRecallSearch(searchQuery);
                }
              }}
              className="w-full pl-12 pr-space-md py-3 bg-surface-container-lowest border border-[#1F2A37] rounded-xl text-on-surface font-body-lg text-body-lg focus:border-secondary focus:outline-none shadow-inner"
            />
          </div>

          <button
            type="button"
            onClick={() => handleRecallSearch(searchQuery)}
            disabled={recalling || !searchQuery.trim()}
            className="px-space-lg py-3 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 shrink-0"
          >
            {recalling ? (
              <>
                <Icon name="autorenew" size={18} className="animate-spin text-black" />
                <span>Recalling...</span>
              </>
            ) : (
              <>
                <Icon name="travel_explore" size={18} className="text-black" />
                <span>Recall via Hindsight</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Hindsight Vector Prompts */}
        <div className="flex flex-wrap items-center gap-space-xs pt-1">
          <span className="font-label-sm text-label-sm text-secondary font-mono mr-1 flex items-center gap-1">
            <Icon name="insights" size={14} />
            <span>Semantic Probes:</span>
          </span>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setSearchQuery(prompt);
                handleRecallSearch(prompt);
              }}
              className="px-space-sm py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-secondary border border-[#1F2A37]/40 font-mono text-[11px] transition-colors"
            >
              &quot;{prompt}&quot;
            </button>
          ))}
        </div>

        {/* Category Chips (Filter local index) */}
        <div className="flex flex-wrap items-center gap-space-xs pt-1 border-t border-[#1F2A37]/30">
          <span className="font-label-sm text-label-sm text-outline font-mono mr-2">
            Categories:
          </span>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (isHindsightMode) {
                    setIsHindsightMode(false);
                  }
                }}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  active
                    ? "bg-surface-container-high text-secondary border border-secondary/40 font-semibold shadow-inner"
                    : "bg-surface-container text-outline hover:text-on-surface border border-[#1F2A37]/30"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE HINDSIGHT RECALL RESULTS SECTION */}
      {isHindsightMode && (
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-lg border border-secondary/40 space-y-space-md">
          {/* Hindsight Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-[#1F2A37]/50 pb-space-sm">
            <div className="flex items-center gap-2">
              <Icon name="brain" size={20} className="text-secondary" />
              <div>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Live Hindsight Vector Recall Results
                </span>
                <div className="font-mono text-xs text-outline flex items-center gap-2 mt-0.5">
                  <span>Query: &quot;{activeRecallQuery}&quot;</span>
                  {recallLatency !== null && (
                    <>
                      <span>•</span>
                      <span className="text-secondary">{recallLatency}ms</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Bank: shopease-incidents</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearHindsight}
              className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-label-sm text-label-sm border border-[#1F2A37]/50 transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              <Icon name="close" size={14} />
              <span>Reset to All Incidents</span>
            </button>
          </div>

          {/* Recalling State */}
          {recalling && (
            <div className="p-space-xl flex flex-col items-center justify-center text-center gap-3">
              <Icon name="autorenew" size={28} className="animate-spin text-secondary" />
              <p className="font-body-md text-body-md text-on-surface font-mono">
                Querying Hindsight Cloud Vector Bank (shopease-incidents)...
              </p>
              <span className="font-label-sm text-xs text-outline">
                Performing multi-index semantic reranking & graph entity traversal
              </span>
            </div>
          )}

          {/* Recall Error */}
          {recallError && !recalling && (
            <div className="p-space-md rounded-lg bg-error/10 border border-error/30 text-error flex items-center gap-2 font-mono text-sm">
              <Icon name="report" size={18} />
              <span>{recallError}</span>
            </div>
          )}

          {/* Recalled Items */}
          {!recalling && recalledResults && recalledResults.length === 0 && (
            <div className="p-space-lg text-center text-outline font-body-md text-body-md">
              No matching incident memories recalled from Hindsight Cloud for &quot;{activeRecallQuery}&quot;.
            </div>
          )}

          {!recalling && recalledResults && recalledResults.length > 0 && (
            <div className="flex flex-col gap-space-md">
              {recalledResults.map((result, idx) => {
                const matchPct = result.score
                  ? Math.round(result.score * 100)
                  : result.semanticScore
                  ? Math.round(result.semanticScore * 100)
                  : 94 - idx * 4;

                return (
                  <div
                    key={result.id || idx}
                    className="p-space-md rounded-lg bg-surface-container-lowest border border-secondary/20 hover:border-secondary/40 transition-colors flex flex-col gap-space-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2A37]/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary font-bold text-sm">
                          {result.documentId || `MEM-${result.id.slice(0, 8)}`}
                        </span>
                        <span className="text-surface-variant">•</span>
                        <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30 font-mono text-xs font-semibold">
                          {matchPct}% Match
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-mono text-xs">
                          {result.type || "semantic_recall"}
                        </span>
                      </div>

                      {/* Graph Entities */}
                      {result.entities && result.entities.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 font-mono text-xs text-outline">
                          <span className="text-[10px] uppercase text-outline">Entities:</span>
                          {result.entities.slice(0, 3).map((e) => (
                            <span
                              key={e}
                              className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px]"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recalled Memory Content */}
                    <div className="font-body-sm text-body-sm text-on-surface whitespace-pre-wrap leading-relaxed font-mono text-[12px] bg-surface-container-low/60 p-3 rounded border border-[#1F2A37]/30 max-h-56 overflow-y-auto">
                      {result.text}
                    </div>

                    {/* Tags */}
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-outline">
                        <span>Tags:</span>
                        {result.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-surface-container text-outline"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Memory Catalog Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          {isHindsightMode
            ? "Complete Incident Experience Catalog"
            : `ShopEase Incident Archives (${filteredEntries.length})`}
        </h2>
        <span className="font-label-sm text-label-sm text-outline font-mono">
          Persistent Knowledge Repository
        </span>
      </div>

      {/* Memory Entries List */}
      <div className="flex flex-col gap-space-md">
        {filteredEntries.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-space-xl text-center text-outline font-body-md text-body-md border border-[#1F2A37]/50">
            No memories found matching your search.
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50 hover:border-secondary/40 transition-all flex flex-col gap-space-md"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-space-xs border-b border-[#1F2A37]/40 pb-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="font-mono text-primary font-bold text-headline-sm">
                    {entry.id}
                  </span>
                  <span className="text-surface-variant">•</span>
                  <Link
                    href={`/memory/${entry.id}`}
                    className="font-headline-md text-headline-md text-on-surface font-semibold hover:text-primary transition-colors"
                  >
                    {entry.title}
                  </Link>
                  {entry.isNewMemory && (
                    <span className="px-2 py-0.5 rounded bg-secondary text-black font-bold font-mono text-[10px] shadow-sm animate-pulse">
                      NEW MEMORY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-outline font-mono">
                  <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-secondary font-mono">
                    {entry.service}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">
                    {entry.matchPercentage ?? entry.similarity}
                  </span>
                  <span>{entry.age}</span>
                </div>
              </div>

              {/* Grid: Root Cause & Successful Fix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1 p-space-md rounded-lg bg-surface-container-lowest border border-[#1F2A37]/40">
                  <span className="font-label-sm text-label-sm text-outline font-mono uppercase">
                    Root Cause
                  </span>
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    {entry.rootCause}
                  </p>
                </div>

                <div className="flex flex-col gap-1 p-space-md rounded-lg bg-surface-container-lowest border border-[#1F2A37]/40">
                  <span className="font-label-sm text-label-sm text-secondary font-mono uppercase">
                    Successful Fix (Verified Runbook)
                  </span>
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    {entry.resolution}
                  </p>
                </div>
              </div>

              {/* Failed Attempts Alert */}
              <div className="flex flex-col gap-1 p-space-md rounded-lg bg-error/10 border border-error/20">
                <div className="flex items-center gap-1.5 text-error font-label-md text-label-md font-semibold">
                  <Icon name="report" size={16} className="text-error" />
                  <span>Failed Attempts (Anti-Patterns Observed)</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-error-container">
                  {entry.failedAttempts}
                </p>
              </div>

              {/* Lessons Learned */}
              <div className="flex items-start gap-space-sm p-space-md rounded-lg bg-surface-container border border-[#1F2A37]/40">
                <Icon name="insights" size={18} className="text-secondary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-label-sm text-secondary font-mono uppercase font-semibold">
                    Lesson Learned
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {entry.lesson}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs pt-space-xs border-t border-[#1F2A37]/30 font-label-sm text-label-sm text-outline font-mono">
                <div className="flex items-center gap-space-sm">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-medium">
                    Used by RecallOps in {entry.usageCount} investigations
                  </span>
                  <span>•</span>
                  <span>MTTR: {entry.mttr}</span>
                  <span>•</span>
                  <span>Resolver: {entry.resolvedBy}</span>
                </div>

                <Link
                  href={`/memory/${entry.id}`}
                  className="flex items-center gap-1 text-secondary hover:text-secondary-fixed-dim transition-colors font-medium"
                >
                  <span>Deep Knowledge Breakdown</span>
                  <Icon name="arrow_forward" size={16} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
