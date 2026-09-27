import { HindsightClient } from "@vectorize-io/hindsight-client";

export interface IncidentMemory {
  id: string;
  title: string;
  date: string;
  service: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  symptoms: string;
  errorSignature: string;
  rootCause: string;
  investigationSteps: string[];
  failedAttempts: string;
  successfulResolution: string;
  resolutionTime: string;
  lessonsLearned: string;
  recentDeployment?: string;
  tags: string[];
}

export interface RecalledMemoryResult {
  id: string;
  text: string;
  type?: string | null;
  entities: string[];
  documentId?: string | null;
  tags?: string[] | null;
  score?: number | null;
  semanticScore?: number | null;
}

export interface BankStatusResult {
  success: boolean;
  bankId: string;
  connected: boolean;
  latencyMs: number;
  totalMemories?: number;
  features?: {
    reranking?: boolean;
    graphRetrieval?: boolean;
    temporalRetrieval?: boolean;
    autoConsolidation?: boolean;
  };
}

let hindsightInstance: HindsightClient | null = null;

/**
 * Validates Hindsight environment configuration and returns client options.
 */
export function getHindsightEnv() {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  const baseUrl = process.env.HINDSIGHT_BASE_URL;
  const bankId = process.env.HINDSIGHT_BANK_ID || "shopease-incidents";

  if (!apiKey) {
    throw new Error(
      "HINDSIGHT_API_KEY is not configured. Please set HINDSIGHT_API_KEY in your server environment."
    );
  }

  if (!baseUrl) {
    throw new Error(
      "HINDSIGHT_BASE_URL is not configured. Please set HINDSIGHT_BASE_URL in your server environment."
    );
  }

  return { apiKey, baseUrl, bankId };
}

/**
 * Returns a server-side singleton HindsightClient instance.
 */
export function getHindsightClient(): { client: HindsightClient; bankId: string } {
  const { apiKey, baseUrl, bankId } = getHindsightEnv();

  if (!hindsightInstance) {
    hindsightInstance = new HindsightClient({
      apiKey,
      baseUrl,
    });
  }

  return { client: hindsightInstance, bankId };
}

/**
 * Retrieves the status and configuration profile of the Hindsight memory bank.
 */
export async function getMemoryBankProfile(): Promise<BankStatusResult> {
  const { client, bankId } = getHindsightClient();
  const startTime = Date.now();

  try {
    const config = await client.getBankConfig(bankId);
    const latencyMs = Date.now() - startTime;

    let totalMemories = 0;
    try {
      const memList = await client.listMemories(bankId, { limit: 1 });
      totalMemories = memList.total;
    } catch {
      // If listMemories has an issue, continue with config
    }

    return {
      success: true,
      bankId,
      connected: true,
      latencyMs,
      totalMemories,
      features: {
        reranking: Boolean(config.config?.enable_reranking ?? true),
        graphRetrieval: Boolean(config.config?.enable_graph_retrieval ?? true),
        temporalRetrieval: Boolean(config.config?.enable_temporal_retrieval ?? true),
        autoConsolidation: Boolean(config.config?.enable_auto_consolidation ?? true),
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to connect to Hindsight bank";
    throw new Error(`Hindsight connection error: ${message}`);
  }
}

/**
 * Retains an incident memory inside the Hindsight bank.
 */
export async function retainIncidentMemory(incident: IncidentMemory) {
  const { client, bankId } = getHindsightClient();

  const formattedContent = `Incident ${incident.id}: ${incident.title}
Date: ${incident.date}
Service Target: ${incident.service} (Severity: ${incident.severity})
Symptoms: ${incident.symptoms}
Runtime Error Signature: ${incident.errorSignature}
Root Cause Analysis: ${incident.rootCause}
Investigation Steps:
${incident.investigationSteps.map((s, idx) => `  ${idx + 1}. ${s}`).join("\n")}
Failed Remediation Attempts: ${incident.failedAttempts}
Successful Resolution (Verified Runbook): ${incident.successfulResolution}
Resolution Time: ${incident.resolutionTime}
Lessons Learned: ${incident.lessonsLearned}
${incident.recentDeployment ? `Recent Deployment Correlation: ${incident.recentDeployment}` : ""}`;

  const response = await client.retain(bankId, formattedContent, {
    context: `ShopEase Production Incident Archive - ${incident.service}`,
    documentId: incident.id,
    tags: [incident.service, incident.severity, ...incident.tags],
  });

  return {
    success: response.success,
    documentId: incident.id,
    bankId: response.bank_id,
    itemsCount: response.items_count,
  };
}

/**
 * Recalls relevant memories from Hindsight using semantic & graph search.
 */
export async function recallIncidentMemory(
  query: string,
  limit: number = 5
): Promise<{ query: string; results: RecalledMemoryResult[] }> {
  const { client, bankId } = getHindsightClient();

  const recallResponse = await client.recall(bankId, query, {
    maxTokens: 2048,
  });

  const results: RecalledMemoryResult[] = (recallResponse.results || [])
    .slice(0, limit)
    .map((item) => {
      const entityNames = Object.keys(recallResponse.entities || {});
      const matchedEntities = entityNames.filter((e) =>
        item.text.toLowerCase().includes(e.toLowerCase())
      );

      return {
        id: item.id,
        text: item.text,
        type: item.type ?? "incident_memory",
        entities:
          matchedEntities.length > 0 ? matchedEntities : item.entities || [],
        documentId: item.document_id,
        tags: item.tags,
        score: item.scores?.final,
        semanticScore: item.scores?.semantic,
      };
    });

  return {
    query,
    results,
  };
}

export interface RetainPostMortemParams {
  incidentId: string;
  title: string;
  service: string;
  severity: string;
  error: string;
  details?: string;
  rootCause: string;
  investigationDetails?: string;
  successfulResolution: string;
  failedAttempt?: string;
  mttr: string;
  lessonsLearned: string;
  resolvedAt?: string;
}

export interface RetainPostMortemResult {
  success: boolean;
  incidentId: string;
  memoryCaptured: boolean;
  memoryId: string;
  alreadyExists: boolean;
  timestamp: string;
  bankId: string;
  postMortem: string;
}

/**
 * Retains a structured incident post-mortem into Hindsight Cloud (shopease-incidents).
 * Handles deduplication by checking existing documentId/content before retaining.
 */
export async function retainResolvedPostMortem(
  params: RetainPostMortemParams
): Promise<RetainPostMortemResult> {
  const { client, bankId } = getHindsightClient();

  const resolvedDate = params.resolvedAt ? new Date(params.resolvedAt) : new Date();
  const resolvedDateString = resolvedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const postMortemText = `ShopEase production incident ${params.incidentId} affected the ${params.service} service.

The incident produced ${params.error} with ${params.severity} severity during peak traffic.

Root cause:
${params.rootCause}

Investigation:
${
  params.investigationDetails ||
  "RecallOps autonomous agent investigated using runtime telemetry and historical incident correlation against previous patterns."
}

Successful resolution:
${params.successfulResolution}

Failed attempt:
${
  params.failedAttempt ||
  "Restarting worker nodes alone did not resolve the issue and increased traffic against stressed backends."
}

Resolution time:
${params.mttr}

Lesson learned:
${params.lessonsLearned}

This incident was resolved on ${resolvedDateString}.`;

  // 1. Deduplication check: check if memory for this incidentId already exists
  try {
    const existing = await client.recall(bankId, `incident ${params.incidentId}`, {
      maxTokens: 1024,
    });
    const alreadyStored = (existing.results || []).some(
      (r) =>
        r.document_id === params.incidentId ||
        r.text.includes(params.incidentId) ||
        (r.tags && r.tags.includes(params.incidentId))
    );

    if (alreadyStored) {
      return {
        success: true,
        incidentId: params.incidentId,
        memoryCaptured: true,
        memoryId: params.incidentId,
        alreadyExists: true,
        timestamp: new Date().toISOString(),
        bankId,
        postMortem: postMortemText,
      };
    }
  } catch (dedupErr) {
    console.warn("Hindsight deduplication check warning (continuing with retain):", dedupErr);
  }

  // 2. Retain post-mortem memory in Hindsight Cloud
  const response = await client.retain(bankId, postMortemText, {
    context: `ShopEase Production Incident Archive - ${params.service}`,
    documentId: params.incidentId,
    metadata: {
      incidentId: params.incidentId,
      service: params.service,
      severity: params.severity,
      status: "resolved",
      memoryType: "incident_postmortem",
      timestamp: new Date().toISOString(),
    },
    tags: [
      params.incidentId,
      params.service,
      params.severity,
      "resolved",
      "post_mortem",
      "shopease",
    ],
  });

  if (!response.success) {
    throw new Error(`Hindsight client retain returned success: false for bank ${bankId}`);
  }

  return {
    success: true,
    incidentId: params.incidentId,
    memoryCaptured: true,
    memoryId: params.incidentId,
    alreadyExists: false,
    timestamp: new Date().toISOString(),
    bankId: response.bank_id,
    postMortem: postMortemText,
  };
}

