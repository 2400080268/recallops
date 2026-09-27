/**
 * Stage 9 — RecallOps AI Intelligence & Quality Verification Test Suite
 * Tests multi-incident pattern detection, grouping, evidence-based confidence,
 * "why" rationales, novel incident handling, contradictory memory handling,
 * and recency prioritization.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

async function runStage9Tests() {
  console.log("=============================================================");
  console.log("STAGE 9 — RECALLOPS AI INTELLIGENCE & QUALITY VERIFICATION");
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
  // TEST A: CHECKOUT API 503 + REDIS CONTENTION
  // -------------------------------------------------------------
  console.log("--- TEST A: Checkout API 503 + Redis Contention (Multi-Incident Pattern) ---");
  try {
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-CHECKOUT-REDIS",
        service: "Checkout API",
        severity: "High",
        error: "HTTP 503 Service Unavailable: JedisConnectionException: Could not get a resource from the pool",
        details: "Cart service Redis connection pool utilization reached 98% with cart key locking delays during flash sale traffic.",
      }),
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent responded with 200 OK");
    assert(data.historicalEvidence && data.historicalEvidence.length >= 2, "Multiple relevant historical memories recalled", `Count: ${data.historicalEvidence?.length}`);
    
    // Check recurring pattern detection
    const patterns = data.analysis?.recurringPatterns || data.recurringPatterns || [];
    assert(patterns.length >= 1 && patterns[0].toLowerCase().includes("redis"), "Recurring Redis contention pattern detected across multiple memories", `Pattern: "${patterns[0]}"`);

    // Check What Worked Before
    const whatWorked = data.analysis?.whatWorkedBefore || data.whatWorkedBefore || [];
    assert(whatWorked.length >= 1, "Successful fixes identified from past post-mortems", `Count: ${whatWorked.length}, e.g. ${whatWorked[0]?.action?.slice(0, 50)}`);

    // Check What Failed Before
    const whatFailed = data.analysis?.whatFailedBefore || data.whatFailedBefore || [];
    assert(whatFailed.length >= 1, "Failed troubleshooting attempts (anti-patterns) identified", `Count: ${whatFailed.length}, e.g. ${whatFailed[0]?.action?.slice(0, 50)}`);

    // Check High Confidence based on evidence
    const conf = data.analysis?.confidenceAssessment || data.confidenceAssessment;
    assert(conf?.level === "high" && conf.score >= 90, "High confidence assigned based on multiple agreeing memories", `Level: ${conf?.level}, Score: ${conf?.score}%`);

    // Check Recommendation Reasons
    const reasons = data.analysis?.recommendationReasons || data.recommendationReasons || [];
    assert(reasons.length >= 2, "Recommendations contain evidence-grounded 'Why' rationales", `First reason: "${reasons[0]?.why}"`);
  } catch (e) {
    assert(false, "TEST A failed with error", e.message);
  }

  // -------------------------------------------------------------
  // TEST B: PAYMENT TIMEOUT + DATABASE POOL EXHAUSTION
  // -------------------------------------------------------------
  console.log("\n--- TEST B: Payment Gateway Timeout + Database Pool Exhaustion ---");
  try {
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-PAYMENT-DB",
        service: "Payment",
        severity: "High",
        error: "HTTP 504 Gateway Timeout: HikariCP connection timeout [port:5432]",
        details: "Active PostgreSQL connection pool at 100/100 limit, 180 threads waiting.",
      }),
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent responded with 200 OK");
    assert(data.historicalEvidence?.some((e) => e.incidentId === "INC-1042" || e.rootCause.toLowerCase().includes("connection pool")), "Recalled historical Hikari pool exhaustion post-mortem (INC-1042 / INC-1017)");
    assert(data.analysis?.previousSuccessfulResolution?.toLowerCase().includes("pool") || data.analysis?.likelyRootCause?.toLowerCase().includes("pool"), "Identified verified database pool remediation runbook");
  } catch (e) {
    assert(false, "TEST B failed with error", e.message);
  }

  // -------------------------------------------------------------
  // TEST C: NOVEL INCIDENT (NO FABRICATED MEMORY)
  // -------------------------------------------------------------
  console.log("\n--- TEST C: Novel Incident (Truthful First-Principles Reasoning) ---");
  try {
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-NOVEL-XYZ",
        service: "Quantum Flux Mesh Router",
        severity: "Critical",
        error: "E_SUBATOMIC_ENTANGLEMENT_DESYNC: Phase coherence dropped below 0.001 pico-kelvin",
        details: "Unseen optical transport degradation across hypothetical dark fiber link.",
      }),
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent handled completely novel incident cleanly");
    
    // Must communicate absence of historical evidence truthfully
    const isNovelFlag = data.analysis?.isNovel || data.isNovel;
    const foundationText = data.analysis?.evidenceFoundation || "";
    assert(isNovelFlag === true || foundationText.toLowerCase().includes("no closely matching") || foundationText.toLowerCase().includes("first-principles"), "Truthfully acknowledges no closely matching historical memory exists");
    
    // Confidence must NOT be high
    const conf = data.analysis?.confidenceAssessment || data.confidenceAssessment;
    assert(conf?.level === "low" || (conf?.score && conf.score <= 65), "Confidence is appropriately Low/Conservative for novel fault", `Score: ${conf?.score}%, Level: ${conf?.level}`);
    
    // No invented patterns
    const patterns = data.analysis?.recurringPatterns || data.recurringPatterns || [];
    assert(patterns.length === 0, "Does not hallucinate or invent recurring patterns for novel fault");
  } catch (e) {
    assert(false, "TEST C failed with error", e.message);
  }

  // -------------------------------------------------------------
  // TEST D: CONTRADICTORY HISTORICAL EVIDENCE HANDLING
  // -------------------------------------------------------------
  console.log("\n--- TEST D: Contradictory Historical Evidence Handling ---");
  try {
    // When an incident matches both INC-1042 (which scaled pool) and INC-1017 (which warned scaling workers/pool exacerbated lock contention without indexing)
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-CONTRADICTION",
        service: "Payment",
        severity: "High",
        error: "HikariCP pool saturation with lock contention and coupon query slowdown",
        details: "High concurrency spike. Pod scaling initiated but database lock contention escalated.",
      }),
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent responded with 200 OK");
    
    // Check if contradiction or caveats are flagged
    const hasContradiction = data.analysis?.hasContradictoryEvidence ?? false;
    const caveats = data.analysis?.caveats || [];
    assert(hasContradiction === true || caveats.length > 0, "Agent recognizes contrasting remediation outcomes / operational caveats", `Contradiction: ${hasContradiction}, Caveats: ${caveats.length}`);
  } catch (e) {
    assert(false, "TEST D failed with error", e.message);
  }

  // -------------------------------------------------------------
  // TEST E: RECENTLY LEARNED MEMORY PRIORITIZATION
  // -------------------------------------------------------------
  console.log("\n--- TEST E: Recently Learned Memory Prioritization ---");
  try {
    const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incidentId: "INC-TEST-RECENT-EVAL",
        service: "Checkout API",
        severity: "High",
        error: "HTTP 503 Service Unavailable with Redis connection pool exhaustion",
        details: "Cart service lock timeouts during peak traffic surge.",
      }),
    });

    const data = await res.json();
    assert(res.status === 200 && data.success === true, "Agent responded with 200 OK");
    
    // Check if INC-1099 or recently learned memory is identified
    const recent = data.analysis?.mostRecentEvidence || data.historicalEvidence?.find((e) => e.incidentId === "INC-1099" || e.age?.includes("September 28, 2026") || e.age?.includes("Recently"));
    assert(recent !== undefined, "Agent identified and prioritized recently retained incident (INC-1099)", `Recent: ${recent?.id || recent?.incidentId}, Age: ${recent?.age}`);
  } catch (e) {
    assert(false, "TEST E failed with error", e.message);
  }

  // -------------------------------------------------------------
  // TEST F: DUPLICATE MEMORY PREVENTION
  // -------------------------------------------------------------
  console.log("\n--- TEST F: Duplicate Memory Prevention ---");
  try {
    const testId = "INC-TEST-DUP-STAGE9";
    const res1 = await fetch(`${BASE_URL}/api/incidents/${testId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolutionSummary: "First resolution pass.",
        mttr: "10 minutes",
        lessonsLearned: "First pass lesson.",
        incident: {
          id: testId,
          service: "Search",
          severity: "Medium",
          error: "Index latency spike",
        },
      }),
    });
    const data1 = await res1.json();
    assert(res1.status === 200 && data1.success === true, "First resolution retained post-mortem into Hindsight Cloud");

    // Second call with same ID
    const res2 = await fetch(`${BASE_URL}/api/incidents/${testId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolutionSummary: "Duplicate resolution pass.",
      }),
    });
    const data2 = await res2.json();
    assert(res2.status === 200 && data2.alreadyExists === true, "Second resolution safely detects duplicate and does not duplicate retain");
  } catch (e) {
    assert(false, "TEST F failed with error", e.message);
  }

  console.log("\n=============================================================");
  console.log(`STAGE 9 TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} failed)`);
  console.log("=============================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStage9Tests().catch((err) => {
  console.error("Unhandled test execution error:", err);
  process.exit(1);
});
