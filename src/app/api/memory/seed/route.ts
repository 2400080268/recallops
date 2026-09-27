import { NextResponse } from "next/server";
import { getHindsightClient, retainIncidentMemory } from "@/lib/hindsight";
import { HISTORICAL_SHOP_EASE_INCIDENTS } from "@/lib/hindsight-seed";

export async function POST() {
  if (!process.env.HINDSIGHT_API_KEY || !process.env.HINDSIGHT_BASE_URL) {
    return NextResponse.json(
      {
        success: false,
        error: "HINDSIGHT_API_KEY or HINDSIGHT_BASE_URL is not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const { client, bankId } = getHindsightClient();

    // Check existing document IDs to make the seed process idempotent and avoid duplicate ingestion
    const existingDocIds = new Set<string>();
    try {
      const existing = await client.listMemories(bankId, { limit: 100 });
      for (const item of existing.items || []) {
        if (item.document_id) {
          existingDocIds.add(item.document_id);
        }
      }
    } catch (e) {
      console.warn("Could not list existing memories before seed, proceeding with retain:", e);
    }

    const seededIds: string[] = [];
    const skippedIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const incident of HISTORICAL_SHOP_EASE_INCIDENTS) {
      // If already seeded and documentId exists, skip to prevent duplicate token consumption
      if (existingDocIds.has(incident.id)) {
        skippedIds.push(incident.id);
        continue;
      }

      try {
        await retainIncidentMemory(incident);
        seededIds.push(incident.id);
      } catch (itemErr: unknown) {
        const msg =
          itemErr instanceof Error ? itemErr.message : "Failed to retain incident";
        errors.push({ id: incident.id, error: msg });
      }
    }

    return NextResponse.json(
      {
        success: true,
        bankId,
        totalIncidents: HISTORICAL_SHOP_EASE_INCIDENTS.length,
        seededCount: seededIds.length,
        skippedCount: skippedIds.length,
        seededIds,
        skippedIds,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Hindsight seed error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to seed Hindsight memories";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
