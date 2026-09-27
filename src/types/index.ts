export type Severity = "Low" | "Medium" | "High" | "Critical";

export type IncidentStatus = "Open" | "In Progress" | "Resolved";

export interface Incident {
  id: string;
  title: string;
  service: string;
  serviceVersion?: string;
  severity: Severity;
  status: IncidentStatus;
  started: string;
  duration: string;
  timeAgo?: string;
  error: string;
  details: string;
  impactSeverity?: string;
  sloBreachWarning?: string;
  startedTimestamp?: string;
  elapsedSeconds?: number;
  errorSpikeRate?: string;
  errorBaseline?: string;
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
  connectionPoolUtilization?: {
    current: number;
    max: number;
    percentage: number;
    available: number;
    waitingThreads: number;
  };
  recommendedActions?: Array<{
    step: number;
    title: string;
    detail: string;
    tag?: string;
    tagType?: "critical" | "warning" | "info" | "success";
  }>;
  aiAnalysis?: {
    agentVersion: string;
    confidenceScore: number;
    analysisDuration: string;
    pipelineSteps: Array<{
      title: string;
      time: string;
      completed: boolean;
    }>;
    likelyRootCause: string;
    evidenceFoundation: string;
    previousSuccessfulResolution: string;
    historicalAntiPatternAlert: string;
    decisionContext: string;
    confidenceAssessment?: {
      level: "high" | "medium" | "low";
      score: number;
      basis: string;
      factors: string[];
    };
    recurringPatterns?: string[];
    whatWorkedBefore?: Array<{
      action: string;
      incidentIds: string[];
      details?: string;
    }>;
    whatFailedBefore?: Array<{
      action: string;
      incidentIds: string[];
      consequence?: string;
    }>;
    recommendationReasons?: Array<{
      action: string;
      why: string;
      evidenceCited: string[];
    }>;
    caveats?: string[];
    isNovel?: boolean;
    hasContradictoryEvidence?: boolean;
    contradictionDetails?: string;
    mostRecentEvidence?: {
      id: string;
      title: string;
      age: string;
      isRecentlyLearned: boolean;
    };
  };
  similarIncidentIds?: string[];
  resolutionDetails?: {
    summary: string;
    resolvedAt?: string;
    resolutionTime?: string;
    lessonsLearned?: string;
  };
  memoryCaptured?: boolean;
  memoryId?: string;
  memoryCapturedAt?: string;
}

export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  service: string;
  severity: Severity;
  badgeTag: string;
  errorSignature: string;
  icon: string;
  targetService: string;
  region: string;
  injectionWindow: string;
  incidentBrief: string;
  activeModifiers: {
    latency: boolean;
    mockFeedback: boolean;
    triggerPagerDuty: boolean;
  };
  liveImpact: {
    vectorSignature: string;
    target: string;
    cluster: string;
    peakErrorFrequency: string;
    projectedDegradations: Array<{
      title: string;
      description: string;
      type: "error" | "warning" | "info";
    }>;
    historicalCorrelation: {
      matchId: string;
      matchDate: string;
      confidence: string;
    };
  };
}

export interface MemoryEntry {
  id: string;
  title: string;
  service: string;
  age: string;
  matchPercentage?: string;
  similarity?: string;
  rootCause: string;
  resolution: string;
  failedAttempts: string;
  lesson: string;
  relatedIncidents: string[];
  usageCount: number;
  mttr: string;
  resolvedBy: string;
  symptoms?: string;
  category: "Payment" | "Database" | "Redis" | "Search" | "Authentication" | "Orders";
  isNewMemory?: boolean;
}

export interface ServiceStatus {
  name: string;
  status: "Healthy" | "Degraded" | "Down";
  latency: string;
  latencyNum: number;
  loadPercentage: number;
}
