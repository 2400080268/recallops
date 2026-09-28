import { HindsightClient } from "@vectorize-io/hindsight-client";

const apiKey = process.env.HINDSIGHT_API_KEY;
const baseUrl = process.env.HINDSIGHT_BASE_URL;
const bankId = process.env.HINDSIGHT_BANK_ID || "shopease-incidents";

if (!apiKey || !baseUrl) {
  console.error("Missing HINDSIGHT_API_KEY or HINDSIGHT_BASE_URL");
  process.exit(1);
}

const client = new HindsightClient({ apiKey, baseUrl });

async function cleanDemoData() {
  console.log("=============================================================");
  console.log("RECALLOPS STAGE 4 — DEMO DATA CLEANUP");
  console.log(`Target Bank: ${bankId}`);
  console.log("=============================================================\n");

  const initialDocs = await client.listDocuments(bankId, { limit: 100 });
  const initialMemories = await client.listMemories(bankId, { limit: 1 });
  console.log(`Initial Bank State: ${initialDocs.total} documents, ${initialMemories.total} memories\n`);

  const testArtifactsToDelete = [];
  const preservedCanonical = [];
  const preservedLearningLoop = [];

  for (const doc of initialDocs.items) {
    const id = doc.id;
    if (id.startsWith("INC-HARDENING-") || id.startsWith("INC-TEST-")) {
      testArtifactsToDelete.push(id);
    } else if (id.startsWith("INC-10") || id.startsWith("INC-09")) {
      if (id === "INC-1099" || id === "INC-1100") {
        preservedLearningLoop.push(id);
      } else {
        preservedCanonical.push(id);
      }
    } else {
      console.log(`[Review] Non-standard ID found: ${id}`);
      preservedCanonical.push(id);
    }
  }

  console.log(`Identified Canonical Historical Memories (${preservedCanonical.length}):`);
  console.log(" ", preservedCanonical.join(", "));

  console.log(`\nIdentified Learning Loop Demo Memories (${preservedLearningLoop.length}):`);
  console.log(" ", preservedLearningLoop.join(", "));

  console.log(`\nIdentified Test Artifacts to Delete (${testArtifactsToDelete.length}):`);
  console.log(" ", testArtifactsToDelete.join(", "));

  if (testArtifactsToDelete.length === 0) {
    console.log("\nNo test artifacts found to clean. Bank is already clean!");
    return;
  }

  console.log("\nExecuting surgical deletion of test artifacts...");
  let deletedCount = 0;
  for (const docId of testArtifactsToDelete) {
    try {
      await client.deleteDocument(bankId, docId);
      deletedCount++;
      console.log(`  ✓ Deleted test artifact: ${docId}`);
    } catch (e) {
      console.error(`  ✗ Failed to delete ${docId}:`, e.message);
    }
  }

  console.log(`\nCompleted deletion of ${deletedCount} test artifacts.`);

  // Final verification
  const finalDocs = await client.listDocuments(bankId, { limit: 100 });
  const finalMemories = await client.listMemories(bankId, { limit: 1 });

  console.log("\n=============================================================");
  console.log("CLEANUP SUMMARY");
  console.log(`Initial State: ${initialDocs.total} documents, ${initialMemories.total} memories`);
  console.log(`Final State:   ${finalDocs.total} documents, ${finalMemories.total} memories`);
  console.log(`Artifacts Removed: ${deletedCount}`);
  console.log(`Remaining Documents (${finalDocs.items.length}):`);
  finalDocs.items.forEach((d, idx) => {
    console.log(`  ${idx + 1}. ${d.id}`);
  });
  console.log("=============================================================\n");
}

cleanDemoData().catch(console.error);
