"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  FileCode,
  Copy,
  ExternalLink,
  Brain,
} from "lucide-react";
import { simulationScenarios } from "@/lib/mock-data";
import { SimulationScenario, Severity } from "@/types";
import { createSimulatedIncident } from "@/lib/incident-store";

export default function SimulatorPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(
    simulationScenarios[0]
  );
  const [targetService, setTargetService] = useState(
    simulationScenarios[0].targetService
  );
  const [severity, setSeverity] = useState("High (P1)");
  const [simDuration, setSimDuration] = useState("15 min (Auto-revert)");
  const [simulating, setSimulating] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const handleSelectScenario = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setTargetService(scenario.targetService);
    setSeverity(
      scenario.severity === "Critical"
        ? "Critical (P0)"
        : scenario.severity === "High"
        ? "High (P1)"
        : "Medium (P2)"
    );
  };

  const handleStartSimulation = () => {
    setSimulating(true);

    let parsedSeverity: Severity = "High";
    if (severity.includes("P0") || severity.includes("Critical")) {
      parsedSeverity = "Critical";
    } else if (severity.includes("P2") || severity.includes("Medium")) {
      parsedSeverity = "Medium";
    } else if (severity.includes("P3") || severity.includes("Low")) {
      parsedSeverity = "Low";
    }

    let runtimeFaultSignature = {
      code: selectedScenario.errorSignature,
      stackTrace: `Exception in ${targetService}: ${selectedScenario.errorSignature}\n  at com.shopease.${targetService.toLowerCase().replace(/[^a-z0-9]/g, "")}.Main(Service.kt:84)`,
    };

    if (selectedScenario.id === "checkout-503") {
      runtimeFaultSignature = {
        code: "HTTP 503 SERVICE UNAVAILABLE",
        stackTrace: `com.shopease.checkout.exception.RedisLockTimeoutException: Failed to acquire lock for cart:user_89412 after 1500ms
at com.shopease.checkout.redis.RedisDistributedLock.acquire(RedisDistributedLock.kt:88)
at com.shopease.checkout.service.CheckoutService.processCheckout(CheckoutService.kt:142)
at com.shopease.checkout.api.CheckoutController.checkout(CheckoutController.kt:54)`,
      };
    } else if (selectedScenario.id === "payment-timeout") {
      runtimeFaultSignature = {
        code: "HTTP 504 GATEWAY TIMEOUT",
        stackTrace: `org.postgresql.util.PSQLException: The connection attempt failed.
Caused by: java.net.SocketTimeoutException: connect timed out [port:5432]
at com.shopease.payment.db.HikariPoolManager.getConnection(HikariPoolManager.kt:142)`,
      };
    } else if (selectedScenario.id === "db-failure") {
      runtimeFaultSignature = {
        code: "FATAL: 53300: sorry, too many clients already",
        stackTrace: `org.postgresql.util.PSQLException: FATAL: 53300: remaining connection slots are reserved for non-replication superuser connections
at org.postgresql.core.v3.ConnectionFactoryImpl.doAuthentication(ConnectionFactoryImpl.java:682)
at org.postgresql.core.v3.ConnectionFactoryImpl.tryConnect(ConnectionFactoryImpl.java:184)`,
      };
    } else if (selectedScenario.id === "redis-exhaustion") {
      runtimeFaultSignature = {
        code: "OOM command not allowed when used memory > 'maxmemory'",
        stackTrace: `redis.clients.jedis.exceptions.JedisDataException: OOM command not allowed when used memory > 'maxmemory'
at redis.clients.jedis.Protocol.processError(Protocol.java:132)
at redis.clients.jedis.Jedis.setex(Jedis.java:422)
at com.shopease.cache.RedisClient.put(RedisClient.kt:98)`,
      };
    } else if (selectedScenario.id === "order-500") {
      runtimeFaultSignature = {
        code: "HTTP 500 INTERNAL ORDER STATE FAILURE",
        stackTrace: `com.shopease.order.exception.OrderWorkflowDeadlockException: Lock wait timeout exceeded; try restarting transaction
at com.shopease.order.statemachine.OrderStateMachine.transition(OrderStateMachine.kt:114)
at com.shopease.order.service.OrderExecutionEngine.reserveInventory(OrderExecutionEngine.kt:62)`,
      };
    } else if (selectedScenario.id === "auth-failure") {
      runtimeFaultSignature = {
        code: "HTTP 401 SIGNATURE_VERIFICATION_FAILED",
        stackTrace: `com.auth0.jwt.exceptions.SignatureVerificationException: The Token's Signature resulted invalid when verified with public key
at com.shopease.auth.filter.JwtVerificationFilter.doFilter(JwtVerificationFilter.kt:76)
at com.shopease.auth.gateway.SecurityContextManager.authenticate(SecurityContextManager.kt:42)`,
      };
    } else if (selectedScenario.id === "search-latency") {
      runtimeFaultSignature = {
        code: "SEARCH_QUERY_TIMEOUT_EXCEEDED",
        stackTrace: `org.elasticsearch.action.search.SearchPhaseExecutionException: all shards failed for wildcard query
at org.elasticsearch.search.SearchService.execute(SearchService.java:312)
at com.shopease.search.client.ElasticsearchGateway.query(ElasticsearchGateway.kt:89)`,
      };
    } else if (selectedScenario.id === "custom") {
      runtimeFaultSignature = {
        code: "CUSTOM_CHAOS_INJECTION_FAULT",
        stackTrace: `com.shopease.chaos.SimulatedChaosFault: Container fault injected via ShopEase Chaos Engine
at com.shopease.chaos.ChaosInterceptor.inject(ChaosInterceptor.kt:33)`,
      };
    }

    const newIncident = createSimulatedIncident({
      title: selectedScenario.title,
      service: targetService,
      severity: parsedSeverity,
      error: selectedScenario.errorSignature,
      details: selectedScenario.description,
      runtimeFaultSignature,
      recentDeployment: {
        profile: `${targetService.toLowerCase().replace(/[^a-z0-9]/g, "-")}-v2`,
        cluster: "us-east-1",
        timeAgo: "12m ago",
        author: "release-bot (ArgoCD Pipeline #9482)",
        commit: "Commit 8f4e901",
      },
    });

    setCreatedIncidentId(newIncident.id);

    setTimeout(() => {
      setSimulating(false);
      router.push(`/incidents/${newIncident.id}`);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Toast Notification */}
      {createdIncidentId && (
        <div className="fixed top-18 right-8 z-50 flex items-center gap-3 p-4 rounded-xl bg-[#111111] border border-[#3B82F6] text-[#FAFAFA] shadow-xl">
          <CheckCircle2 size={18} className="text-[#3B82F6]" />
          <div>
            <div className="text-xs font-semibold text-[#FAFAFA]">
              Incident Triggered ({createdIncidentId})
            </div>
            <div className="text-[11px] font-mono text-[#A1A1AA]">
              Routing to RecallOps Agent Investigation Console...
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              Incident Simulator
            </h1>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span>SANDBOX REPLICA : ACTIVE (V2.14-SIM)</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#A1A1AA]">
            Safely test RecallOps detection, automated investigation, and organizational memory recall in staging.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] border border-[#27272A] hover:bg-[#171717] text-xs font-mono text-[#D4D4D8] transition-colors">
            <SlidersHorizontal size={13} className="text-[#A1A1AA]" />
            <span>Engine Preset: Deterministic Triage Replay</span>
          </button>
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#111111] border border-[#27272A] text-xs">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#171717] border border-[#27272A] text-[#FAFAFA] font-medium">
          <span className="w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-[11px] font-bold">
            1
          </span>
          <span>Select Incident Scenario</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 text-[#71717A]">
          <span className="w-5 h-5 rounded-full bg-[#171717] border border-[#27272A] text-[#71717A] flex items-center justify-center text-[11px] font-mono">
            2
          </span>
          <span>Target & Scope</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 text-[#71717A]">
          <span className="w-5 h-5 rounded-full bg-[#171717] border border-[#27272A] text-[#71717A] flex items-center justify-center text-[11px] font-mono">
            3
          </span>
          <span>Trigger & Observe</span>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Scenario Library) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#FAFAFA]">
                Scenario Library
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#27272A] text-[#A1A1AA]">
                8 TEMPLATES
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#71717A] font-mono">
              <span>Sort:</span>
              <span className="text-[#D4D4D8]">Severity</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {simulationScenarios.map((scenario) => {
              const isSelected = selectedScenario.id === scenario.id;
              const isP1 = scenario.severity === "Critical" || scenario.severity === "High";

              return (
                <div
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-3 text-left ${
                    isSelected
                      ? "bg-[#1C1C1C] border-2 border-[#3B82F6] shadow-md"
                      : "bg-[#111111] border border-[#27272A] hover:bg-[#171717] hover:border-[#3F3F46]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-[#FAFAFA]">
                        {scenario.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          scenario.severity === "Critical"
                            ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                            : isP1
                            ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                            : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                        }`}
                      >
                        {scenario.severity === "Critical" ? "Critical" : isP1 ? "High Sev / P1" : "Med Sev"}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-[#71717A] truncate mb-2">
                      {scenario.targetService.toLowerCase()}.shopease.internal
                    </div>

                    <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-[#22C55E]">
                      <CheckCircle2 size={12} />
                      <span>Prior Postmortem Linked</span>
                    </div>
                    <span className="text-[#22D3EE]">
                      Vector: {scenario.id === "checkout-503" ? "96%" : scenario.id === "payment-timeout" ? "94%" : scenario.id === "db-failure" ? "89%" : "82%"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (Target & Scope + Trigger) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Target & Scope */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#FAFAFA]">Target & Scope</span>
              <span className="font-mono text-[10px] text-[#71717A]">
                STAGING-US-EAST
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                  TARGET MICROSERVICE
                </label>
                <input
                  type="text"
                  value={`${targetService} (Active Replica)`}
                  onChange={(e) => setTargetService(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#080808] border border-[#27272A] text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                    SEVERITY LEVEL
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#080808] border border-[#27272A] text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
                  >
                    <option value="Critical (P0)">Critical (P0)</option>
                    <option value="High (P1)">High (P1)</option>
                    <option value="Medium (P2)">Medium (P2)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                    SIM DURATION
                  </label>
                  <select
                    value={simDuration}
                    onChange={(e) => setSimDuration(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#080808] border border-[#27272A] text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
                  >
                    <option value="15 min (Auto-revert)">15 min (Auto-revert)</option>
                    <option value="30 min">30 min</option>
                    <option value="Indefinite (Manual stop)">Indefinite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                  TARGET ENVIRONMENT
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#080808] border border-[#27272A] text-xs">
                  <span className="text-[#D4D4D8]">ShopEase Staging Replica (Isolated VPC)</span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-[#22C55E]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                    <span>ACTIVE</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1 block">
                  SIMULATION INJECTION NOTE
                </label>
                <div className="p-2.5 rounded-lg bg-[#080808] border border-[#27272A] text-[11px] font-mono text-[#A1A1AA] leading-relaxed">
                  {selectedScenario.description}
                </div>
              </div>
            </div>
          </div>

          {/* Trigger & Observe */}
          <div className="rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#FAFAFA]">Trigger & Observe</span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-[#22C55E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                <span>STANDBY</span>
              </span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#080808] border border-[#27272A] text-[11px] text-[#A1A1AA]">
              <Shield size={15} className="text-[#22D3EE] shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Safe Sandbox Active:</strong> Simulated traffic will trigger RecallOps AI agent without impacting real customers or production databases.
              </span>
            </div>

            <button
              onClick={handleStartSimulation}
              disabled={simulating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#3B82F6] hover:bg-blue-600 active:bg-blue-700 text-white font-medium text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Zap size={16} className="fill-current text-white" />
              <span>{simulating ? "Injecting Fault Telemetry..." : "Trigger Incident"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSelectScenario(simulationScenarios[0])}
                className="py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => alert("Simulation spec copied to clipboard.")}
                className="py-1.5 rounded-lg bg-[#171717] hover:bg-[#1C1C1C] border border-[#27272A] text-[#A1A1AA] hover:text-white transition-colors"
              >
                Export Spec
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-[#71717A] pt-2 border-t border-[#27272A]">
              <span className="flex items-center gap-1 text-[#22C55E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                <span>Ready for dispatch</span>
              </span>
              <span>Target TTL: 15m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row (Prior Memory Match & Terminal Event Stream) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Prior Memory Match */}
        <div className="lg:col-span-5 rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#FAFAFA] flex items-center gap-1.5">
                <Brain size={14} className="text-[#22D3EE]" />
                <span>Prior Memory Match</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                96% Vector Similarity
              </span>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
              HISTORICAL INCIDENT
            </div>
            <div className="text-xs text-[#FAFAFA] font-medium mb-3">
              INC-2023-8841 (Black Friday Redis Pod Starvation)
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
              PROVEN PLAYBOOK RECOMMENDED
            </div>
            <div className="text-xs font-mono text-[#3B82F6] flex items-center gap-1">
              <FileCode size={13} />
              <span>PLAYBOOK-REDIS-BUMP</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#27272A] flex items-center justify-between text-xs font-mono">
            <span className="text-[#71717A]">Predicted MTTR:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#22C55E] font-medium">8.5 min</span>
              <span className="text-[10px] text-[#71717A]">(vs 48m baseline)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                82% saved
              </span>
            </div>
          </div>
        </div>

        {/* Simulator Event Stream */}
        <div className="lg:col-span-7 rounded-xl bg-[#111111] border border-[#27272A] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-[#D4D4D8]">
              <Terminal size={14} className="text-[#A1A1AA]" />
              <span>SIMULATOR EVENT STREAM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-[10px] text-[#22C55E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"></span>
                <span>agent-staging-04</span>
              </span>
              <button
                onClick={() => {}}
                className="text-[10px] font-mono text-[#71717A] hover:text-[#A1A1AA]"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Box */}
          <div className="p-3 rounded-lg bg-[#080808] border border-[#27272A] font-mono text-[11px] text-[#A1A1AA] flex flex-col gap-1.5 min-h-[110px]">
            <div>
              <span className="text-[#71717A]">10:14:02.114</span>{" "}
              <span className="text-[#3B82F6]">[SYSTEM]</span> Simulator agent heartbeat healthy on node worker-staging-04.
            </div>
            <div>
              <span className="text-[#71717A]">10:14:02.890</span>{" "}
              <span className="text-[#22D3EE]">[RECALL-OPS]</span> Loaded 1,420 organizational embeddings from vector store.
            </div>
            <div>
              <span className="text-[#71717A]">10:14:03.011</span>{" "}
              <span className="text-[#22C55E]">[READY]</span> Awaiting scenario execution trigger for {targetService.toLowerCase()}...
            </div>
            <div className="flex items-center gap-1 text-[#FAFAFA]">
              <span>&gt;</span>
              <span className="inline-block w-2 h-3.5 bg-[#3B82F6] animate-pulse"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
