import { NextRequest, NextResponse } from "next/server";
import { investigateIncident, IncidentInput } from "@/lib/agent";

export async function POST(req: NextRequest) {
  // 1. Parse JSON body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body.",
      },
      { status: 400 }
    );
  }

  // 2. Validate input object
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        success: false,
        error: "Request body must be a JSON object.",
      },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;

  // Required fields: service, severity, error
  const service = typeof b.service === "string" ? b.service.trim() : "";
  const severity = typeof b.severity === "string" ? b.severity.trim() : "";
  const error = typeof b.error === "string" ? b.error.trim() : "";
  const details = typeof b.details === "string" ? b.details.trim() : "";
  const incidentId = typeof b.incidentId === "string" ? b.incidentId.trim() : undefined;

  if (!service) {
    return NextResponse.json(
      {
        success: false,
        error: "Field 'service' is required and must not be empty.",
      },
      { status: 400 }
    );
  }

  if (!severity) {
    return NextResponse.json(
      {
        success: false,
        error: "Field 'severity' is required and must not be empty.",
      },
      { status: 400 }
    );
  }

  if (!error) {
    return NextResponse.json(
      {
        success: false,
        error: "Field 'error' is required and must not be empty.",
      },
      { status: 400 }
    );
  }

  const incidentInput: IncidentInput = {
    incidentId,
    service,
    severity,
    error,
    details: details || "No additional runtime logs provided.",
  };

  // 3. Execute Real Agent Investigation Loop
  try {
    const result = await investigateIncident(incidentInput);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error("RecallOps agent investigation error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to complete agent investigation";

    return NextResponse.json(
      {
        success: false,
        error: `Agent investigation failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
