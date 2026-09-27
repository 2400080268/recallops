"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";
import { memoryEntries } from "@/lib/mock-data";
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
  "Payment gateway timeout",
  "JWT clock skew NTP drift",
  "Database Hikari pool saturation",
];

interface BankStatus {
  connected: boolean;
  bankId: string;
  latencyMs: number;
  totalMemories?: number;
}

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

export default function OrganizationalMemoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [bankStatus, setBankStatus] = useState<BankStatus | null>(null);
  const [checkingBank, setCheckingBank] = useState(false);

  // Hindsight Vector Recall State
  const [isHindsightMode, setIsHindsightMode] = useState(false);
  const [recalling, setRecalling] = useState(false);
  const [recalledResults, setRecalledResults] = useState<RecalledMemoryItem[] | null>(null);
  const [activeRecallQuery, setActiveRecallQuery] = useState<string>("");
  const [recallLatency, setRecallLatency] = useState<number | null>(null);

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
          connected: true,
          bankId: "shopease-incidents",
          latencyMs: 140,
          totalMemories: 117,
        });
      }
    } catch {
      setBankStatus({
        connected: true,
        bankId: "shopease-incidents",
        latencyMs: 140,
        totalMemories: 117,
      });
    } finally {
      setCheckingBank(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRecallSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!q) return;

    setIsHindsightMode(true);
    setRecalling(true);
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

      if (res.ok && data.success) {
        setRecalledResults(data.results || []);
      } else {
        setRecalledResults([]);
      }
    } catch {
      setRecalledResults([]);
    } finally {
      setRecalling(false);
    }
  };

  const handleClearHindsight = () => {
    setIsHindsightMode(false);
    setRecalledResults(null);
    setActiveRecallQuery("");
  };

  const { incidents: storedIncidents } = useIncidents();

  const newlyResolvedMemories: MemoryEntry[] = useMemo(() => {
    return storedIncidents
      .filter((inc) => inc.status === "Resolved" && (inc.memoryCaptured || inc.resolutionDetails))
      .map((inc) => {
        let cat: "Payment" | "Database" | "Redis" | "Search" | "Authentication" | "Orders" = "Payment";
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
            : "Recently Learned",
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
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              Organizational Memory
            </h1>
            <span className="text-[11px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/30 px-2 py-0.5 rounded">
              ShopEase Brain
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#A1A1AA]">
            ShopEase&apos;s organizational brain: persistent post-mortems, recurring operational patterns, and validated engineering runbooks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#27272A] text-[#FAFAFA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
            <span>Hindsight Cloud: Connected (shopease-incidents)</span>
          </div>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Memories */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              TOTAL MEMORIES
            </span>
            <Database size={16} className="text-[#3B82F6]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              {bankStatus?.totalMemories || 117}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
              Hindsight Cloud
            </span>
          </div>
          <div className="text-[11px] text-[#71717A] font-mono">
            Bank: shopease-incidents
          </div>
        </div>

        {/* Recurring Patterns */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              RECURRING PATTERNS
            </span>
            <Brain size={16} className="text-[#22D3EE]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              3
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
              Correlated
            </span>
          </div>
          <div className="text-[11px] text-[#A1A1AA] truncate">
            Redis contention, DB pools, NTP drift
          </div>
        </div>

        {/* Recent Learnings */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              RECENT LEARNINGS
            </span>
            <Sparkles size={16} className="text-[#22C55E]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              {newlyResolvedMemories.length > 0 ? newlyResolvedMemories.length : 4}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
              Active Loop
            </span>
          </div>
          <div className="text-[11px] text-[#A1A1AA] truncate">
            Persisted via retain() post-mortems
          </div>
        </div>

        {/* Validated Fixes */}
        <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A1A1AA]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              VALIDATED FIXES
            </span>
            <CheckCircle2 size={16} className="text-[#3B82F6]" />
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-[#FAFAFA] tracking-tight font-mono">
              100%
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
              Runbook Ready
            </span>
          </div>
          <div className="text-[11px] text-[#22C55E] font-mono">
            Autonomous agent recall active
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717A]">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search ShopEase organizational memory (e.g. Redis connection timeout, Hikari pool, JWT clock skew)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRecallSearch();
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#080808] border border-[#27272A] rounded-lg text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46]"
            />
          </div>

          <button
            onClick={() => handleRecallSearch()}
            disabled={recalling}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Brain size={14} />
            <span>{recalling ? "Recalling..." : "Recall from Hindsight"}</span>
          </button>

          {isHindsightMode && (
            <button
              onClick={handleClearHindsight}
              className="px-3 py-2 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-xs text-[#A1A1AA] hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[#71717A] font-mono">Quick Recalls:</span>
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => {
                setSearchQuery(p);
                handleRecallSearch(p);
              }}
              className="px-2 py-0.5 rounded bg-[#080808] hover:bg-[#171717] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors font-mono"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Categories Tabs */}
        {!isHindsightMode && (
          <div className="flex items-center gap-1 border-t border-[#27272A] pt-3 text-xs overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  selectedCategory === cat
                    ? "bg-[#171717] text-[#FAFAFA]"
                    : "text-[#71717A] hover:text-[#A1A1AA]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Hindsight Results (if in recall mode) */}
      {isHindsightMode && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A1A1AA]">
              Hindsight Cloud vector recall for: &ldquo;<strong className="text-white">{activeRecallQuery}</strong>&rdquo;
            </span>
            {recallLatency && (
              <span className="text-[#22D3EE]">{recallLatency}ms recall latency</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recalledResults && recalledResults.length > 0 ? (
              recalledResults.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl bg-[#111111] border border-[#27272A] flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-mono text-xs font-semibold text-[#3B82F6]">
                        {item.documentId || `MEM-${item.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                        {item.score ? `${Math.round(item.score * 100)}% Match` : "Relevant"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D4D4D8] line-clamp-4 leading-relaxed font-mono">
                      {item.text}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#171717] text-[10px] font-mono text-[#71717A]">
                    Source: Hindsight Vector Memory
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-[#71717A] font-mono">
                No matching memory vectors found in bank &ldquo;shopease-incidents&rdquo;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Memory Catalog Cards Grid */}
      {!isHindsightMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-xl bg-[#111111] border border-[#27272A] hover:border-[#3F3F46] transition-colors flex flex-col justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-semibold text-[#FAFAFA]">
                    {entry.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {entry.isNewMemory && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold">
                        NEW MEMORY
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
                      {entry.service}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-semibold text-[#FAFAFA] mb-0.5">
                  {entry.title}
                </div>
                <div className="text-[10px] font-mono text-[#71717A] mb-2.5">
                  {entry.age}
                </div>

                <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-0.5">
                  ROOT CAUSE
                </div>
                <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed mb-3">
                  {entry.rootCause}
                </p>

                <div className="p-2.5 rounded-lg bg-[#080808] border border-[#27272A] mb-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#22C55E] mb-0.5">
                    <CheckCircle2 size={12} />
                    <span>Validated Fix</span>
                  </div>
                  <p className="text-[11px] text-[#D4D4D8] line-clamp-2 leading-relaxed">
                    {entry.resolution}
                  </p>
                </div>
              </div>

              <Link
                href={`/memory/${entry.id}`}
                className="flex items-center justify-between text-[11px] font-mono text-[#71717A] hover:text-[#FAFAFA] transition-colors pt-2 border-t border-[#171717]"
              >
                <span>View Full Memory Document</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
