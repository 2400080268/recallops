"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
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
  const [severity, setSeverity] = useState(
    simulationScenarios[0].severity === "High"
      ? "High (P1 - Revenue Impacting)"
      : "Critical (P0 - Hard Outage)"
  );
  const [region, setRegion] = useState(simulationScenarios[0].region);
  const [injectionWindow, setInjectionWindow] = useState(
    simulationScenarios[0].injectionWindow
  );
  const [incidentBrief, setIncidentBrief] = useState(
    simulationScenarios[0].incidentBrief
  );
  const [modifiers, setModifiers] = useState({
    latency: true,
    mockFeedback: true,
    triggerPagerDuty: true,
  });

  const [simulating, setSimulating] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const handleSelectScenario = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setTargetService(scenario.targetService);
    setSeverity(
      scenario.severity === "Critical"
        ? "Critical (P0 - Hard Outage)"
        : scenario.severity === "High"
        ? "High (P1 - Revenue Impacting)"
        : "Medium (P2 - Service Degraded)"
    );
    setRegion(scenario.region);
    setInjectionWindow(scenario.injectionWindow);
    setIncidentBrief(scenario.incidentBrief);
    setModifiers(scenario.activeModifiers);
  };

  const handleStartSimulation = () => {
    setSimulating(true);

    // Parse severity
    let parsedSeverity: Severity = "High";
    if (severity.toLowerCase().includes("critical") || severity.toLowerCase().includes("p0")) {
      parsedSeverity = "Critical";
    } else if (severity.toLowerCase().includes("medium") || severity.toLowerCase().includes("p2")) {
      parsedSeverity = "Medium";
    } else if (severity.toLowerCase().includes("low") || severity.toLowerCase().includes("p3")) {
      parsedSeverity = "Low";
    }

    // Determine fault signature based on scenario
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
    }

    // Create real structured incident in shared store
    const newIncident = createSimulatedIncident({
      title: selectedScenario.title,
      service: targetService,
      severity: parsedSeverity,
      error: selectedScenario.errorSignature,
      details: incidentBrief || selectedScenario.description,
      runtimeFaultSignature,
      recentDeployment: {
        profile: `${targetService.toLowerCase().replace(/[^a-z0-9]/g, "-")}-v2`,
        cluster: region.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        timeAgo: "12m ago",
        author: "release-bot (ArgoCD Pipeline #9482)",
        commit: "Commit 8f4e901",
      },
    });

    setCreatedIncidentId(newIncident.id);

    setTimeout(() => {
      setSimulating(false);
      setTimeout(() => {
        // Navigate directly to the newly simulated incident investigation
        router.push(`/incidents/${newIncident.id}`);
      }, 700);
    }, 1100);
  };

  const handleReset = () => {
    handleSelectScenario(simulationScenarios[0]);
  };

  return (
    <div className="flex flex-col w-full space-y-gutter-desktop">
      {/* Toast Notification */}
      {createdIncidentId && (
        <div className="fixed top-18 right-8 z-50 flex items-center gap-space-sm p-space-md rounded-xl bg-surface-container-high border border-secondary/50 text-secondary shadow-[0_0_20px_rgba(93,230,255,0.3)] animate-bounce">
          <Icon name="verified" size={20} className="text-secondary" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Chaos Injection Initiated ({createdIncidentId})
            </span>
            <span className="font-label-sm text-label-sm font-mono text-secondary">
              Routing to RecallOps Agent Investigation Console...
            </span>
          </div>
        </div>
      )}

      {/* Top Informative Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-md border border-[#1F2A37]/50">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary shadow-sm border border-[#1F2A37]/60">
              <Icon name="science" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-space-sm mb-0.5">
                <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container-highest text-secondary uppercase tracking-wider font-mono">
                  Sim-Engine v4.2
                </span>
                <span className="font-label-sm text-label-sm text-outline font-mono">
                  • Target: ShopEase Production Mirror
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Simulate Incident
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Create a deterministic or randomized production outage to
                evaluate RecallOps AI automated diagnostic and runbook recall
                capabilities.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-md self-start md:self-auto shrink-0 bg-surface-container-lowest px-space-md py-space-sm rounded-lg shadow-inner border border-[#1F2A37]/50">
            <div className="flex flex-col text-right">
              <span className="font-label-sm text-label-sm text-outline font-mono">
                SANDBOX CLUSTER
              </span>
              <span className="font-label-md text-label-md text-secondary font-mono">
                us-east-1-chaos-04
              </span>
            </div>
            <div className="h-6 w-px bg-surface-container-highest"></div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface font-mono font-medium">
                RECEPTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Scenario Templates */}
      <div className="flex flex-col space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-mono font-bold">
              01 // PRE-CONFIGURED CHAOS VECTORS
            </span>
            <span className="text-outline font-label-sm text-label-sm font-mono">
              ({simulationScenarios.length} Templates Available)
            </span>
          </div>
          <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline font-mono">
            <Icon name="auto_fix_high" size={16} className="text-primary" />
            Deterministic Chaos Injection Protocol
          </div>
        </div>

        {/* 8 Template Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {simulationScenarios.map((scenario) => {
            const isSelected = selectedScenario.id === scenario.id;
            const isCriticalOrHigh =
              scenario.severity === "Critical" || scenario.severity === "High";

            return (
              <div
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className={`scenario-card group relative flex flex-col justify-between p-space-md rounded-xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "bg-surface-container-high border-secondary/50 shadow-[0_0_16px_-2px_rgba(93,230,255,0.25)]"
                    : "bg-surface-container-low hover:bg-surface-container border-[#1F2A37]/50 shadow-sm"
                }`}
              >
                {isSelected && (
                  <div className="absolute inset-x-0 -top-px h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
                )}
                <div>
                  <div className="flex items-start justify-between gap-space-xs mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <Icon
                        name={scenario.icon}
                        size={18}
                        className={isSelected ? "text-secondary" : "text-primary"}
                      />
                      <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                        {scenario.title}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-surface-container-lowest">
                        <Icon name="check" size={12} className="font-bold text-black" />
                      </span>
                    )}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-mono border border-[#1F2A37]/30">
                    {scenario.service}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded font-mono ${
                      isCriticalOrHigh
                        ? "bg-error-container text-error"
                        : "bg-surface-container-highest text-secondary"
                    }`}
                  >
                    {scenario.severity}
                  </span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-lowest text-outline font-mono border border-[#1F2A37]/30">
                    {scenario.badgeTag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sections 2 & 3: Asymmetric Split Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Section 2: Scenario Parameters & Blast Radius (7 cols) */}
        <div className="xl:col-span-7 flex flex-col rounded-xl bg-surface-container p-space-lg shadow-md space-y-space-lg border border-[#1F2A37]/50">
          <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high/50">
            <div className="flex items-center gap-space-sm">
              <Icon name="tune" size={20} className="text-primary" />
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Scenario Parameters & Blast Radius
              </h2>
            </div>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded bg-surface-container-lowest text-outline font-mono border border-[#1F2A37]/30">
              INJECTOR-CONF-A
            </span>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {/* Service Target */}
            <div className="flex flex-col space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>Target Service</span>
                <span className="text-secondary text-[11px] font-mono">
                  {selectedScenario.service}
                </span>
              </label>
              <select
                value={targetService}
                onChange={(e) => setTargetService(e.target.value)}
                className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg px-space-md py-2 text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
              >
                <option value="Checkout (API Gateway)">
                  Checkout (API Gateway)
                </option>
                <option value="Payment Service">Payment Service</option>
                <option value="Database (Primary PostgreSQL)">
                  Database (Primary PostgreSQL)
                </option>
                <option value="Redis Cache Cluster">Redis Cache Cluster</option>
                <option value="Order Service">Order Service</option>
                <option value="Authentication Service">
                  Authentication Service
                </option>
                <option value="Search & Catalog Service">
                  Search & Catalog Service
                </option>
              </select>
            </div>

            {/* Simulated Severity */}
            <div className="flex flex-col space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>Simulated Severity</span>
                <span className="text-error text-[11px] font-mono">
                  PagerDuty Priority
                </span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg px-space-md py-2 text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
              >
                <option value="Critical (P0 - Hard Outage)">
                  Critical (P0 - Hard Outage)
                </option>
                <option value="High (P1 - Revenue Impacting)">
                  High (P1 - Revenue Impacting)
                </option>
                <option value="Medium (P2 - Service Degraded)">
                  Medium (P2 - Service Degraded)
                </option>
                <option value="Low (P3 - Informational)">
                  Low (P3 - Informational)
                </option>
              </select>
            </div>

            {/* Availability Region */}
            <div className="flex flex-col space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>Availability Region</span>
                <span className="text-outline text-[11px] font-mono">AWS VPC</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg px-space-md py-2 text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
              >
                <option value="US-East (Primary VPC)">
                  US-East (Primary VPC)
                </option>
                <option value="US-West (Replica VPC)">
                  US-West (Replica VPC)
                </option>
                <option value="EU-Central (Frankfurt)">
                  EU-Central (Frankfurt)
                </option>
              </select>
            </div>

            {/* Injection Window */}
            <div className="flex flex-col space-y-space-xs">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>Injection Window</span>
                <span className="text-secondary text-[11px] font-mono">
                  Auto-Rollback
                </span>
              </label>
              <select
                value={injectionWindow}
                onChange={(e) => setInjectionWindow(e.target.value)}
                className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg px-space-md py-2 text-on-surface font-body-md text-body-md focus:border-secondary focus:outline-none"
              >
                <option value="15 minutes (Quick Spike)">
                  15 minutes (Quick Spike)
                </option>
                <option value="30 minutes (Standard Drill)">
                  30 minutes (Standard Drill)
                </option>
                <option value="60 minutes (Extended Stress)">
                  60 minutes (Extended Stress)
                </option>
              </select>
            </div>
          </div>

          {/* Incident Brief Textarea */}
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md text-on-surface-variant">
                Incident Brief & Synthetic Telemetry Log Injection
              </label>
              <span className="font-label-sm text-[11px] text-outline font-mono">
                {incidentBrief.length}/500 Chars
              </span>
            </div>
            <textarea
              rows={3}
              value={incidentBrief}
              onChange={(e) => setIncidentBrief(e.target.value)}
              className="w-full bg-surface-container-lowest border border-[#1F2A37] rounded-lg p-space-md text-on-surface font-code-inline text-code-inline font-mono focus:border-secondary focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Active Chaos Modifiers */}
          <div className="flex flex-col space-y-space-xs pt-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-mono">
              Active Chaos Modifiers
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <label className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low border border-[#1F2A37]/50 cursor-pointer hover:bg-surface-container-high transition-colors">
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">
                    Inject Latency
                  </div>
                  <div className="font-label-sm text-[10px] text-secondary font-mono">
                    +2,200ms jitter
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.latency}
                  onChange={(e) =>
                    setModifiers({ ...modifiers, latency: e.target.checked })
                  }
                  className="rounded text-secondary focus:ring-0 bg-surface-container-lowest h-4 w-4 border-[#1F2A37]"
                />
              </label>

              <label className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low border border-[#1F2A37]/50 cursor-pointer hover:bg-surface-container-high transition-colors">
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">
                    Mock Feedback
                  </div>
                  <div className="font-label-sm text-[10px] text-secondary font-mono">
                    Synthetic Zendesk
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.mockFeedback}
                  onChange={(e) =>
                    setModifiers({
                      ...modifiers,
                      mockFeedback: e.target.checked,
                    })
                  }
                  className="rounded text-secondary focus:ring-0 bg-surface-container-lowest h-4 w-4 border-[#1F2A37]"
                />
              </label>

              <label className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low border border-[#1F2A37]/50 cursor-pointer hover:bg-surface-container-high transition-colors">
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">
                    Trigger PagerDuty
                  </div>
                  <div className="font-label-sm text-[10px] text-secondary font-mono">
                    Sandbox Escalation
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.triggerPagerDuty}
                  onChange={(e) =>
                    setModifiers({
                      ...modifiers,
                      triggerPagerDuty: e.target.checked,
                    })
                  }
                  className="rounded text-secondary focus:ring-0 bg-surface-container-lowest h-4 w-4 border-[#1F2A37]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Live Impact Blueprint (5 cols) */}
        <div className="xl:col-span-5 flex flex-col rounded-xl bg-surface-container-low p-space-lg shadow-md space-y-space-md border border-[#1F2A37]/50">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
            <div className="flex items-center gap-space-xs">
              <Icon name="travel_explore" size={18} className="text-secondary" />
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Live Impact Blueprint
              </h2>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
              ESTIMATED TELEMETRY
            </span>
          </div>

          {/* Blueprint Card */}
          <div className="p-space-md rounded-lg bg-surface-container-lowest flex flex-col space-y-space-sm border border-[#1F2A37]/60">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[10px] text-outline font-mono">
                VECTOR SIGNATURE:
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-mono">
                {selectedScenario.liveImpact.vectorSignature}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                {selectedScenario.title}
              </span>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-error-container text-error font-mono font-bold">
                SEV-1 HIGH
              </span>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-outline font-mono">
              <span>Target: {selectedScenario.liveImpact.target}</span>
              <span>Cluster: {selectedScenario.liveImpact.cluster}</span>
            </div>

            {/* Error Frequency Chart */}
            <div className="pt-space-xs">
              <div className="flex items-center justify-between font-label-sm text-[10px] text-outline font-mono mb-1">
                <span>PROJECTED ERROR FREQUENCY</span>
                <span className="text-error font-bold">
                  {selectedScenario.liveImpact.peakErrorFrequency}
                </span>
              </div>
              <div className="h-16 w-full bg-surface-container-low rounded-lg p-2 flex items-end relative overflow-hidden border border-[#1F2A37]/40">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="simImpactGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#5de6ff" stopOpacity="0.4" />
                      <stop
                        offset="100%"
                        stopColor="#5de6ff"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 35 Q 25 32, 45 20 T 75 8 T 100 5 L 100 40 L 0 40 Z"
                    fill="url(#simImpactGrad)"
                  />
                  <path
                    d="M 0 35 Q 25 32, 45 20 T 75 8 T 100 5"
                    fill="none"
                    stroke="#5de6ff"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Projected System Degradation */}
            <div className="pt-space-xs flex flex-col space-y-space-xs">
              <span className="font-label-sm text-[10px] text-outline font-mono uppercase tracking-wider">
                Projected System Degradation
              </span>
              <div className="flex flex-col gap-1.5 font-code-inline text-code-inline font-mono">
                {selectedScenario.liveImpact.projectedDegradations.map(
                  (deg, idx) => (
                    <div
                      key={idx}
                      className="p-space-sm rounded bg-surface-container-low border border-[#1F2A37]/40 flex flex-col gap-0.5"
                    >
                      <div className="flex items-center gap-1.5 text-error font-semibold">
                        <Icon
                          name={deg.type === "error" ? "report_problem" : "warning"}
                          size={14}
                        />
                        <span>{deg.title}</span>
                      </div>
                      <span className="text-outline text-[11px]">
                        {deg.description}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Historical Correlation */}
            <div className="p-space-sm rounded bg-surface-container-low border border-[#1F2A37]/50 flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="history_toggle_off" size={16} className="text-primary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-outline font-mono">
                    Historical Correlation
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface font-mono">
                    Matches {selectedScenario.liveImpact.historicalCorrelation.matchId} ({selectedScenario.liveImpact.historicalCorrelation.matchDate})
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary font-mono font-semibold">
                {selectedScenario.liveImpact.historicalCorrelation.confidence}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Engine Armed Banner & Footer Actions */}
      <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md shadow-md border border-[#1F2A37]/50">
        <div className="flex items-center gap-space-md">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary border border-[#1F2A37]/50">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Engine Armed • Safe Sandbox Isolator Active
            </div>
            <p className="font-body-sm text-body-sm text-outline">
              Ready to inject chaos into isolated ShopEase replica. RecallOps AI
              agent will immediately spin up telemetry correlating agents upon
              ignition.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-label-sm text-label-sm text-outline font-mono">
          <span className="h-2 w-2 rounded-full bg-secondary"></span>
          <span>SANDBOX INTEGRITY VERIFIED</span>
        </div>
      </div>

      {/* Action Trigger Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-xs pb-space-lg">
        <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline font-mono">
          <Icon name="verified" size={16} className="text-secondary" />
          <span>Simulated traffic does not touch external customer gateways</span>
        </div>

        <div className="flex items-center gap-space-md w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-space-lg py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-body-md font-medium transition-colors border border-[#1F2A37]/50"
          >
            Reset Parameters
          </button>

          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={simulating}
            className="flex-1 sm:flex-none px-space-xl py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {simulating ? (
              <>
                <Icon
                  name="autorenew"
                  size={18}
                  className="animate-spin text-on-primary"
                />
                <span>Igniting Chaos Vector...</span>
              </>
            ) : (
              <>
                <Icon name="bolt" size={18} className="text-on-primary" />
                <span>Start Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
