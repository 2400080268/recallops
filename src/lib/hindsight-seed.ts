import { IncidentMemory } from "./hindsight";

export const HISTORICAL_SHOP_EASE_INCIDENTS: IncidentMemory[] = [
  {
    id: "INC-1042",
    title: "Payment timeout during flash sale",
    date: "2026-08-14",
    service: "Payment",
    severity: "High",
    symptoms: "Checkout transactions failing with 504 Gateway Timeout during flash sale surge.",
    errorSignature: "HTTP 504 Gateway Timeout: HikariCP connection timeout [port:5432]",
    rootCause: "PostgreSQL connection pool exhaustion under 4.5k RPM checkout spike with default pool limit 100.",
    investigationSteps: [
      "Checked payment API gateway metrics; observed latency spike to 8.2s.",
      "Inspected pod container logs; found HikariPool connection request timeouts.",
      "Verified PostgreSQL primary database metrics; saw active backends pinned at 100/100 limit."
    ],
    failedAttempts: "Restarted payment API worker pods without increasing the connection pool. Saturated again within 30 seconds of restart.",
    successfulResolution: "Increased DB connection pool from 100 to 200 in cluster config profile and performed rolling restart of workers.",
    resolutionTime: "14 minutes",
    lessonsLearned: "Check database connection pool saturation before restarting application workers; pool limits must scale with peak concurrency.",
    recentDeployment: "db-pool-v3 applied 2 hours prior to flash sale.",
    tags: ["ConnectionPool", "HikariCP", "Postgres", "FlashSale"]
  },
  {
    id: "INC-1017",
    title: "Payment latency spike & thread stall",
    date: "2026-07-22",
    service: "Payment",
    severity: "High",
    symptoms: "Payment p99 latency escalated to 5.2s after coupon promo trigger.",
    errorSignature: "SocketTimeoutException: Read timed out during checkout payment authorization",
    rootCause: "HikariCP connection saturation caused by unindexed coupon verification query holding transactions open.",
    investigationSteps: [
      "Traced slow transactions in APM; isolated query SELECT * FROM coupons WHERE code = ?",
      "Observed transaction duration climb from 15ms to 1,200ms, consuming entire pool.",
      "Identified missing index on coupons(code) column."
    ],
    failedAttempts: "Scaled Kubernetes pod replicas from 4 to 12. This exacerbated DB server connection exhaustion and spiked lock contention.",
    successfulResolution: "Applied concurrent index on coupons(code), elevated max pool size to 250, and enabled statement cache pooling.",
    resolutionTime: "22 minutes",
    lessonsLearned: "Scaling client pods without increasing backend DB pool creates worse contention. Slow queries hold connections longer, causing artificial pool exhaustion.",
    tags: ["SlowQuery", "Indexing", "HikariCP", "Coupons"]
  },
  {
    id: "INC-1008",
    title: "Payment worker thread timeout loop",
    date: "2026-06-05",
    service: "Payment",
    severity: "Medium",
    symptoms: "Payment worker threads blocked in waiting state; new checkout requests queued indefinitely.",
    errorSignature: "PSQLException: This connection has been closed by server (keepalive probe failed)",
    rootCause: "PostgreSQL client connections fully depleted by orphan workers with unconfigured idle keepalive timeout.",
    investigationSteps: [
      "Inspected pg_stat_activity; found 85 idle-in-transaction connections with state 'idle in transaction'.",
      "Correlated with worker process memory leaks leaving unclosed socket handles."
    ],
    failedAttempts: "Manually killed PostgreSQL backend connections with pg_terminate_backend; workers immediately spawned new unclosed connections.",
    successfulResolution: "Configured idleTimeout=30000ms and maxLifetime=1800000ms in HikariCP manager and patched connection leak in payment worker loop.",
    resolutionTime: "18 minutes",
    lessonsLearned: "Worker restarts alone are insufficient when keepalive timeouts are unconfigured. Always configure idleTimeout and maxLifetime.",
    tags: ["IdleConnections", "HikariCP", "Leak", "OrphanWorkers"]
  },
  {
    id: "INC-1001",
    title: "Checkout API 503 cascading failure",
    date: "2026-05-18",
    service: "Checkout",
    severity: "Critical",
    symptoms: "Checkout API returning HTTP 503 Service Unavailable to all web and mobile shoppers.",
    errorSignature: "HTTP 503 Service Unavailable: JedisConnectionException: Could not get a resource from the pool",
    rootCause: "Cart service Redis lock contention during inventory reservation under bulk flash sale traffic.",
    investigationSteps: [
      "Edge gateway reported 42% HTTP 503 failure rate on /api/v2/checkout/complete.",
      "Examined Redis latency monitor; observed slowlog command 'KEYS cart:*' blocking single-threaded engine.",
      "Identified cart service acquiring synchronous blocking distributed locks."
    ],
    failedAttempts: "Restarted checkout gateway nodes. Failed requests immediately flooded restarted nodes and triggered cascading timeouts.",
    successfulResolution: "Replaced synchronous Redis lock loop with distributed token bucket algorithm and eliminated KEYS wildcard scanning.",
    resolutionTime: "31 minutes",
    lessonsLearned: "Implement exponential backoff with jitter on cart locks. Never use KEYS * on production Redis; use SCAN with limit.",
    tags: ["Redis", "DistributedLock", "CascadingFailure", "503"]
  },
  {
    id: "INC-0994",
    title: "Redis volatile cache saturation and eviction storm",
    date: "2026-04-11",
    service: "Redis",
    severity: "High",
    symptoms: "Customer sessions abruptly invalidated; shoppers repeatedly logged out during checkout.",
    errorSignature: "OOM command not allowed when used memory > 'maxmemory'",
    rootCause: "Unbounded cache warm cron script flooding Redis without TTL, forcing mass eviction of session tokens.",
    investigationSteps: [
      "Monitored Redis info memory metrics; used_memory reached 100% of maxmemory limit (16GB).",
      "Observed evicted_keys rate spike from 2/sec to 15,000/sec.",
      "Identified nightly product catalog cache warm job injecting entries without TTL expiration."
    ],
    failedAttempts: "Flushed all Redis databases with FLUSHALL on live primary cluster; caused total downstream database overload and 5-minute site outage.",
    successfulResolution: "Configured maxmemory-policy to volatile-lru, enforced mandatory 24-hour TTL on catalog warm entries, and isolated user sessions to separate Redis instance.",
    resolutionTime: "45 minutes",
    lessonsLearned: "Never run wholesale FLUSHALL on production cache clusters during active trading hours. Isolate session state from cache data.",
    tags: ["Redis", "OOM", "Eviction", "SessionState"]
  },
  {
    id: "INC-0982",
    title: "Authentication token signature mismatch",
    date: "2026-03-02",
    service: "Auth",
    severity: "Critical",
    symptoms: "35% of all authenticated API requests failing with HTTP 401 Unauthorized.",
    errorSignature: "HTTP 401 Unauthorized: JWT signature validation failed (kid not found in JWKS cache)",
    rootCause: "Asymmetric JWKS key rotation completed on Auth0 tenant before edge gateway proxies refreshed local key cache.",
    investigationSteps: [
      "Spike in 401 status codes immediately following scheduled auth key rotation at 02:00 UTC.",
      "Edge gateway proxy had hardcoded 12-hour cache on public verification certificates."
    ],
    failedAttempts: "Rolled back Auth0 tenant configuration, which invalidated newly signed customer tokens and locked out recent mobile users.",
    successfulResolution: "Triggered emergency JWKS key cache invalidation across all Cloudflare edge workers and updated gateway to fetch unknown kids on-demand.",
    resolutionTime: "19 minutes",
    lessonsLearned: "Key rotations must implement an overlapping dual-key grace period (24 hours) where both old and new keys remain valid.",
    tags: ["JWT", "Auth0", "EdgeGateway", "KeyRotation"]
  },
  {
    id: "INC-0975",
    title: "Search service p99 latency degradation",
    date: "2026-02-14",
    service: "Search",
    severity: "Medium",
    symptoms: "Catalog search suggestions taking over 2.4s to respond; high CPU utilization on search cluster.",
    errorSignature: "SearchPhaseExecutionException: all shards failed: CircuitBreakingException: [parent] Data too large",
    rootCause: "Unindexed regex wildcard queries on product title field bypassing Lucene inverted index.",
    investigationSteps: [
      "Elasticsearch cluster showed 98% CPU on data nodes and parent circuit breaker tripped.",
      "Query log analysis revealed mobile app client sending un-sanitized regex queries on each keystroke."
    ],
    failedAttempts: "Bumped Elasticsearch heap memory from 16GB to 32GB without fixing mapping. Shards still choked on unindexed regex evaluation.",
    successfulResolution: "Added keyword edge_ngram analyzer to product catalog index, disabled leading wildcard queries, and added 300ms debounce to search UI.",
    resolutionTime: "28 minutes",
    lessonsLearned: "Unindexed wildcard queries bypass inverted index search and scan full field values. Always use edge_ngram for search-as-you-type.",
    tags: ["Elasticsearch", "SearchLatency", "CircuitBreaker", "Wildcard"]
  },
  {
    id: "INC-0968",
    title: "Order service 500 state machine deadlock",
    date: "2026-01-20",
    service: "Orders",
    severity: "Medium",
    symptoms: "Order confirmation emails stalled; order state transition worker queue backed up with 8,400 tasks.",
    errorSignature: "HTTP 500: DeadlockDetected: Process 1492 waits for ShareLock on transaction 8891; blocked by process 1501",
    rootCause: "Celery async worker threads acquiring row-level locks on orders and inventory tables in conflicting orders.",
    investigationSteps: [
      "Worker A locked order row then waited on inventory row; Worker B locked inventory row then waited on order row.",
      "PostgreSQL deadlock detector aborted transactions after 1,000ms deadlock_timeout."
    ],
    failedAttempts: "Increased Celery concurrency setting concurrency=32. Higher worker concurrency caused 4x more deadlocks per minute.",
    successfulResolution: "Enforced strict alphabetical lock acquisition order across all order workflows (always acquire inventory lock before order lock).",
    resolutionTime: "36 minutes",
    lessonsLearned: "Inconsistent lock ordering across distributed workers causes deterministic deadlocks under load. Always acquire locks in a globally deterministic sequence.",
    tags: ["Deadlock", "Celery", "Postgres", "Orders"]
  },
  {
    id: "INC-0955",
    title: "API gateway upstream 502 bad gateway",
    date: "2025-12-08",
    service: "API Gateway",
    severity: "High",
    symptoms: "Intermittent HTTP 502 Bad Gateway responses on checkout and cart endpoints (approx 2% error rate).",
    errorSignature: "HTTP 502 Bad Gateway: upstream prematurely closed connection while reading response header",
    rootCause: "Kubernetes ingress controller keep-alive timeout (65s) was longer than backend microservice keep-alive timeout (60s).",
    investigationSteps: [
      "Gateway attempted to reuse an existing keep-alive connection right as backend microservice timed out and closed the socket.",
      "TCP FIN race condition resulted in ingress reporting premature connection closure."
    ],
    failedAttempts: "Restarted ingress controller daemonset. The 502 errors vanished for 5 minutes then resumed at identical frequency.",
    successfulResolution: "Aligned keep-alive timeouts: configured backend microservices to 75s keep-alive and ingress controller to 60s keep-alive.",
    resolutionTime: "24 minutes",
    lessonsLearned: "Upstream (backend) keep-alive timeout must ALWAYS be strictly greater than reverse-proxy keep-alive timeout to eliminate race closures.",
    tags: ["KeepAlive", "Nginx", "APIGateway", "RaceCondition"]
  },
  {
    id: "INC-0941",
    title: "Inventory reservation queue backlog lag",
    date: "2025-11-15",
    service: "Orders",
    severity: "Medium",
    symptoms: "Inventory counts failed to update in real time; overselling occurred during Black Friday launch.",
    errorSignature: "QueueBacklogWarning: RabbitMQ queue inventory.reserve message count exceeded 45,000",
    rootCause: "RabbitMQ consumer prefetch count set to 100 with varying transaction processing times, starving parallel consumers.",
    investigationSteps: [
      "Single slow payment check locked 100 prefetched inventory reservation messages behind it on a single worker node.",
      "Other 15 inventory worker nodes sat completely idle with empty queues."
    ],
    failedAttempts: "Purged queue to clear backlog; resulted in customer order loss and required manual ledger reconciliation.",
    successfulResolution: "Decreased consumer prefetch count from 100 to 5 and implemented RabbitMQ dead-letter retry routing with auto-scaled worker pool.",
    resolutionTime: "33 minutes",
    lessonsLearned: "High prefetch count starves fast consumers when message processing duration has high variance. Use low prefetch (1-10) for uneven tasks.",
    tags: ["RabbitMQ", "QueueLag", "Prefetch", "Inventory"]
  },
  {
    id: "INC-0932",
    title: "Database read replica replication lag",
    date: "2025-10-04",
    service: "Database",
    severity: "High",
    symptoms: "Catalog pricing updates took up to 15 minutes to reflect on customer store fronts.",
    errorSignature: "PostgresReplicationLag: standby_delay_seconds > 900s on replica-02",
    rootCause: "Long-running BI analytics query on read replica blocked WAL stream replay due to lock conflict on catalog tables.",
    investigationSteps: [
      "Replica WAL receiver paused replay because a 45-minute export query held an AccessShareLock on the same tables being updated.",
      "max_standby_streaming_delay was configured to unlimited in legacy config."
    ],
    failedAttempts: "Rebooted replica-02 node. On reboot, the same automated BI export script triggered again and stalled WAL replay immediately.",
    successfulResolution: "Set max_standby_streaming_delay=30s to automatically cancel conflicting queries and routed BI export jobs to dedicated analytical warehouse.",
    resolutionTime: "27 minutes",
    lessonsLearned: "Never run long-running analytics queries on transactional read replicas. Configure max_standby_streaming_delay to prevent replication freezes.",
    tags: ["Postgres", "ReplicationLag", "ReadReplica", "WAL"]
  },
  {
    id: "INC-0919",
    title: "Logistics partner webhook cascade timeout",
    date: "2025-09-12",
    service: "Orders",
    severity: "Medium",
    symptoms: "Order fulfillment service threads stalled; new shipment creations timed out after 30 seconds.",
    errorSignature: "HTTP 504: Gateway timeout calling external partner endpoint https://api.carrier-ship.com/v1/labels",
    rootCause: "Third-party logistics carrier suffered downstream outage; synchronous HTTP call in order worker thread had no client timeout configured.",
    investigationSteps: [
      "Thread dump of order fulfillment workers showed 100% of worker threads blocked in java.net.SocketInputStream.read().",
      "Underlying Apache HttpClient instance lacked connectTimeout and socketTimeout configurations."
    ],
    failedAttempts: "Disabled shipping label generation globally; halted warehouse packaging operations.",
    successfulResolution: "Configured strict 3-second client connect and socket timeouts on external partner calls and converted shipping label creation to async worker queue with exponential backoff.",
    resolutionTime: "29 minutes",
    lessonsLearned: "All third-party HTTP integrations must enforce strict connect and read timeouts (max 3-5s) and execute outside of synchronous request threads.",
    tags: ["Webhooks", "ThirdPartyOutage", "SocketTimeout", "AsyncQueue"]
  }
];
