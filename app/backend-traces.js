// Original backend teaching models: no external requests, databases, or real credentials.
const f=(line,note,panels={},diagram=[],output=[],extra={})=>({line,note,panels,diagram,output,...extra});
const n=(label,state='idle')=>({label,state});
const scene=(id,title,code,frames,takeaway,source)=>({id,title,topic:'Backend',language:'Backend / pseudocode',code:code.split('\n'),frames:[f(0,'Ready. Predict the request or data flow, then step through the system.'),...frames],takeaway,source});
export const backendTraces=[
scene('http-request-lifecycle','HTTP Request Lifecycle',`const response = await fetch('https://api.example.test/items/7');
if (!response.ok) throw new Error('Request failed');
const item = await response.json();
// Server pipeline (illustrative):
// parse → authenticate → route → database → serialize`,[
f(1,'For this cold HTTPS connection, resolve the hostname before connecting.',{'DNS':['api.example.test → example IP','cached answers may skip this lookup']},[n('Browser','active'),n('DNS','active'),n('Server'),n('Database')]),
f(1,'Establish a TCP connection, then negotiate TLS for this HTTP/1.1 example.',{'Transport':['TCP: SYN → SYN-ACK → ACK'],'TLS':['verify certificate and negotiate keys'],'Protocol note':['HTTP/3 uses QUIC rather than TCP']},[n('Browser','active'),n('TCP / TLS','active'),n('Server'),n('Database')]),
f(1,'Send the method, target, and headers over the encrypted connection.',{'Request':['GET /items/7 HTTP/1.1','Host: api.example.test','Accept: application/json']},[n('Browser','done'),n('HTTPS request','active'),n('Server'),n('Database')]),
f(5,'Middleware checks the request before the handler reads the database.',{'Server pipeline':['parse request','authenticate / authorize','route GET /items/:id'],'Validation':['id = 7 accepted']},[n('Browser','done'),n('Middleware','active'),n('Handler'),n('Database')]),
f(5,'Awaiting asynchronous database I/O yields this handler without blocking other I/O.',{'Database query':['SELECT id, name FROM items WHERE id = $1','parameter: 7'],'Handler':['waiting for database']},[n('Browser','done'),n('Server','done'),n('Handler','active'),n('Database','active')]),
f(1,'Serialize the result and return response headers and a body.',{'Response':['200 OK','Content-Type: application/json'],'Body':['{ "id": 7, "name": "Notebook" }']},[n('Browser'),n('Response','active'),n('Server','done'),n('Database','done')]),
f(2,'fetch resolves when headers are available; HTTP errors still require an explicit status check.',{'Client':['response.ok = true'],'Connection':['can be reused if still available']},[n('Browser','active'),n('Response headers','done'),n('Server','done')],['HTTP 200']),
f(3,'Reading the JSON body is a separate asynchronous operation.',{'Client value':['item = { id: 7, name: Notebook }'],'Failure paths':['network failure → rejected fetch','404 / 500 → fulfilled response with ok=false']},[n('Browser','done'),n('JSON body','done'),n('Server','done')],['HTTP 200','Notebook'])], 'A request crosses transport, server, and storage boundaries; receiving headers and reading the body are distinct steps.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview'),
scene('database-indexing','Database Indexing',`SELECT name FROM users WHERE id = 42;
-- Compare a full scan with a B-tree index:
CREATE INDEX users_id_idx ON users (id);
-- Conceptual index pages: [30 | 60]
-- Children: [1..29] [30..59] [60..99]
INSERT INTO users (id, name) VALUES (43, 'Mira');`,[
f(1,'Without a useful index, a full scan tests each row against the predicate.',{'Full scan':['id 4: miss','id 17: miss','id 25: miss'],'Work':['rows examined: 3 so far']},[n('Table scan','active'),n('4 → 17 → 25','done'),n('42 → 68 → 91')]),
f(1,'The scan finds 42 but may continue unless the plan can stop early.',{'Full scan':['42 found; result = Nova'],'Cost model':['work grows with scanned table pages']},[n('Table scan','done'),n('id 42','done')],['Nova']),
f(3,'An index maintains a separate ordered search structure and row references.',{'B-tree root':['separator keys: 30 | 60'],'Child ranges':['less than 30','30 through 59','60 and above']},[n('Root [30 | 60]','active'),n('Leaf [4,17,25]'),n('Leaf [35,42,51]'),n('Leaf [68,91]')]),
f(4,'Compare 42 with the separator keys and follow the middle child.',{'Comparisons':['42 ≥ 30','42 < 60'],'Index page visits':['root → middle leaf']},[n('Root [30 | 60]','done'),n('Leaf [4,17,25]'),n('Leaf [35,42,51]','active'),n('Leaf [68,91]')]),
f(1,'Find the key in the leaf and follow its row reference.',{'Leaf lookup':['42 → row reference'],'Table fetch':['name = Nova'],'Cost model':['tree traversal plus matching rows; not a benchmark']},[n('Leaf key 42','done'),n('Row reference','active'),n('Table row: Nova','done')],['Nova']),
f(6,'An insert changes the table and every applicable index.',{'Write work':['insert table row 43','insert index entry 43'],'Tradeoff':['extra storage and maintenance','planner may still prefer a scan']},[n('New table row 43','done'),n('Index leaf insert','active'),n('Possible page split')],['Nova','Table + index maintained'])], 'Indexes can reduce read work, but consume storage and add write maintenance; query selectivity and the plan matter.', 'https://www.postgresql.org/docs/current/indexes-intro.html'),
scene('caching-strategies','Caching Strategies',`const key = 'item:7';
let value = await cache.get(key);
if (value == null) {
  value = await database.read(7);
  await cache.set(key, value, { ttl: 60 });
}
// Writes: update DB and invalidate, or coordinate write-through.
// Capacity policy: evict least recently used (LRU).`,[
f(2,'Cache-aside first checks the cache. This key is absent.',{'Cache lookup':['item:7 → MISS'],'Database':['item:7 = version 1']},[n('Client','active'),n('Cache MISS','miss'),n('Database')],[],{cache:[]}),
f(4,'On a miss, fetch the authoritative record.',{'Database read':['version 1'],'Read latency':['database path (illustrative)']},[n('Client'),n('Cache','miss'),n('Database','active')],[],{cache:[]}),
f(5,'Populate the cache with a TTL, then return the value.',{'TTL':['60 seconds from insertion'],'Value':['version 1']},[n('Database','done'),n('Cache SET','active'),n('Client','done')],['version 1'],{cache:[{key:'item:7',value:'v1',status:'fresh · 60s TTL'}]}),
f(2,'A second request hits the cache and avoids a database read.',{'Cache lookup':['item:7 → HIT'],'Database':['not consulted']},[n('Client','active'),n('Cache HIT','done'),n('Database skipped')],['version 1'],{cache:[{key:'item:7',value:'v1',status:'hit'}]}),
f(7,'If a database write does not update or invalidate the cache, the cached copy can be stale.',{'Database':['version 2'],'Cache':['still version 1'],'Consistency':['stale read possible']},[n('Writer','active'),n('Database v2','done'),n('Cache v1','miss')],['stale: version 1'],{cache:[{key:'item:7',value:'v1',status:'stale'}]}),
f(7,'Cache-aside writers can invalidate after a successful database write. Concurrent reads still need a consistency policy.',{'Write policy':['commit database v2','delete cache key'],'Next read':['miss → fetch v2']},[n('Database v2','done'),n('Invalidate cache','active'),n('Next reader')],[],{cache:[]}),
f(7,'A write-through cache coordinates writing the cache and backing store; failures require a defined recovery policy.',{'Write-through':['write through cache to store'],'Failure policy':['avoid acknowledging inconsistent success']},[n('Writer','active'),n('Cache v3','done'),n('Database v3','done')],['version 3'],{cache:[{key:'item:7',value:'v3',status:'fresh'}]}),
f(5,'TTL expiry makes an entry unavailable even if capacity remains.',{'Time':['advance beyond configured TTL'],'Next lookup':['MISS; reload from database']},[n('Clock','active'),n('Cache expired','miss'),n('Database reload')],[],{cache:[{key:'item:7',value:'v3',status:'expired'}]}),
f(8,'With capacity two, reading A makes B least recently used.',{'Capacity':['2 entries'],'Recency':['A most recent → B least recent']},[n('Read A','done'),n('A MRU','done'),n('B LRU')],[],{cache:[{key:'A',value:'1',status:'most recent'},{key:'B',value:'2',status:'least recent'}]}),
f(8,'Inserting C evicts B under LRU. Eviction and TTL solve different problems.',{'LRU eviction':['B removed'],'Remaining':['A, C']},[n('Insert C','active'),n('Evict B','miss'),n('A + C','done')],[],{cache:[{key:'A',value:'1',status:'retained'},{key:'C',value:'3',status:'most recent'}]})], 'Cache-aside, write-through, TTL, and LRU address different read, write, freshness, and capacity tradeoffs.', 'https://redis.io/docs/latest/develop/use/client-side-caching/'),
scene('jwt-authentication','JWT Authentication',`// Use a maintained JWT library; never hand-roll verification.
const token = sign(claims, signingKey, { algorithm: 'RS256' });
// Client: Authorization: Bearer <token>
const verifiedClaims = verify(token, publicKey, {
  algorithms: ['RS256'], issuer: 'example-api', audience: 'example-app'
});
// Enforce expiry and authorize access to the requested resource.`,[
f(2,'After credentials are validated, issue a signed token with bounded claims.',{'Header':['alg = RS256','typ = JWT'],'Payload':['sub = user-7','iss = example-api','aud = example-app','exp = future timestamp']},[n('Login verified','done'),n('Issuer signs','active'),n('Client')],[],{tokenState:'issued'}),
f(3,'A typical signed JWT has three base64url parts. Encoding does not encrypt its claims.',{'Token parts':['header . payload . signature'],'Visibility':['payload is readable','never place passwords in claims']},[n('Header','done'),n('Payload','done'),n('Signature','done')],[],{tokenState:'encoded'}),
f(4,'The API verifies using a trusted key and an explicit algorithm allowlist.',{'Verification':['algorithm allowed','signature valid'],'Trust':['do not choose arbitrary keys from untrusted token input']},[n('Bearer token','active'),n('Verifier','active'),n('Protected route')],[],{tokenState:'verifying'}),
f(7,'Check issuer, audience, time claims, then resource permissions.',{'Claims validation':['issuer matches','audience matches','not expired'],'Authorization':['user-7 may read this resource']},[n('Signature valid','done'),n('Claims valid','done'),n('Authorized','done')],['200 OK'],{tokenState:'accepted'}),
f(7,'An expired token is rejected even when its signature is valid.',{'Alternate request':['now ≥ exp'],'Result':['401 Unauthorized','client needs fresh authentication / refresh policy']},[n('Signature valid','done'),n('Expired','miss'),n('Reject','miss')],['401: expired'],{tokenState:'expired'}),
f(4,'Changing the payload without the signing key invalidates the signature.',{'Alternate request':['sub altered in token'],'Result':['signature verification fails','do not use unverified claims']},[n('Tampered payload','miss'),n('Signature invalid','miss'),n('Reject','miss')],['401: invalid token'],{tokenState:'tampered'})], 'A signed JWT authenticates claims only after signature and claim validation; authorization and revocation remain separate concerns.', 'https://datatracker.ietf.org/doc/html/rfc8725'),
scene('rate-limiting','Rate Limiting',`// Token bucket: capacity 3, refill 1 token / second.
refill = Math.min(capacity, tokens + elapsed * rate);
if (refill >= 1) { tokens = refill - 1; allow(); }
else { reject(429, { 'Retry-After': '1' }); }
// Fixed window: count requests in each aligned window.
// Sliding log: count timestamps in the trailing interval.`,[
f(1,'Start with three tokens. A request needs one.',{'Policy':['capacity = 3','refill = 1 token / second'],'Clock':['t = 0']},[n('Request'),n('Token bucket','active'),n('API')],[],{bucket:{tokens:3,capacity:3}}),
f(3,'Accept the first request and consume a token.',{'Request':['#1 at t=0'],'Decision':['ALLOW']},[n('Request #1','active'),n('Consume token','done'),n('API 200','done')],['#1 → 200'],{bucket:{tokens:2,capacity:3}}),
f(3,'Two more immediate requests use the remaining tokens.',{'Requests':['#2 and #3 at t=0'],'Decision':['both allowed']},[n('Requests #2, #3','done'),n('Bucket empty','active'),n('API 200','done')],['#1 → 200','#2 → 200','#3 → 200'],{bucket:{tokens:0,capacity:3}}),
f(4,'A fourth immediate request is rejected; no token remains.',{'Request':['#4 at t=0'],'Response':['429 Too Many Requests','Retry-After: 1']},[n('Request #4','active'),n('No token','miss'),n('429','miss')],['#4 → 429'],{bucket:{tokens:0,capacity:3}}),
f(2,'After one second, refill one token without exceeding capacity.',{'Clock':['t = 1 second'],'Refill':['min(3, 0 + 1 × 1) = 1']},[n('Clock +1s','active'),n('One token','done'),n('API')],[],{bucket:{tokens:1,capacity:3}}),
f(3,'A retry consumes the refilled token and succeeds.',{'Request':['#5 at t=1'],'Decision':['ALLOW']},[n('Retry','active'),n('Consume token','done'),n('API 200','done')],['#5 → 200'],{bucket:{tokens:0,capacity:3}}),
f(5,'Fixed window, limit 3 per 10 seconds: three requests at 9.9 seconds fill the first window.',{'Algorithm':['fixed aligned window'],'Window [0,10)':['count = 3 / 3']},[n('t=9.9s burst','active'),n('Window [0,10)','done'),n('3 allowed','done')]),
f(5,'At 10 seconds the counter resets, allowing another burst near the boundary.',{'Window [10,20)':['count = 3 / 3'],'Boundary effect':['6 allowed requests within a short interval']},[n('t=10.0s burst','active'),n('New window','done'),n('3 more allowed','done')]),
f(6,'A sliding log with the same trailing interval still counts the earlier three requests.',{'Algorithm':['exact sliding log'],'Trailing interval':['previous 10 seconds'],'Recent timestamps':['9.9, 9.9, 9.9'],'Decision':['request at 10.0 rejected']},[n('New request','active'),n('Trailing log full','miss'),n('429','miss')],['Sliding log → 429']),
f(6,'Distributed limiters need atomic shared decisions and a trustworthy client identity.',{'Deployment':['atomic shared store operation','consistent key and clock policy'],'Failure policy':['explicit fail-open or fail-closed choice']},[n('API instance A','active'),n('Shared atomic limiter','done'),n('API instance B','active')])], 'Token buckets permit bounded bursts; fixed windows have boundary bursts; sliding windows track recent traffic more closely.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429')
];
