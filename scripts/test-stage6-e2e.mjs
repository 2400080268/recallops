// test-stage6-e2e.mjs
// Verifies Stage 6 complete workflow & agent investigate API

const BASE_URL = "http://localhost:3001";

async function runTests() {
  console.log("=== STAGE 6 COMPLETE END-TO-END VERIFICATION ===\n");

  // Test 1: Check Simulator page
  console.log("Test 1: GET /simulator");
  const simRes = await fetch(`${BASE_URL}/simulator`);
  console.log(`Simulator status: ${simRes.status} (expected: 200)`);
  if (simRes.status !== 200) throw new Error("Simulator page failed");

  // Test 2: Check Dashboard & Incidents page
  console.log("\nTest 2: GET /dashboard and GET /incidents");
  const dashRes = await fetch(`${BASE_URL}/dashboard`);
  const incRes = await fetch(`${BASE_URL}/incidents`);
  console.log(`Dashboard status: ${dashRes.status} (expected: 200)`);
  console.log(`Incidents status: ${incRes.status} (expected: 200)`);
  if (dashRes.status !== 200 || incRes.status !== 200) throw new Error("Dashboard or Incidents page failed");

  // Test 3: Check dynamic incident page routing
  console.log("\nTest 3: GET /incidents/INC-1099 (Dynamic simulated incident route)");
  const dynamicIncRes = await fetch(`${BASE_URL}/incidents/INC-1099`);
  console.log(`Dynamic incident status: ${dynamicIncRes.status} (expected: 200)`);
  if (dynamicIncRes.status !== 200) throw new Error("Dynamic incident route failed");

  // Test 4: Trigger real RecallOps Agent Investigation for simulated incident
  console.log("\nTest 4: POST /api/agent/investigate (Simulated Incident INC-1099)");
  console.log("Simulating: Checkout API HTTP 503 with Redis / Hikari connection pool exhaustion");

  const start = Date.now();
  const agentRes = await fetch(`${BASE_URL}/api/agent/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incidentId: "INC-1099",
      service: "Checkout API",
      severity: "Critical",
      error: "HTTP 503 Service Unavailable - Redis connection saturation",
      details: "Checkout API returning HTTP 503 errors under peak shopping traffic surge. Redis pool and Hikari connection limit reached.",
    }),
  });

  const duration = Date.now() - start;
  console.log(`Agent response status: ${agentRes.status} (${duration}ms)`);
  const data = await agentRes.json();

  if (!data.success) {
    throw new Error(`Agent investigation failed: ${data.error}`);
  }

  console.log("\n--- Investigation Results Received ---");
  console.log(`Incident ID: ${data.incidentId}`);
  console.log(`Model: ${data.model}`);
  console.log(`Latency: ${data.latencyMs}ms`);
  console.log(`Tool Calls: ${data.toolCalls.length}`);
  if (data.toolCalls.length > 0) {
    console.log(`  - Tool: ${data.toolCalls[0].tool}`);
    console.log(`  - Query: "${data.toolCalls[0].query}"`);
    console.log(`  - Recalled: ${data.toolCalls[0].resultCount} historical incident memories`);
  }
  console.log(`Likely Root Cause:\n  ${data.analysis.likelyRootCause}`);
  console.log(`Confidence Score: ${data.analysis.confidenceScore}%`);
  console.log(`Verified Runbook:\n  ${data.analysis.previousSuccessfulResolution}`);
  console.log(`Historical Anti-Pattern:\n  ${data.analysis.historicalAntiPatternAlert}`);
  console.log(`Historical Evidence Count: ${data.historicalEvidence.length}`);
  if (data.historicalEvidence.length > 0) {
    console.log(`  - Memory 1: ${data.historicalEvidence[0].incidentId} (${data.historicalEvidence[0].title})`);
  }
  console.log(`Recommended Actions: ${data.analysis.recommendedActions.length} steps synthesized`);

  console.log("\n=== ALL STAGE 6 VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
