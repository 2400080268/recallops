import { NextResponse } from "next/server";
import { getMemoryBankProfile } from "@/lib/hindsight";

export async function GET() {
  if (!process.env.HINDSIGHT_API_KEY || !process.env.HINDSIGHT_BASE_URL) {
    return NextResponse.json(
      {
        success: false,
        error: "Hindsight environment variables are not configured on the server.",
      },
      { status: 500 }
    );
  }

  try {
    const profile = await getMemoryBankProfile();
    return NextResponse.json(profile, { status: 200 });
  } catch (err: unknown) {
    console.error("Hindsight status error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to connect to Hindsight bank";

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
