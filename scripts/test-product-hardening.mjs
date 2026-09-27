/**
 * Comprehensive Product Hardening & Functional Verification Test Suite
 * Tests all end-to-end workflows, API edge cases, agent reasoning, and Hindsight memory.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function runHardeningTests() {
  console.log("=============================================================");
  console.log("RECALLOPS FULL PRODUCT HARDENING & FUNCTIONAL PASS");
  console.log(`Target Server: ${BASE_URL}`);
  console.log("=============================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ PASS: ${testName} ${details ? `(${details})` : ""}`);
    } else {
      failedTests++;
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // PART 1: API EDGE CASES & INPUT VALIDATION
  // -------------------------------------------------------------
  console.log("--- PART 1: API Edge Cases & Input Validation ---");

  // 1.1 /api/ai/test empty body
  try {
    const res = await fetch(`${BASE_URL}/api/ai/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, "POST /api/ai/test rejects empty body with 400");
  } catch (e) {
    assert(false, "POST /api/ai/test empty body threw error", e.message);
  }

  // 1.2 /api/ai/test valid call
  try {
    const res = await fetch(`${BASE_URL}/api/ai/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Verify Groq response for Checkout API diagnostic." }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && typeof data.response === "string" && data.response.length > 20, "POST /api/ai/test returns successful Groq assessment", `Model: ${data.model}, Duration: ${data.durationMs}ms`);
  } catch (e) {
    assert(false, "POST /api/ai/test valid call failed", e.message);
  }

  // 1.3 /api/memory/search empty body
  try {
    const res = await fetch(`${BASE_URL}/api/memory/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, "POST /api/memory/search rejects missing query with 400");
  } catch (e) {
    assert(false, "POST /api/memory/search empty body threw error", e.message);
  }

  // 1.4 /api/memory/search valid recall
  try {
    const res = await fetch(`${BASE_URL}/api/memory/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Redis lock contention cart service" }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Array.isArray(data.results) && data.results.length > 0, "POST /api/memory/search recalls memories from Hindsight Cloud", `Found ${data.results?.length} records in bank ${data.bankId}`);
  } catch (e) {
    assert(false, "POST /api/memory/search valid query failed", e.message);
  }

  // 1.5 /api/memory/status
  try {
    const res = await fetch(`${BASE_URL}/api/memory/status`);
    const data = await res.json();
    assert(res.status === 200 && data.connected === true && data.bankId === "shopease-incidents", "GET /api/memory/status reports active Hindsight Cloud connection", `Bank: ${data.bankId}, Total memories: ${data.totalMemories}`);
  } catch (e) {
    assert(false, "GET /api/memory/status failed", e.message);
  }

  // 1.6 /api/agent/investigate input validation
  try {
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service: "Checkout" }), // missing severity and error
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, "POST /api/agent/investigate rejects incomplete input with 400");
  } catch (e) {
    assert(false, "POST /api/agent/investigate validation threw error", e.message);
  }

  // 1.7 /api/incidents/[id]/resolve input validation
  try {
    const res = await fetch(`${BASE_URL}/api/incidents/INC-TEST/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // missing resolutionSummary
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, "POST /api/incidents/[id]/resolve rejects empty summary with 400");
  } catch (e) {
    assert(false, "POST /api/incidents/[id]/resolve validation threw error", e.message);
  }

  console.log("\n--- PART 2: End-to-End Incident Investigation Across Vector Categories ---");

  // 2.1 Checkout 503 + Redis
  try {
    console.log("Testing Scenario 1: Checkout API 503 (Redis contention)...");
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-CHECKOUT",
        service: "Checkout API",
        severity: "High",
        error: "HTTP 503 Service Unavailable",
        details: "Cart service Redis connection pool utilization reached 98% with cart locking delays.",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent successfully investigates Checkout 503", `Latency: ${data.latencyMs}ms`);
    assert(data.toolCalls && data.toolCalls.length > 0 && data.toolCalls[0].tool === "search_incident_memory", "Agent called search_incident_memory tool");
    assert(data.historicalEvidence && data.historicalEvidence.length > 0, "Agent retrieved historical incident evidence from Hindsight Cloud", `Count: ${data.historicalEvidence.length}`);
    assert(data.analysis?.likelyRootCause && data.analysis.likelyRootCause.length > 15, "Agent synthesized detailed root cause analysis");
    assert(data.analysis?.recommendedActions && data.analysis.recommendedActions.length >= 3, "Agent generated structured multi-step runbook");
  } catch (e) {
    assert(false, "Scenario 1 investigation threw error", e.message);
  }

  // 2.2 Database Hikari Pool Exhaustion
  try {
    console.log("Testing Scenario 2: PostgreSQL Hikari pool exhaustion...");
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-DB",
        service: "Database",
        severity: "Critical",
        error: "ConnectionPoolTimeoutException: HikariPool-1 - Connection is not available, request timed out after 30000ms",
        details: "Active connections: 100/100. Waiting threads: 142. Database CPU at 42%.",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent successfully investigates Database connection timeout", `Latency: ${data.latencyMs}ms`);
    assert(data.historicalEvidence && data.historicalEvidence.length > 0, "Agent retrieved database pool memory evidence");
  } catch (e) {
    assert(false, "Scenario 2 investigation threw error", e.message);
  }

  // 2.3 Auth JWT Token Desync
  try {
    console.log("Testing Scenario 3: Auth Service token verification failure...");
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-AUTH",
        service: "Authentication",
        severity: "High",
        error: "JWTVerificationException: Clock skew exceeded threshold (token nbf in future)",
        details: "Cluster NTP daemon desynchronized by 3.2 seconds across 4 worker nodes.",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent successfully investigates Auth clock skew desync", `Latency: ${data.latencyMs}ms`);
  } catch (e) {
    assert(false, "Scenario 3 investigation threw error", e.message);
  }

  console.log("\n--- PART 3: First-Principles Diagnosis on Unseen / Novel Incident ---");

  // 3.1 Completely unknown incident signature
  try {
    console.log("Testing Scenario 4: Unknown kernel socket buffer exhaustion...");
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-NOVEL",
        service: "Kernel Network Stack (Hypothetical Service)",
        severity: "Critical",
        error: "ENOSPC: No space left on device in netfilter conntrack table",
        details: "SYN flood packet rate 450k pps caused nf_conntrack: table full, dropping packet.",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent handles completely novel incident without crashing");
    assert(data.analysis?.likelyRootCause && data.analysis.likelyRootCause.length > 10, "Agent provides first-principles root cause reasoning");
    assert(data.analysis?.recommendedActions && data.analysis.recommendedActions.length >= 3, "Agent provides actionable remediation steps for novel fault");
  } catch (e) {
    assert(false, "Scenario 4 novel incident threw error", e.message);
  }

  console.log("\n--- PART 4: Resolution & Retain Loop Safety ---");

  const testIncId = `INC-HARDENING-${Date.now().toString().slice(-4)}`;
  try {
    console.log(`Resolving test incident ${testIncId}...`);
    const res = await fetch(`${BASE_URL}/api/incidents/${testIncId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolutionSummary: "Increased netfilter conntrack max to 524288 and enabled TCP syncookies.",
        mttr: "8 minutes",
        lessonsLearned: "Tune kernel network tables in base AMI before running high-throughput gateways.",
        incident: {
          id: testIncId,
          title: "Netfilter Conntrack Exhaustion",
          service: "API Gateway",
          severity: "High",
          error: "nf_conntrack: table full",
          details: "Kernel socket buffer exhaustion during high SYN packet volume.",
        },
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && data.memoryCaptured === true, "POST /api/incidents/[id]/resolve retained post-mortem into Hindsight Cloud", `Memory ID: ${data.memoryId}`);

    // Verify deduplication
    const dupRes = await fetch(`${BASE_URL}/api/incidents/${testIncId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolutionSummary: "Duplicate resolution test.",
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 200 && dupData.alreadyExists === true, "Deduplication safeguard prevents duplicate retention");
  } catch (e) {
    assert(false, "Resolution and retain safety threw error", e.message);
  }

  console.log("\n=============================================================");
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} failed)`);
  console.log("=============================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runHardeningTests().catch((err) => {
  console.error("Unhandled test execution error:", err);
  process.exit(1);
});
