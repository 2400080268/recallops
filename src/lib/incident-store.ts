"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { incidents as initialMockIncidents } from "./mock-data";
import { Incident, IncidentStatus, Severity } from "@/types";

const STORAGE_KEY = "recallops_incidents_store_v1";
const COUNTER_KEY = "recallops_incident_id_counter";
const EVENT_NAME = "recallops:incidents:updated";

export interface CreateIncidentParams {
  title: string;
  service: string;
  severity: Severity;
  error: string;
  details: string;
  serviceVersion?: string;
  runtimeFaultSignature?: {
    code: string;
    stackTrace: string;
  };
  recentDeployment?: {
    profile: string;
    cluster: string;
    timeAgo: string;
    author: string;
    commit: string;
  };
}

/**
 * Returns stored incidents from localStorage if available, or seeds from initialMockIncidents
 */
export function getStoredIncidents(): Incident[] {
  if (typeof window === "undefined") {
    return initialMockIncidents;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockIncidents));
      return initialMockIncidents;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to load incidents from localStorage, using defaults:", e);
  }

  return initialMockIncidents;
}

/**
 * Returns a single incident by ID from storage
 */
export function getStoredIncident(id: string): Incident | undefined {
  const all = getStoredIncidents();
  return all.find((inc) => inc.id === id);
}

/**
 * Generates the next sequential unique incident ID (e.g. INC-1099, INC-1100, etc.)
 */
function getNextIncidentId(existing: Incident[]): string {
  let highestNum = 1098;

  for (const inc of existing) {
    const match = inc.id.match(/^INC-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highestNum) {
        highestNum = num;
      }
    }
  }

  if (typeof window !== "undefined") {
    const storedCounter = localStorage.getItem(COUNTER_KEY);
    if (storedCounter) {
      const parsed = parseInt(storedCounter, 10);
      if (parsed > highestNum) {
        highestNum = parsed;
      }
    }
    const nextIdNum = highestNum + 1;
    localStorage.setItem(COUNTER_KEY, nextIdNum.toString());
    return `INC-${nextIdNum}`;
  }

  return `INC-${highestNum + 1}`;
}

/**
 * Creates a new incident, prepends it to the shared list, and notifies all listeners
 */
export function createSimulatedIncident(params: CreateIncidentParams): Incident {
  const current = getStoredIncidents();
  const nextId = getNextIncidentId(current);
  const now = new Date();
  const startedTimeString = "Just now";
  const startedTimestamp = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const newIncident: Incident = {
    id: nextId,
    title: params.title,
    service: params.service,
    serviceVersion: params.serviceVersion || "v2.14.0 (production)",
    severity: params.severity,
    status: "Open",
    started: startedTimeString,
    duration: "1 min",
    error: params.error,
    details: params.details,
    impactSeverity: `${params.severity} / P1 Sev`,
    sloBreachWarning: "SLO Breach Imminent",
    startedTimestamp,
    elapsedSeconds: 30,
    errorSpikeRate: "+38.4% spike",
    errorBaseline: "Baseline: 0.12%",
    runtimeFaultSignature: params.runtimeFaultSignature || {
      code: params.error,
      stackTrace: `Exception in ${params.service}: ${params.error}\n  at com.shopease.${params.service.toLowerCase().replace(/\s+/g, "")}.Main(Service.kt:84)`,
    },
    recentDeployment: params.recentDeployment || {
      profile: `${params.service.toLowerCase().replace(/\s+/g, "-")}-release`,
      cluster: "prod-us-east-1",
      timeAgo: "10m ago",
      author: "deploy-bot (CI/CD Pipeline #9104)",
      commit: "Commit 9a8f12c",
    },
    connectionPoolUtilization: {
      current: 96,
      max: 100,
      percentage: 96,
      available: 4,
      waitingThreads: 248,
    },
    recommendedActions: [
      {
        step: 1,
        title: "Triage Active Incident",
        detail: `Run automated diagnostic for ${params.service} (${nextId}).`,
        tag: "Immediate",
        tagType: "critical",
      },
    ],
  };

  const updatedList = [newIncident, ...current];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { incident: newIncident } }));
  }

  return newIncident;
}

/**
 * Updates an incident in storage and notifies all listeners
 */
export function updateIncidentInStore(
  id: string,
  updates: Partial<Incident>
): Incident | undefined {
  const current = getStoredIncidents();
  let updatedIncident: Incident | undefined;

  const updatedList = current.map((inc) => {
    if (inc.id === id) {
      updatedIncident = { ...inc, ...updates };
      return updatedIncident;
    }
    return inc;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { incidentId: id, updates } })
    );
  }

  return updatedIncident;
}

/**
 * Calculates current incident statistics from an incidents list
 */
export function calculateIncidentStats(list: Incident[]) {
  const total = list.length;
  const open = list.filter((i) => i.status === "Open").length;
  const inProgress = list.filter((i) => i.status === "In Progress").length;
  const resolved = list.filter((i) => i.status === "Resolved").length;

  const sev1 = list.filter((i) => i.severity === "Critical" || i.severity === "High").length;
  const sev2 = list.filter((i) => i.severity === "Medium").length;
  const sev3 = list.filter((i) => i.severity === "Low").length;

  return {
    total,
    open,
    inProgress,
    resolved,
    sev1,
    sev2,
    sev3,
  };
}

/**
 * React hook to subscribe to reactive incident state across pages
 */
export function useIncidents() {
  const [incidentsList, setIncidentsList] = useState<Incident[]>(getStoredIncidents);

  const refresh = useCallback(() => {
    setIncidentsList(getStoredIncidents());
  }, []);

  useEffect(() => {
    // Initial sync
    refresh();

    // Listen for custom in-window updates
    const handleUpdate = () => {
      refresh();
    };

    // Listen for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  const stats = useMemo(() => calculateIncidentStats(incidentsList), [incidentsList]);

  const createIncident = useCallback((params: CreateIncidentParams) => {
    return createSimulatedIncident(params);
  }, []);

  const updateStatus = useCallback(
    (
      id: string,
      status: IncidentStatus,
      resolutionDetails?: Incident["resolutionDetails"],
      extraUpdates?: Partial<Incident>
    ) => {
      return updateIncidentInStore(id, {
        status,
        ...(resolutionDetails ? { resolutionDetails } : {}),
        ...(extraUpdates || {}),
      });
    },
    []
  );

  const getIncident = useCallback(
    (id: string) => {
      return incidentsList.find((i) => i.id === id);
    },
    [incidentsList]
  );

  return {
    incidents: incidentsList,
    stats,
    createIncident,
    updateStatus,
    getIncident,
    refresh,
  };
}
