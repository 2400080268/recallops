

const BASE_URL = "http://localhost:3001";

async function profileIncident(name, payload) {
  console.log(`\n=============================================================`);
  console.log(`PROFILING: ${name}`);
  console.log(`=============================================================`);

  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}/api/agent/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const totalTime = Date.now() - t0;
  const data = await res.json();

  console.log(`Total Response Status: ${res.status}`);
  console.log(`Total Wall-Clock Latency: ${totalTime}ms`);
  console.log(`Agent Reported Latency: ${data.latencyMs}ms`);
  console.log(`Model: ${data.model}`);
  console.log(`Evidence items count: ${data.historicalEvidence?.length || 0}`);
  console.log(`Timeline steps count: ${data.timeline?.length || 0}`);
  console.log(`Tool calls count: ${data.toolCalls?.length || 0}`);
  
  if (data.toolCalls) {
    data.toolCalls.forEach((tc, idx) => {
      console.log(`  Tool Call #${idx + 1}: ${tc.tool}`);
      console.log(`    Query: "${tc.query}"`);
      console.log(`    Result Count: ${tc.resultCount}`);
      console.log(`    Duration: ${tc.durationMs}ms`);
    });
  }

  return { totalTime, toolCalls: data.toolCalls?.length || 0 };
}

async function run() {
  // Scenario 1: Checkout 503
  await profileIncident("Scenario 1: Checkout API 503", {
    service: "checkout-api",
    severity: "Critical",
    error: "HTTP 503 Service Unavailable - Redis connection timeout",
    details: "Checkout API pods reporting connection pool exhaustion to Redis cart cluster.",
  });

  // Scenario 2: Postgres pool timeout
  await profileIncident("Scenario 2: Database Pool Timeout", {
    service: "orders-db",
    severity: "Critical",
    error: "Connection acquisition timeout - HikariCP pool exhausted",
    details: "PostgreSQL active connections at 100% capacity.",
  });

  // Scenario 3: Auth NTP Clock Skew
  await profileIncident("Scenario 3: Auth Clock Skew", {
    service: "auth-service",
    severity: "High",
    error: "JWT token validation failure - signature invalid or token expired prematurely",
    details: "Nodes in us-east-1 az2 experiencing time drift exceeding 5000ms due to NTP daemon synchronization failure.",
  });
}

run().catch(console.error);
