const q=(n,title,level,category,answer,code,tip,lab)=>({id:'b'+n,topic:'Backend',title,level,category,answer,code,tip,lab,steps:[]});
export const backendQuestions=[
q(1,'What happens during an HTTPS request?','Beginner','HTTP & APIs','For a cold HTTP/1.1 or HTTP/2 connection, the client resolves DNS, establishes TCP, negotiates TLS, and sends an HTTP request. The server routes and processes it, then returns status, headers, and a body. Connections and DNS answers may be reused. HTTP/3 uses QUIC rather than TCP.',`const response = await fetch('/api/items/7');
if (!response.ok) throw new Error(String(response.status));
const item = await response.json();`,'Distinguish receiving response headers from consuming the body.','http-request-lifecycle'),
q(2,'How do GET, POST, PUT, PATCH, and DELETE differ?','Beginner','HTTP & APIs','GET retrieves a representation. POST asks a resource to process data, often creating a subordinate resource. PUT creates or replaces the state at a known target. PATCH applies partial modifications. DELETE requests removal of the target association. Method semantics guide caching, retries, and API contracts.',`GET /items/7
POST /items
PUT /items/7
PATCH /items/7
DELETE /items/7`,'Explain behavior rather than mapping every HTTP verb directly to SQL.','http-request-lifecycle'),
q(3,'What makes an operation idempotent?','Intermediate','HTTP & APIs','Repeating an idempotent request has the same intended server effect as making it once. Responses may differ: deleting an already deleted resource can return a different status. GET, PUT, and DELETE have idempotent semantics. POST can support safe retries through an application-level idempotency key.',`POST /payments
Idempotency-Key: order-93-payment

// Store key + request fingerprint + outcome atomically.`,'A retry key needs durable coordination; an in-memory map per server is insufficient.','http-request-lifecycle'),
q(4,'When should an API return 400, 401, 403, or 404?','Beginner','HTTP & APIs','400 indicates a malformed or otherwise invalid request. 401 means valid authentication credentials are missing and includes an authentication challenge where applicable. 403 means the server refuses the action. 404 means the resource was not found or the server chooses not to disclose its existence.',`400 { "error": "invalid_request" }
401 WWW-Authenticate: Bearer
403 { "error": "forbidden" }
404 { "error": "not_found" }`,'Avoid leaking sensitive resource existence through inconsistent errors.','http-request-lifecycle'),
q(5,'What are middleware and why does their order matter?','Beginner','HTTP & APIs','Middleware forms an ordered request-processing pipeline. Each step can enrich the request, reject it, send a response, or pass control onward. Logging, authentication, authorization, parsing, and routing must run in an order that satisfies their dependencies. A path that neither responds nor continues can leave a request hanging.',`// Express-style example
app.use(requestId);
app.use(parseJson);
app.use(authenticate);
app.use('/orders', ordersRouter);
app.use(errorHandler);`,'Separate authentication from resource-specific authorization.','http-request-lifecycle'),
q(6,'How should an API validate input?','Intermediate','HTTP & APIs','Validate untrusted path parameters, query strings, headers, and bodies against an explicit schema. Check types, lengths, ranges, allowed values, and business constraints. Reject unexpected structure when appropriate. Validation does not replace parameterized queries or authorization checks.',`// Pseudocode: schema library API varies.
const input = CreateItemSchema.parse(request.body);
await createItem({ ...input, ownerId: session.userId });`,'Derive privileged fields such as owner identity from trusted context.','http-request-lifecycle'),
q(7,'How do offset and cursor pagination compare?','Intermediate','HTTP & APIs','Offset pagination is simple and supports page numbers, but large offsets can be expensive and concurrent writes can shift rows between pages. Cursor pagination continues after a stable ordering tuple and works well for changing datasets. It needs deterministic ordering and an appropriate index.',`SELECT id, created_at FROM posts
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC LIMIT 20;`,'Use a tie-breaker such as id when timestamps can repeat.','database-indexing'),
q(8,'What is the difference between authentication and authorization?','Beginner','Security','Authentication establishes an identity. Authorization decides whether that identity may perform an action on a particular resource. A valid token does not imply ownership or permission. Authorization must be enforced on the server for each protected operation.',`const user = await authenticate(request);
const order = await loadOrder(request.params.id);
if (order.ownerId !== user.id) throw forbidden();`,'Include object-level checks; checking only a role can still expose another user’s data.','jwt-authentication'),
q(9,'What does CORS protect, and what does it not protect?','Intermediate','HTTP & APIs','CORS controls whether browser scripts can read cross-origin responses and, for some requests, send them after a preflight. It is not an authentication system and does not restrict ordinary server-to-server clients. Credentialed browser requests require carefully selected origins and may also need CSRF defenses.',`Access-Control-Allow-Origin: https://app.example.test
Access-Control-Allow-Credentials: true
Vary: Origin`,'An endpoint must authorize requests even if the caller ignores browser CORS rules.','http-request-lifecycle'),
q(10,'How should a backend format and handle errors?','Intermediate','HTTP & APIs','Return a consistent machine-readable error code and appropriate status, with safe details that help clients act. Log internal context under a request ID without exposing stack traces, credentials, or database internals. Centralize unexpected-error handling and ensure the response is sent once.',`HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{ "code": "internal_error", "requestId": "req-42" }`,'Keep expected domain failures distinct from unexpected infrastructure failures.','http-request-lifecycle'),
q(11,'What is a database index?','Beginner','Databases','An index is an auxiliary structure that helps locate rows without scanning every table page. B-tree indexes commonly support equality, ordering, and range queries. Indexes consume space and must be maintained on writes; the planner may prefer a scan when a query matches many rows.',`CREATE INDEX orders_customer_idx ON orders (customer_id);
SELECT * FROM orders WHERE customer_id = $1;`,'Describe the read/write/storage tradeoff rather than saying indexes always make queries faster.','database-indexing'),
q(12,'How does a B-tree index find a value?','Intermediate','Databases','A balanced search tree uses separator keys in internal pages to select a child until a matching leaf range is reached. Leaves lead to matching entries and, when needed, table rows. High fan-out keeps tree depth small. Actual page reads depend on caching, visibility checks, and the query plan.',`-- Conceptual lookup for 42
root [30 | 60] -> middle leaf [35, 42, 51]
42 -> table row reference`,'Separate tree traversal cost from fetching all matching rows.','database-indexing'),
q(13,'Why does column order matter in a composite index?','Intermediate','Databases','A composite B-tree index orders entries lexicographically by its columns. Queries constraining leading columns often use it effectively for filtering and ordering. Later-column predicates can still help in some plans, but efficiency depends on the engine and data distribution.',`CREATE INDEX events_tenant_time_idx
ON events (tenant_id, created_at DESC);
SELECT * FROM events WHERE tenant_id = $1
ORDER BY created_at DESC LIMIT 20;`,'Design the index around actual predicates and sort order, then inspect the plan.','database-indexing'),
q(14,'How do you investigate a slow SQL query?','Intermediate','Databases','Measure latency and inspect the execution plan, row-count estimates, actual rows, loops, I/O, and waits. Look for missing indexes, poor selectivity, stale statistics, unnecessary sorts, lock waits, and over-fetching. EXPLAIN ANALYZE executes the statement, so use care with modifying queries.',`EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM orders WHERE customer_id = 42;`,'Verify the bottleneck with evidence before adding an index.','database-indexing'),
q(15,'What do ACID transactions guarantee?','Intermediate','Databases','Atomicity means a transaction’s changes commit together or are rolled back. Consistency means transactions preserve the invariants enforced by the database and application. Isolation governs interference between concurrent transactions. Durability concerns committed data surviving failures according to the database’s configuration.',`BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;
UPDATE accounts SET balance = balance + 10 WHERE id = 2;
COMMIT;`,'A transaction does not automatically validate business invariants such as sufficient funds.','database-indexing'),
q(16,'What are transaction isolation levels?','Advanced','Databases','Isolation levels define which concurrent effects a transaction may observe. Read committed generally permits a new snapshot per statement. Repeatable read provides stronger repeatability with engine-specific behavior. Serializable aims for an outcome equivalent to a serial order and may abort transactions that must then be retried.',`BEGIN ISOLATION LEVEL SERIALIZABLE;
-- Read, validate invariant, and write.
COMMIT;
-- Retry the entire transaction on serialization failure.`,'Describe anomalies and retry behavior; implementations differ across databases.','database-indexing'),
q(17,'How do optimistic and pessimistic locking differ?','Advanced','Databases','Optimistic concurrency checks a version or expected value when writing and retries or rejects conflicts. Pessimistic concurrency locks rows before changing them, making competing operations wait. Optimistic control suits low contention; locks can simplify contested changes but introduce waiting and deadlocks.',`UPDATE documents SET body = $1, version = version + 1
WHERE id = $2 AND version = $3;
-- Zero affected rows means conflict or missing record.`,'Check the affected-row count; a version predicate alone is not enough.','database-indexing'),
q(18,'What causes a deadlock and how can you reduce it?','Advanced','Databases','A deadlock occurs when transactions form a cycle of waiting for locks held by one another. Databases usually detect the cycle and abort a participant. Acquire locks in a consistent order, keep transactions short, and retry aborted work with a bounded policy.',`-- Both transfers lock account rows in ascending ID order.
SELECT id FROM accounts WHERE id IN ($1, $2)
ORDER BY id FOR UPDATE;`,'Explain both prevention and recovery; not every lock wait is a deadlock.','database-indexing'),
q(19,'What is the N+1 query problem?','Intermediate','Databases','N+1 happens when one query loads a list and another query runs for each item, causing excessive round trips. Use a join, batched lookup, or suitable eager-loading approach. Avoid replacing it with a join that unintentionally multiplies rows or transfers an enormous result.',`SELECT * FROM posts LIMIT 20;
SELECT * FROM users WHERE id = ANY($1);
-- $1 contains the distinct author IDs from the posts.`,'Measure both query count and result size.','database-indexing'),
q(20,'When should you use relational or document storage?','Intermediate','Databases','Choose based on data relationships, query patterns, consistency needs, transactions, and operational constraints. Relational storage is strong for joins and enforced relationships. Document storage can fit aggregates that are read and updated together. Both require deliberate schema and index design.',`-- Related entities benefit from enforced relationships.
CREATE TABLE orders (
  id bigint PRIMARY KEY,
  customer_id bigint REFERENCES customers(id)
);`,'Avoid claiming document databases have no schema or relational databases cannot store JSON.','database-indexing'),
q(21,'What is connection pooling?','Intermediate','Databases','A pool reuses a bounded set of database connections, avoiding repeated setup while controlling concurrency. Requests borrow and release connections. An oversized pool can overwhelm the database; an undersized pool can cause queueing. Set acquisition timeouts and ensure connections return even after errors.',`const connection = await pool.acquire();
try { return await connection.query(sql, params); }
finally { await pool.release(connection); }`,'Size pools across all application instances, not one instance in isolation.','database-indexing'),
q(22,'How do safe database migrations work?','Advanced','Databases','Plan changes so old and new application versions can coexist during rollout. Expand the schema, deploy compatible reads and writes, backfill in bounded batches, then remove obsolete structures later. Evaluate lock duration, index creation options, rollback behavior, and data verification.',`-- Expand, migrate, then contract across separate deployments.
ALTER TABLE users ADD COLUMN display_name text;
-- Backfill in batches before enforcing stronger constraints.`,'A destructive rollback may lose data; compatibility is often safer than reversing SQL.','database-indexing'),
q(23,'What is cache-aside?','Beginner','Caching','In cache-aside, the application checks the cache first. On a miss it reads the source of truth and populates the cache. Writes usually update the database and invalidate or refresh the cached copy. This improves repeated reads but allows race conditions and stale data unless explicitly handled.',`let value = await cache.get(key);
if (value === null) {
  value = await database.read(id);
  await cache.set(key, value, { ttl: 60 });
}`,'Distinguish a cache miss from a valid falsy value such as zero.','caching-strategies'),
q(24,'How do write-through and write-behind caches differ?','Intermediate','Caching','Write-through coordinates the cache write with a write to the backing store before acknowledging success. Write-behind buffers changes and persists them later, reducing write latency but risking loss or reordering without durable machinery. Failure and consistency policies determine the real guarantees.',`// Conceptual write-through contract:
await cacheLayer.writeThrough(key, value);
// Acknowledge only according to the configured persistence policy.`,'Explain what happens if the cache succeeds but the database fails.','caching-strategies'),
q(25,'What is TTL, and does it guarantee fresh data?','Beginner','Caching','A time-to-live bounds how long a cached entry is considered usable under a given policy. It does not guarantee that the value remains current during that interval. Explicit invalidation, versioning, or revalidation may be needed for stronger freshness requirements.',`Cache-Control: public, max-age=60

// Application cache example:
await cache.set('catalog:v2', catalog, { ttl: 60 });`,'Use a freshness budget based on product requirements, not an arbitrary number.','caching-strategies'),
q(26,'How do LRU and LFU eviction differ?','Intermediate','Caching','LRU favors recently accessed entries; LFU favors frequently accessed entries, often with aging so old popularity does not dominate forever. Eviction handles capacity pressure while expiration handles age. Neither policy alone ensures data correctness or freshness.',`// Capacity 2, recency oldest -> newest:
[A, B]
read(A) -> [B, A]
write(C) -> [A, C] // B evicted`,'Mention implementation cost and workload behavior, not just the policy names.','caching-strategies'),
q(27,'What is a cache stampede?','Advanced','Caching','A stampede occurs when many requests miss the same hot key and simultaneously recompute it or hit the database. Coalesce concurrent loads, use bounded locks or leases, stagger expirations, and consider serving stale data while one worker refreshes. Define behavior if refresh fails.',`// Pseudocode: coalesce loads for one key.
return singleFlight(key, async () => {
  const value = await database.read(id);
  await cache.set(key, value, { ttl: jitteredTtl() });
  return value;
});`,'A process-local single-flight helper does not coordinate multiple server instances.','caching-strategies'),
q(28,'Why is cache invalidation difficult?','Advanced','Caching','The database and cache may change independently, and concurrent readers can repopulate an outdated value after invalidation. Replicas and asynchronous events add delay and reordering. Use a consistency policy such as versioned keys, ordered invalidation, or bypassing cache for critical reads.',`// Versioned keys separate generations.
const key = 'product:' + id + ':v' + version;
await cache.set(key, product, { ttl: 120 });`,'Explain a concrete race between a reader and a writer.','caching-strategies'),
q(29,'How do ETag and conditional requests save bandwidth?','Intermediate','Caching','An ETag identifies a selected representation version. A client can send If-None-Match to ask whether its cached representation is still valid. If unchanged, the server can return 304 without the representation body. Validators must account for representation variants and authorization.',`GET /catalog
If-None-Match: "catalog-v8"

HTTP/1.1 304 Not Modified
ETag: "catalog-v8"`,'A 304 is a cache validation response, not an ordinary response carrying the JSON body.','caching-strategies'),
q(30,'What data should not go in a shared public cache?','Intermediate','Caching','Avoid sharing user-specific, confidential, or authorization-dependent responses across users without correct partitioning and policy. Cache keys must include relevant variants, and responses can use private or no-store according to their needs. Encryption in transit does not make a public cache safe for personalized content.',`// Sensitive response:
Cache-Control: no-store

// Browser-only caching where appropriate:
Cache-Control: private, max-age=30`,'Review cache key design and response headers together.','caching-strategies'),
q(31,'What is a JWT and what are its three signed-token parts?','Beginner','Security','A typical compact signed JWT contains a base64url header, payload, and signature. Claims describe facts such as subject, issuer, audience, and expiry. A signature protects integrity when correctly verified; it does not hide the payload. Encrypted JWT formats also exist and have a different structure.',`// Typical signed compact representation:
base64url(header).base64url(payload).base64url(signature)
// Payloads are readable; never include passwords.`,'Distinguish decoding from verification and signing from encryption.','jwt-authentication'),
q(32,'What must a server validate before trusting a JWT?','Intermediate','Security','Verify the signature using trusted keys and an allowed algorithm. Validate the expected issuer, audience, token type where applicable, and required time claims such as expiry. Then perform application authorization. Do not trust an unverified header to choose arbitrary algorithms or key locations.',`// Library-specific pseudocode:
verify(token, trustedKey, {
  algorithms: ['RS256'], issuer: expectedIssuer,
  audience: expectedAudience
});`,'Use a maintained library and explicit application policy.','jwt-authentication'),
q(33,'How do access tokens and refresh tokens differ?','Intermediate','Security','Access tokens authorize requests for a limited scope and lifetime. Refresh tokens obtain new access tokens and usually need stronger storage, rotation, and revocation controls because they can extend a session. They are not interchangeable, and a refresh token should not be accepted by ordinary resource endpoints.',`POST /session/refresh
// Validate refresh token, rotate it, and issue a new access token.
// Detect prohibited reuse according to the session policy.`,'Explain rotation and what happens when an old refresh token is replayed.','jwt-authentication'),
q(34,'How do sessions compare with JWT-based authentication?','Intermediate','Security','A server session commonly stores state under an opaque client identifier. A JWT can carry signed claims that an API verifies without a session lookup. Sessions simplify immediate revocation; self-contained tokens can reduce lookups but complicate revocation and stale claims. Either design can use cookies or bearer headers.',`Cookie: session=<opaque-random-id>

Authorization: Bearer <short-lived-access-token>`,'Token format and transport mechanism are separate design choices.','jwt-authentication'),
q(35,'How should a backend store passwords?','Intermediate','Security','Store a password hash produced by a purpose-built, salted, adaptive password hashing scheme such as Argon2id using a maintained library. Choose work parameters based on security guidance and measured resource limits. Never store plaintext or use a fast general-purpose hash alone.',`// Library-specific pseudocode:
const hash = await passwordHasher.hash(password);
const valid = await passwordHasher.verify(hash, candidate);`,'Do not invent salts or compare password hashes with ordinary string logic when the library handles it.','jwt-authentication'),
q(36,'How does SQL injection happen and how do you prevent it?','Intermediate','Security','SQL injection happens when untrusted input changes query syntax. Bind data through parameterized queries rather than concatenating it into SQL. Identifiers such as column names often cannot be bound as values, so select them from a strict allowlist. Use least-privilege database access as another layer.',`const result = await db.query(
  'SELECT id FROM users WHERE email = $1',
  [request.body.email]
);`,'Input validation alone does not make string-built SQL safe.','database-indexing'),
q(37,'What is CSRF and when do you need protection?','Intermediate','Security','CSRF tricks a browser into sending a state-changing request with ambient credentials such as cookies. Defenses include appropriate SameSite cookies, CSRF tokens, origin checks, and avoiding state changes through safe methods. CORS alone does not stop every cross-site request from being sent.',`Set-Cookie: session=...; Secure; HttpOnly; SameSite=Lax

// For protected writes, also validate the chosen CSRF defense.`,'Relate the defense to how credentials are attached to requests.','jwt-authentication'),
q(38,'How do you protect secrets and logs?','Intermediate','Security','Keep secrets out of source control and client bundles, inject them through controlled secret-management mechanisms, limit access, and rotate them. Log enough operational context for diagnosis while redacting credentials, bearer tokens, and sensitive personal data. Restrict and expire log access too.',`logger.info({
  requestId, route: '/orders/:id', status: 200
});
// Do not log Authorization or raw passwords.`,'Environment variables are a delivery mechanism, not a complete secret-management strategy.','jwt-authentication'),
q(39,'How can an API revoke a JWT before it expires?','Advanced','Security','A self-contained signature check alone cannot discover revocation. Options include short lifetimes, a denylist keyed by token ID, per-user session versions checked against server state, or opaque tokens with introspection. Refresh-token revocation prevents future refreshes but does not automatically invalidate issued access tokens.',`// Conceptual revocation check after normal verification:
if (await revokedTokenIds.has(claims.jti)) throw unauthorized();`,'State the availability, storage, and latency costs of the chosen method.','jwt-authentication'),
q(40,'What are RBAC and ABAC?','Intermediate','Security','Role-based access control grants permissions through roles. Attribute-based access control evaluates properties of the subject, resource, action, and environment. Real systems often combine them. Policies must also enforce tenant and object boundaries and should default to denying unsupported actions.',`const allowed = user.roles.includes('editor')
  && resource.tenantId === user.tenantId
  && resource.status !== 'locked';`,'A role check without a resource or tenant check is often incomplete.','jwt-authentication'),
q(41,'Why should an API rate-limit requests?','Beginner','Reliability & Scale','Rate limits protect capacity, reduce abuse, and enforce fair usage or product quotas. Choose identities and scopes such as user, tenant, API key, route, or carefully derived IP. Return a clear failure response and define behavior if the limiter store becomes unavailable.',`HTTP/1.1 429 Too Many Requests
Retry-After: 2
Content-Type: application/json

{ "code": "rate_limit_exceeded" }`,'Rate limiting complements capacity controls; it does not replace authentication or DDoS defenses.','rate-limiting'),
q(42,'How does a token bucket work?','Intermediate','Reliability & Scale','A token bucket refills at a configured rate up to a fixed capacity. Each accepted request consumes tokens. The rate controls sustained traffic while capacity permits bounded bursts. A request with insufficient tokens is rejected or queued according to policy.',`tokens = Math.min(capacity, tokens + elapsedSeconds * rate);
if (tokens >= 1) { tokens -= 1; return allow(); }
return reject429();`,'Use monotonic time where suitable and update shared state atomically.','rate-limiting'),
q(43,'How do fixed and sliding rate-limit windows compare?','Intermediate','Reliability & Scale','A fixed window resets a counter at aligned boundaries, which can admit two near-adjacent bursts. An exact sliding log counts timestamps within the recent interval but needs more storage and cleanup. Weighted sliding counters approximate recent traffic with less state and different precision.',`// Limit 3 per 10 seconds:
fixed: 3 at 9.9s + 3 at 10.0s may pass.
sliding log at 10.0s: prior 9.9s entries still count.`,'Separate an exact sliding log from an approximate sliding counter.','rate-limiting'),
q(44,'How do you rate-limit across multiple server instances?','Advanced','Reliability & Scale','Use a shared service or store that makes the check-and-update decision atomically. A separate read followed by write can oversubscribe under concurrency. Define key expiry, clock behavior, geographic scope, hot-key handling, and fail-open or fail-closed behavior.',`// Conceptual atomic store-side operation:
const decision = await limiter.consume({
  key: tenantId + ':search', cost: 1
});`,'Per-instance limits multiply as instances scale unless coordinated.','rate-limiting'),
q(45,'When should a client retry a failed request?','Intermediate','Reliability & Scale','Retry only failures that may be transient and only when repetition is safe or protected by idempotency. Use timeouts, bounded attempts, an overall deadline, exponential backoff, and jitter. Honor server retry guidance where appropriate. Avoid retries that amplify an overloaded service.',`delay = randomBetween(0, Math.min(cap, base * 2 ** attempt));
// Retry only while attempts and total deadline remain.
// Apply the operation's idempotency policy.`,'A timeout does not prove the server did not finish the operation.','rate-limiting'),
q(46,'What does a load balancer do?','Beginner','Reliability & Scale','A load balancer distributes connections or requests across healthy service instances. Depending on its layer, it can inspect transport information or HTTP details, terminate TLS, and apply routing policy. Health checks, connection draining, and shared-state design are essential during failures and deployments.',`Client -> Load balancer -> API A
                       -> API B
                       -> API C
// Remove unhealthy targets and drain in-flight requests.`,'Avoid relying on process-local sessions when requests may reach different instances.','http-request-lifecycle'),
q(47,'Why use a background job queue?','Intermediate','Reliability & Scale','Queues decouple request latency from slow or bursty work and let workers retry independently. Delivery commonly allows duplicates, so consumers need idempotency and bounded retries. Track poison jobs, dead-letter handling, visibility or leases, and queue age. A queue is not a guarantee that side effects happen exactly once.',`// Consumer pseudocode:
if (await alreadyProcessed(job.id)) return acknowledge(job);
await applyIdempotentOperation(job);
await acknowledge(job);`,'Coordinate deduplication with the side effect; a crash between them can still duplicate work.','http-request-lifecycle'),
q(48,'How do you keep a database write and an event consistent?','Advanced','Reliability & Scale','The transactional outbox writes business changes and an event record in the same database transaction. A relay later publishes pending events. Publication and marking can still duplicate delivery, so consumers need deduplication or idempotency. This avoids an uncoordinated database-plus-broker dual write.',`BEGIN;
INSERT INTO orders (id) VALUES ($1);
INSERT INTO outbox (event_id, payload) VALUES ($2, $3);
COMMIT;
-- Relay publishes pending outbox records.`,'Do not claim the outbox alone provides exactly-once delivery.','database-indexing'),
q(49,'How do logs, metrics, and traces complement each other?','Intermediate','Reliability & Scale','Logs record individual events, metrics aggregate numeric behavior, and traces connect operations across service boundaries. Together they help explain errors, latency, and resource saturation. Use correlation IDs, control metric-label cardinality, sample where appropriate, and avoid collecting secrets.',`request duration -> histogram
request errors   -> counter
request path     -> trace spans
request context  -> structured log with traceId`,'Start from a user-facing symptom and connect it to dependency and resource evidence.','http-request-lifecycle'),
q(50,'What are timeouts, circuit breakers, and backpressure?','Advanced','Reliability & Scale','Timeouts bound waiting. Circuit breakers temporarily reject calls to a failing dependency and probe for recovery. Backpressure prevents producers from overwhelming consumers through bounded queues, reduced intake, or explicit rejection. Coordinate these mechanisms with retries and resource limits to avoid cascading failures.',`// Conceptual dependency policy:
{ timeoutMs: 800, maxConcurrent: 40, queueCapacity: 100 }
// If saturated, reject or shed work rather than queue forever.`,'Explain how a slow dependency consumes connections and concurrency even before errors increase.','rate-limiting')
];
