import { NextRequest, NextResponse } from "next/server";
import { retainResolvedPostMortem, getHindsightEnv } from "@/lib/hindsight";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Resolve route parameters
  const { id } = await context.params;
  const incidentId = id ? id.trim() : "";

  if (!incidentId) {
    return NextResponse.json(
      {
        success: false,
        error: "Route parameter 'id' is required.",
      },
      { status: 400 }
    );
  }

  // 2. Validate Hindsight configuration
  try {
    getHindsightEnv();
  } catch (envErr) {
    const msg = envErr instanceof Error ? envErr.message : "Environment error";
    return NextResponse.json(
      {
        success: false,
        error: `Hindsight configuration error: ${msg}`,
        recoverable: true,
      },
      { status: 500 }
    );
  }

  // 3. Parse JSON request body
  let body: Record<string, unknown> = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body.",
      },
      { status: 400 }
    );
  }

  const resolutionSummary =
    typeof body.resolutionSummary === "string" ? body.resolutionSummary.trim() : "";
  const mttr = typeof body.mttr === "string" ? body.mttr.trim() : "12 minutes";
  const lessonsLearned =
    typeof body.lessonsLearned === "string" ? body.lessonsLearned.trim() : "";

  if (!resolutionSummary) {
    return NextResponse.json(
      {
        success: false,
        error: "Resolution summary is required.",
      },
      { status: 400 }
    );
  }

  // 4. Extract incident context from payload or defaults
  const incident = (body.incident as Record<string, unknown>) || {};
  const aiAnalysis = (incident.aiAnalysis as Record<string, unknown>) || {};

  const title =
    typeof incident.title === "string" && incident.title.trim()
      ? incident.title.trim()
      : `${incidentId} Production Incident`;

  const service =
    typeof incident.service === "string" && incident.service.trim()
      ? incident.service.trim()
      : "Checkout API";

  const severity =
    typeof incident.severity === "string" && incident.severity.trim()
      ? incident.severity.trim()
      : "High";

  const error =
    typeof incident.error === "string" && incident.error.trim()
      ? incident.error.trim()
      : "Runtime service fault";

  const details = typeof incident.details === "string" ? incident.details.trim() : "";

  const rootCause =
    typeof aiAnalysis.likelyRootCause === "string" && aiAnalysis.likelyRootCause.trim()
      ? aiAnalysis.likelyRootCause.trim()
      : "Identified service bottleneck under peak load.";

  const investigationDetails =
    typeof aiAnalysis.evidenceFoundation === "string" &&
    aiAnalysis.evidenceFoundation.trim()
      ? aiAnalysis.evidenceFoundation.trim()
      : "RecallOps autonomous agent investigated using runtime telemetry and historical incident correlation against previous patterns.";

  const failedAttempt =
    typeof aiAnalysis.historicalAntiPatternAlert === "string" &&
    aiAnalysis.historicalAntiPatternAlert.trim()
      ? aiAnalysis.historicalAntiPatternAlert.trim()
      : "Restarting gateway nodes or worker pods alone did not resolve saturation.";

  // 5. Retain into Hindsight Cloud (shopease-incidents)
  try {
    const result = await retainResolvedPostMortem({
      incidentId,
      title,
      service,
      severity,
      error,
      details,
      rootCause,
      investigationDetails,
      successfulResolution: resolutionSummary,
      failedAttempt,
      mttr: mttr || "12 minutes",
      lessonsLearned:
        lessonsLearned || "Verify resource capacity thresholds before peak shopping traffic.",
      resolvedAt: new Date().toISOString(),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error("Failed to retain incident memory in Hindsight Cloud:", err);
    const message =
      err instanceof Error ? err.message : "Failed to retain memory in Hindsight Cloud";

    return NextResponse.json(
      {
        success: false,
        incidentId,
        error: `Hindsight Cloud memory capture failed: ${message}`,
        recoverable: true,
      },
      { status: 500 }
    );
  }
}
