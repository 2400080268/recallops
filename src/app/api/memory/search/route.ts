import { NextRequest, NextResponse } from "next/server";
import { recallIncidentMemory, getHindsightEnv } from "@/lib/hindsight";

export async function POST(req: NextRequest) {
  // 1. Validate Environment
  try {
    getHindsightEnv();
  } catch (envErr) {
    const msg = envErr instanceof Error ? envErr.message : "Environment error";
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }

  // 2. Parse & Validate Request Body
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

  if (
    !body ||
    typeof body !== "object" ||
    !("query" in body) ||
    typeof (body as { query: unknown }).query !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Request body must contain a 'query' string.",
      },
      { status: 400 }
    );
  }

  const query = (body as { query: string }).query.trim();
  if (!query) {
    return NextResponse.json(
      {
        success: false,
        error: "The 'query' field cannot be empty.",
      },
      { status: 400 }
    );
  }

  // 3. Perform Live Hindsight Recall
  try {
    const recallResult = await recallIncidentMemory(query, 5);

    return NextResponse.json(
      {
        success: true,
        query: recallResult.query,
        bankId: process.env.HINDSIGHT_BANK_ID || "shopease-incidents",
        resultsCount: recallResult.results.length,
        results: recallResult.results,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Hindsight recall error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to recall memories from Hindsight";

    return NextResponse.json(
      {
        success: false,
        error: `Hindsight recall error: ${message}`,
      },
      { status: 500 }
    );
  }
}
