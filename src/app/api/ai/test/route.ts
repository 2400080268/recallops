import { NextRequest, NextResponse } from "next/server";
import { generateIncidentAssessment, GROQ_MODEL } from "@/lib/groq";

export async function POST(req: NextRequest) {
  // 1. Verify Server-Side API Key Configuration
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "GROQ_API_KEY is not configured on the server.",
      },
      { status: 500 }
    );
  }

  // 2. Parse and Validate Request Body
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
    !("message" in body) ||
    typeof (body as { message: unknown }).message !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Request body must contain a 'message' string.",
      },
      { status: 400 }
    );
  }

  const message = (body as { message: string }).message.trim();
  if (!message) {
    return NextResponse.json(
      {
        success: false,
        error: "The 'message' field cannot be empty.",
      },
      { status: 400 }
    );
  }

  // 3. Perform Live Groq Completion
  try {
    const result = await generateIncidentAssessment(message);

    return NextResponse.json(
      {
        success: true,
        response: result.content,
        model: result.model,
        durationMs: result.durationMs,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Groq API Execution Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error calling Groq API.";

    return NextResponse.json(
      {
        success: false,
        error: `Groq LLM call failed: ${errorMessage}`,
        model: GROQ_MODEL,
      },
      { status: 500 }
    );
  }
}
