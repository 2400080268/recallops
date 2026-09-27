import { Incident, MemoryEntry, ServiceStatus, SimulationScenario } from "@/types";

export const incidents: Incident[] = [
  {
    id: "INC-1098",
    title: "Payment Service Timeout",
    service: "Payment",
    serviceVersion: "v3.8.1 (production)",
    severity: "High",
    status: "In Progress",
    started: "2 min ago",
    duration: "8 min",
    error: "HTTP 504 Gateway Timeout",
    details: "HikariCP database connection pool exhaustion during payment settlement loop.",
    impactSeverity: "High / P1 Sev",
    sloBreachWarning: "SLO Breach Imminent",
    startedTimestamp: "Sep 27, 2026, 10:16 PM",
    elapsedSeconds: 120,
    errorSpikeRate: "+31.4% spike",
    errorBaseline: "Baseline: 0.18%",
    runtimeFaultSignature: {
      code: "HTTP 504 GATEWAY TIMEOUT",
      stackTrace: `org.postgresql.util.PSQLException: The connection attempt failed.
Caused by: java.net.SocketTimeoutException: connect timed out [port:5432]
at com.shopease.payment.db.HikariPoolManager.getConnection(HikariPoolManager.kt:142)`
    },
    recentDeployment: {
      profile: "db-pool-v4",
      cluster: "payment-primary-us-east",
      timeAgo: "18m ago",
      author: "release-bot (ArgoCD Pipeline #8942)",
      commit: "Commit a79f40e"
    },
    connectionPoolUtilization: {
      current: 98,
      max: 100,
      percentage: 98,
      available: 2,
      waitingThreads: 412
    },
    recommendedActions: [
      {
        step: 1,
        title: "Verify active DB connection saturation",
        detail: "Postgres active backend metrics confirm near-full depletion.",
        tag: "98/100 (CRITICAL)",
        tagType: "critical"
      },
      {
        step: 2,
        title: "Compare connection pool against staging baseline",
        detail: "Staging config specifies maxPoolSize=250; prod was pinned at 100 in db-pool-v4."
      },
      {
        step: 3,
        title: "Elevate pool limit to 250 connections",
        detail: "Cluster hardware headroom supports up to 450 total PostgreSQL client slots.",
        tag: "High Confidence",
        tagType: "info"
      },
      {
        step: 4,
        title: "Perform rolling restart of worker pods",
        detail: "pod/payment-worker-7f9b8 (releasing stalled threads)",
        tag: "pod/payment-worker-7f9b8",
        tagType: "info"
      },
      {
        step: 5,
        title: "Confirm error rate return to normal baseline",
        detail: "Target threshold: <0.2% total request error over 5 min sustained window."
      }
    ],
    aiAnalysis: {
      agentVersion: "RecallOps Agent v2.4",
      confidenceScore: 94,
      analysisDuration: "1.4s analysis duration",
      pipelineSteps: [
        { title: "Parsed incident telemetry, stack traces, and pod health snapshots", time: "0.2s", completed: true },
        { title: "Analyzed fault symptoms (HTTP 504 / HikariCP SocketTimeoutException)", time: "0.4s", completed: true },
        { title: "Queried organizational memory bank (vector index: shopease-incidents)", time: "0.8s", completed: true },
        { title: "Found 3 verified historical incident matches with ≥94% symptom vector match", time: "MATCH 3", completed: true },
        { title: "Synthesized root cause & validated active remediation strategy", time: "READY", completed: true }
      ],
      likelyRootCause: "Database connection pool exhaustion on primary PostgreSQL cluster",
      evidenceFoundation: "Found 3 matching incidents in ShopEase organizational memory. Every past instance with identical Hikari connection timeout logs was caused by peak traffic outstripping a pool size ≤ 100.",
      previousSuccessfulResolution: "Increase database connection pool limit from 100 to 250 in cluster config and restart affected worker pods to free orphaned socket handles.",
      historicalAntiPatternAlert: "Restarting only the API gateway or worker pods without increasing the connection pool did NOT resolve the incident in INC-1042. Connections immediately saturated within 30 seconds of restart.",
      decisionContext: "Three historical incidents with matching symptoms involved database connection saturation following traffic surges. The database cluster has ample memory headroom (38GB unallocated RAM) to support up to 450 concurrent PostgreSQL backend processes safely."
    },
    similarIncidentIds: ["INC-1042", "INC-1017", "INC-1008"]
  },
  {
    id: "INC-1097",
    title: "Orders failing (HTTP 500)",
    service: "Orders",
    serviceVersion: "v2.19.0 (production)",
    severity: "Medium",
    status: "Open",
    started: "15 min ago",
    duration: "—",
    error: "HTTP 500 Internal Server Error",
    details: "Order state machine deadlock during Celery async dispatch across payment verification.",
    impactSeverity: "Medium / P2 Sev",
    sloBreachWarning: "Elevated Error Budget Consumption",
    startedTimestamp: "Sep 27, 2026, 10:03 PM",
    elapsedSeconds: 900,
    errorSpikeRate: "+18.2% spike",
    errorBaseline: "Baseline: 0.05%",
    runtimeFaultSignature: {
      code: "HTTP 500 INTERNAL_SERVER_ERROR",
      stackTrace: `celery.exceptions.WorkerLostError: Worker process exited abruptly with exitcode 1
at com.shopease.orders.workflow.OrderStateCoordinator.commitState(OrderCoordinator.py:88)`
    },
    recentDeployment: {
      profile: "order-queue-v2",
      cluster: "order-primary-us-east",
      timeAgo: "45m ago",
      author: "ci-pipeline (GitHub Actions #3812)",
      commit: "Commit 9bf410a"
    },
    connectionPoolUtilization: {
      current: 42,
      max: 100,
      percentage: 42,
      available: 58,
      waitingThreads: 0
    },
    aiAnalysis: {
      agentVersion: "RecallOps Agent v2.4",
      confidenceScore: 89,
      analysisDuration: "1.8s analysis duration",
      pipelineSteps: [
        { title: "Parsed incident telemetry and async worker logs", time: "0.3s", completed: true },
        { title: "Identified worker deadlock in state transition lock", time: "0.5s", completed: true },
        { title: "Searched organizational memory for celery worker lost errors", time: "0.9s", completed: true },
        { title: "Retrieved similar resolution from INC-1001", time: "MATCH 1", completed: true },
        { title: "Prepared distributed lock release runbook", time: "READY", completed: true }
      ],
      likelyRootCause: "Redis lock lease expiration mismatch leading to deadlocked task queue",
      evidenceFoundation: "Matches INC-1001 where lock TTL was shorter than downstream database transaction latency.",
      previousSuccessfulResolution: "Flush stalled lock keys in Redis and bump lock lease timeout from 5s to 30s.",
      historicalAntiPatternAlert: "Do not restart PostgreSQL primary; database is healthy and bottleneck is Redis lease orchestration.",
      decisionContext: "Order dispatch tasks are currently stalled on key prefix order:lock:checkout. Redis latency remains nominal at 1.2ms."
    },
    similarIncidentIds: ["INC-1001"]
  },
  {
    id: "INC-1096",
    title: "High latency in search",
    service: "Search",
    serviceVersion: "v4.1.2 (production)",
    severity: "Medium",
    status: "In Progress",
    started: "1 hour ago",
    duration: "25 min",
    error: "Search p99 latency exceeded 2.4s",
    details: "Unindexed Elasticsearch wildcard queries causing query thread saturation.",
    impactSeverity: "Medium / P2 Sev",
    sloBreachWarning: "Customer Experience Degradation",
    startedTimestamp: "Sep 27, 2026, 09:18 PM",
    elapsedSeconds: 3600,
    errorSpikeRate: "+12.5% latency increase",
    errorBaseline: "Baseline: 65ms",
    runtimeFaultSignature: {
      code: "SEARCH_QUERY_TIMEOUT_EXCEEDED",
      stackTrace: `org.elasticsearch.action.search.SearchPhaseExecutionException: all shards failed
at org.elasticsearch.search.SearchService.execute(SearchService.java:312)`
    },
    similarIncidentIds: ["INC-1017"]
  },
  {
    id: "INC-1095",
    title: "Database connection errors",
    service: "Database",
    serviceVersion: "PostgreSQL 16.2-cluster",
    severity: "Low",
    status: "Resolved",
    started: "2 hours ago",
    duration: "12 min",
    error: "Connection pool saturation warning",
    details: "Transient connection spike due to batch analytics query running during sales campaign.",
    impactSeverity: "Low / P3 Sev",
    startedTimestamp: "Sep 27, 2026, 08:18 PM",
    errorSpikeRate: "+4.1% spike",
    similarIncidentIds: ["INC-1042", "INC-1008"]
  },
  {
    id: "INC-1094",
    title: "Authentication failures",
    service: "Auth",
    serviceVersion: "v2.5.0 (production)",
    severity: "High",
    status: "Resolved",
    started: "3 hours ago",
    duration: "18 min",
    error: "HTTP 401 Unauthorized Burst",
    details: "Asymmetric JWT public key cache desynchronization across edge ingress gateway.",
    impactSeverity: "High / P1 Sev",
    startedTimestamp: "Sep 27, 2026, 07:18 PM",
    errorSpikeRate: "+28.7% spike",
    similarIncidentIds: ["INC-0982"]
  }
];

export const services: ServiceStatus[] = [
  { name: "API Gateway", status: "Healthy", latency: "28ms", latencyNum: 28, loadPercentage: 28 },
  { name: "Payment Service", status: "Healthy", latency: "142ms", latencyNum: 142, loadPercentage: 72 },
  { name: "Order Service", status: "Healthy", latency: "84ms", latencyNum: 84, loadPercentage: 45 },
  { name: "Search Service", status: "Healthy", latency: "65ms", latencyNum: 65, loadPercentage: 36 },
  { name: "Database (Primary)", status: "Healthy", latency: "4ms", latencyNum: 4, loadPercentage: 12 },
  { name: "Redis Cache", status: "Healthy", latency: "1.2ms", latencyNum: 1.2, loadPercentage: 6 }
];

export const simulationScenarios: SimulationScenario[] = [
  {
    id: "checkout-503",
    title: "Checkout API 503",
    description: "Simulate checkout service failures with upstream cascading timeouts and thread starvation.",
    service: "Checkout",
    severity: "High",
    badgeTag: "HTTP 503",
    errorSignature: "HTTP 503 Service Unavailable",
    icon: "shopping_cart_checkout",
    targetService: "Checkout (API Gateway)",
    region: "US-East (Primary VPC)",
    injectionWindow: "30 minutes (Standard Drill)",
    incidentBrief: "Checkout API begins returning HTTP 503 responses with elevated Redis connection usage and threadpool starvation.",
    activeModifiers: {
      latency: true,
      mockFeedback: true,
      triggerPagerDuty: true
    },
    liveImpact: {
      vectorSignature: "SHA-256: 8f4e..901c",
      target: "Checkout (v2.14.0)",
      cluster: "prod-vpc-us-east-1",
      peakErrorFrequency: "Peak: 42.8%",
      projectedDegradations: [
        {
          title: "HTTP 503 Service Unavailable",
          description: "Spiking to ~42% failure rate on `/api/v2/checkout/complete`",
          type: "error"
        },
        {
          title: "Redis Pool Starvation: 94% Bound",
          description: "Jedis connection wait queues exceeding timeout thresholds",
          type: "warning"
        },
        {
          title: "P99 Latency: 85ms → 2,840ms",
          description: "Thread pool backlog cascade into upstream reverse proxies",
          type: "warning"
        },
        {
          title: "Client Blast: Infinite Cart Spinner",
          description: "Estimated 1,420 checkout attempts halted per minute",
          type: "info"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-8821",
        matchDate: "Nov 2024",
        confidence: "98.4% Confidence"
      }
    }
  },
  {
    id: "payment-timeout",
    title: "Payment Gateway Timeout",
    description: "Simulate payment processing delays, degraded webhook receipt, and third-party gateway stalls.",
    service: "Payment",
    severity: "Critical",
    badgeTag: "p99 > 5.2s",
    errorSignature: "HTTP 504 Gateway Timeout",
    icon: "credit_card",
    targetService: "Payment Service",
    region: "US-East (Primary VPC)",
    injectionWindow: "20 minutes (Targeted Stress)",
    incidentBrief: "Simulate payment processing delays, degraded webhook receipt, and third-party gateway stalls with pool saturation.",
    activeModifiers: {
      latency: true,
      mockFeedback: false,
      triggerPagerDuty: true
    },
    liveImpact: {
      vectorSignature: "SHA-256: a12b..44c9",
      target: "Payment (v3.8.1)",
      cluster: "prod-vpc-us-east-1",
      peakErrorFrequency: "Peak: 38.5%",
      projectedDegradations: [
        {
          title: "HikariCP Connection Pool Exhaustion",
          description: "Active connections hit 98/100 limit; queuing 412 threads",
          type: "error"
        },
        {
          title: "Stripe Webhook Receipt Degraded",
          description: "Inbound webhook acknowledgment latency spikes above 5s threshold",
          type: "warning"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-1042",
        matchDate: "Aug 2026",
        confidence: "97.1% Confidence"
      }
    }
  },
  {
    id: "db-failure",
    title: "Database Conn Failure",
    description: "Simulate connection pool starvation and hard connection limit exhaustion on primary PostgreSQL cluster.",
    service: "Postgres",
    severity: "Critical",
    badgeTag: "Pool 100%",
    errorSignature: "PSQLException: Connection limit reached",
    icon: "database",
    targetService: "Database (Primary PostgreSQL)",
    region: "US-East (Primary VPC)",
    injectionWindow: "15 minutes",
    incidentBrief: "PostgreSQL active connection slots saturated by runaway worker processes.",
    activeModifiers: {
      latency: true,
      mockFeedback: true,
      triggerPagerDuty: true
    },
    liveImpact: {
      vectorSignature: "SHA-256: 77f9..db01",
      target: "PostgreSQL 16 Primary",
      cluster: "prod-db-us-east-1",
      peakErrorFrequency: "Peak: 55.0%",
      projectedDegradations: [
        {
          title: "Max Connections Maxed (100/100)",
          description: "New backend connection requests rejected with FATAL error",
          type: "error"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-1008",
        matchDate: "May 2026",
        confidence: "96.5% Confidence"
      }
    }
  },
  {
    id: "redis-exhaustion",
    title: "Redis Conn Exhaustion",
    description: "Simulate volatile cache saturation, key eviction cascades, and synchronous blocking calls.",
    service: "Cache",
    severity: "High",
    badgeTag: "OOM Risk",
    errorSignature: "OOM command not allowed when used memory > 'maxmemory'",
    icon: "memory",
    targetService: "Redis Cache Cluster",
    region: "US-East (Primary VPC)",
    injectionWindow: "25 minutes",
    incidentBrief: "Redis memory utilization exceeds 95% with high key eviction rate.",
    activeModifiers: {
      latency: true,
      mockFeedback: false,
      triggerPagerDuty: false
    },
    liveImpact: {
      vectorSignature: "SHA-256: 3c4d..fa88",
      target: "Redis Cluster v7.2",
      cluster: "prod-cache-us-east-1",
      peakErrorFrequency: "Peak: 29.4%",
      projectedDegradations: [
        {
          title: "Eviction Storm: 12,000 keys/sec",
          description: "Session tokens prematurely purged triggering auth renegotiation",
          type: "warning"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-0994",
        matchDate: "Apr 2026",
        confidence: "94.2% Confidence"
      }
    }
  },
  {
    id: "order-500",
    title: "Order Service 500",
    description: "Simulate internal order state machine deadlock and Celery async worker queue lockups.",
    service: "Orders",
    severity: "Medium",
    badgeTag: "Deadlock",
    errorSignature: "HTTP 500 Internal Order Failure",
    icon: "receipt_long",
    targetService: "Order Service",
    region: "US-East (Primary VPC)",
    injectionWindow: "30 minutes",
    incidentBrief: "Order workflow state machines freeze during lock acquisition on inventory reservation.",
    activeModifiers: {
      latency: false,
      mockFeedback: true,
      triggerPagerDuty: false
    },
    liveImpact: {
      vectorSignature: "SHA-256: d881..104b",
      target: "Order Engine (v2.19.0)",
      cluster: "prod-vpc-us-east-1",
      peakErrorFrequency: "Peak: 18.2%",
      projectedDegradations: [
        {
          title: "Celery Queue Backlog: 8,400 messages",
          description: "Order confirmation emails and push notifications delayed > 15m",
          type: "warning"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-1001",
        matchDate: "Mar 2026",
        confidence: "91.8% Confidence"
      }
    }
  },
  {
    id: "auth-failure",
    title: "Authentication Failure",
    description: "Simulate asymmetric JWT signing key desync and mass customer session invalidation loops.",
    service: "Auth0/IdP",
    severity: "Critical",
    badgeTag: "HTTP 401",
    errorSignature: "HTTP 401 Signature Verification Failed",
    icon: "key",
    targetService: "Authentication Service",
    region: "Global Edge Ingress",
    injectionWindow: "15 minutes",
    incidentBrief: "Edge gateways reject valid user session tokens due to outdated public key cache.",
    activeModifiers: {
      latency: false,
      mockFeedback: true,
      triggerPagerDuty: true
    },
    liveImpact: {
      vectorSignature: "SHA-256: e92a..61ff",
      target: "Auth Service (v2.5.0)",
      cluster: "edge-global",
      peakErrorFrequency: "Peak: 64.0%",
      projectedDegradations: [
        {
          title: "Mass Logout Event: 45,000 sessions",
          description: "Logged-in shoppers forced to re-authenticate across web and mobile",
          type: "error"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-0982",
        matchDate: "Feb 2026",
        confidence: "99.1% Confidence"
      }
    }
  },
  {
    id: "search-latency",
    title: "Search Latency Spike",
    description: "Simulate unindexed Elasticsearch query storm causing 2.4s p99 latency across product catalog.",
    service: "Catalog",
    severity: "Medium",
    badgeTag: "2.4s p99",
    errorSignature: "SearchPhaseExecutionException Timeout",
    icon: "manage_search",
    targetService: "Search & Catalog Service",
    region: "US-East (Primary VPC)",
    injectionWindow: "45 minutes",
    incidentBrief: "Product search auto-suggest spikes to 2.4s response time under wildcard regex queries.",
    activeModifiers: {
      latency: true,
      mockFeedback: false,
      triggerPagerDuty: false
    },
    liveImpact: {
      vectorSignature: "SHA-256: 41ee..99aa",
      target: "Elasticsearch 8.11 Cluster",
      cluster: "prod-search-us-east-1",
      peakErrorFrequency: "Peak: 12.0%",
      projectedDegradations: [
        {
          title: "P99 Latency Degradation",
          description: "Catalog queries crawl from 65ms baseline to 2.4s",
          type: "warning"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-1017",
        matchDate: "Jul 2026",
        confidence: "95.0% Confidence"
      }
    }
  },
  {
    id: "custom",
    title: "Custom Incident",
    description: "Craft a custom simulated scenario with arbitrary payload injection, container faults, and custom blast radius.",
    service: "Configurable",
    severity: "High",
    badgeTag: "Manual Fault",
    errorSignature: "Custom Chaos Injection Event",
    icon: "tune",
    targetService: "Custom Selected Service",
    region: "US-East (Primary VPC)",
    injectionWindow: "Custom Drill",
    incidentBrief: "Custom chaos vector with user-specified blast radius and injection parameters.",
    activeModifiers: {
      latency: true,
      mockFeedback: true,
      triggerPagerDuty: false
    },
    liveImpact: {
      vectorSignature: "SHA-256: custom..0000",
      target: "User Defined",
      cluster: "sandbox-isolated",
      peakErrorFrequency: "Configurable",
      projectedDegradations: [
        {
          title: "Custom Blast Radius",
          description: "Synthetic fault injection under controlled sandbox parameters",
          type: "info"
        }
      ],
      historicalCorrelation: {
        matchId: "INC-GENERIC",
        matchDate: "N/A",
        confidence: "User Defined"
      }
    }
  }
];

export const memoryEntries: MemoryEntry[] = [
  {
    id: "INC-1042",
    title: "Payment timeout during flash sale",
    service: "Payment",
    category: "Payment",
    age: "3 weeks ago",
    similarity: "97%",
    matchPercentage: "97% Match",
    rootCause: "Database pool exhaustion under 4.5k RPM checkout spike",
    resolution: "Increased DB pool 100 → 200, restarted worker pods",
    failedAttempts: "Restarting only the API gateway or worker pods without increasing the connection pool did NOT resolve the issue. Connections saturated within 30 seconds of restart.",
    lesson: "Check database saturation before restarting services; connection pool limits must scale with expected peak checkout concurrency.",
    relatedIncidents: ["INC-1098", "INC-1008"],
    usageCount: 3,
    mttr: "14 mins",
    resolvedBy: "alex.m@shopease",
    symptoms: "HTTP 504 Gateway Timeout, HikariPool-1 - Connection is not available, request timed out after 30000ms."
  },
  {
    id: "INC-1017",
    title: "Payment latency spike & thread stall",
    service: "Payment",
    category: "Payment",
    age: "2 months ago",
    similarity: "95%",
    matchPercentage: "95% Match",
    rootCause: "HikariCP connection saturation after bulk coupon cron trigger",
    resolution: "Elevated max pool size & enabled statement cache pooling",
    failedAttempts: "Scaled Kubernetes pod replicas from 4 to 12. This exacerbated DB server connection exhaustion.",
    lesson: "Connection saturation can appear as latency before hard failures begin. Scaling client pods without increasing backend DB pool creates worse contention.",
    relatedIncidents: ["INC-1098", "INC-1096"],
    usageCount: 2,
    mttr: "22 mins",
    resolvedBy: "sarah.k@shopease",
    symptoms: "p99 latency escalated to 5.2s, PostgreSQL client connections maxed out, query queue depth > 300."
  },
  {
    id: "INC-1008",
    title: "Payment worker thread timeout loop",
    service: "Payment",
    category: "Database",
    age: "4 months ago",
    similarity: "94%",
    matchPercentage: "94% Match",
    rootCause: "PostgreSQL client connections fully depleted by orphan workers",
    resolution: "Rebooted worker pods + tuned pool keepalive and timeout limits",
    failedAttempts: "Killed PostgreSQL backend queries manually; workers reconnected immediately and exhausted pool again.",
    lesson: "Worker restarts alone are insufficient when keepalive timeouts are unconfigured. Always configure idleTimeout and maxLifetime.",
    relatedIncidents: ["INC-1098", "INC-1042"],
    usageCount: 4,
    mttr: "18 mins",
    resolvedBy: "devon.t@shopease",
    symptoms: "Idle-in-transaction connections accumulating without closing, socket write timeout."
  },
  {
    id: "INC-1001",
    title: "Checkout API 503 cascading timeout",
    service: "Checkout",
    category: "Orders",
    age: "5 months ago",
    similarity: "91%",
    matchPercentage: "91% Match",
    rootCause: "Cart service Redis lock contention during inventory reservation",
    resolution: "Replaced synchronous Redis lock loop with distributed token bucket algorithm",
    failedAttempts: "Restarted checkout gateway nodes; failed requests immediately flooded API upon restart.",
    lesson: "Implement exponential backoff with jitter on cart locks to prevent thundering herd crashes.",
    relatedIncidents: ["INC-1097"],
    usageCount: 2,
    mttr: "31 mins",
    resolvedBy: "elena.r@shopease",
    symptoms: "HTTP 503 Service Unavailable, JedisConnectionException: Could not get a resource from the pool."
  },
  {
    id: "INC-0994",
    title: "Redis volatile cache saturation and eviction storm",
    service: "Redis",
    category: "Redis",
    age: "6 months ago",
    similarity: "89%",
    matchPercentage: "89% Match",
    rootCause: "Unbounded cache warm cron script flooding Redis without TTL",
    resolution: "Configured maxmemory-policy to allkeys-lru and enforced mandatory TTL on warm entries",
    failedAttempts: "Flushed all Redis databases on live primary cluster; caused total downstream database overload.",
    lesson: "Never run wholesale FLUSHALL on production cache clusters during active trading hours.",
    relatedIncidents: [],
    usageCount: 1,
    mttr: "45 mins",
    resolvedBy: "marcus.v@shopease",
    symptoms: "OOM command not allowed when used memory > 'maxmemory', cache eviction rate spiked 100x."
  },
  {
    id: "INC-0982",
    title: "Authentication token signature mismatch",
    service: "Auth",
    category: "Authentication",
    age: "7 months ago",
    similarity: "93%",
    matchPercentage: "93% Match",
    rootCause: "Asymmetric JWKS key rotation completed on IdP before edge proxies refreshed keyset",
    resolution: "Triggered emergency JWKS key cache invalidation across all Cloudflare edge workers",
    failedAttempts: "Rolled back Auth0 tenant configuration which invalidated already renewed mobile client tokens.",
    lesson: "Key rotations must implement a 24-hour overlapping dual-key grace period before deprecation.",
    relatedIncidents: ["INC-1094"],
    usageCount: 2,
    mttr: "19 mins",
    resolvedBy: "priya.n@shopease",
    symptoms: "HTTP 401 Unauthorized spike across 35% of all incoming mobile checkout requests."
  }
];

export const memoryStats = {
  totalMemories: 47,
  recurringPatterns: 12,
  validatedFixes: 8,
  servicesRepresented: 7,
  weeklyGrowth: [
    { label: "W1", count: 28 },
    { label: "W2", count: 33 },
    { label: "W3", count: 39 },
    { label: "W4", count: 42 },
    { label: "W5", count: 45 },
    { label: "W6", count: 47 }
  ]
};