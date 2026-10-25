// Deterministic HTTP teaching scenarios. Times and packets are illustrative.
const msg=(from,to,label,detail='',kind='normal')=>({from,to,label,detail,kind});
const stage=(name,detail)=>({name,detail});
const frame=(line,note,active,fields,messages=[],elapsed=0)=>({line,note,active,fields,messages,elapsed});
const roundStages=[stage('DNS','resolve host'),stage('TCP','3-way handshake'),stage('TLS','1.3, 1 RTT'),stage('REQUEST','GET /items/7'),stage('SERVER','route + query'),stage('RESPONSE','200 OK')];
const serverStages=[stage('LISTENER','parse request'),stage('LOGGER','app.use'),stage('EXPRESS.JSON','body parser'),stage('AUTH','bearer token'),stage('ROUTER','GET /items/:id'),stage('HANDLER','await db.query'),stage('RESPONSE','res.json')];
const errorStages=[stage('LISTENER','parse request'),stage('AUTH','bearer token'),stage('ROUTER','match route'),stage('HANDLER','try / await'),stage('DATABASE','findItem'),stage('ERROR HANDLER','(err, req, res, next)'),stage('RESPONSE','status + body')];
const urlFields=[['SCHEME','https'],['HOST','api.example.test'],['PORT','443 (HTTPS default)'],['PATH','/items/7']];
const requestFields=[['REQUEST','GET /items/7 HTTP/1.1'],['HOST','api.example.test'],['ACCEPT','application/json'],['AUTHORIZATION','Bearer <demo-token>']];
const requestObject=[['METHOD','GET'],['PATH','/items/7'],['HEADERS.HOST','api.example.test'],['HEADERS.AUTHORIZATION','Bearer <demo-token>'],['BODY','undefined']];
const packets=[msg(0,1,'A? api.example.test','DNS lookup'),msg(1,0,'A 203.0.113.7','TTL 300 s'),msg(0,2,'SYN','destination port 443'),msg(2,0,'SYN-ACK','acknowledge client'),msg(0,2,'ACK','TCP connection open'),msg(0,2,'ClientHello','SNI, key share, ALPN'),msg(2,0,'ServerHello','certificate, Finished'),msg(0,2,'Finished','TLS session established'),msg(0,2,'GET /items/7','encrypted HTTP request'),msg(2,0,'200 OK','JSON response')];
const empty=frame(0,'Press Play or Step to begin.',-1,[],[],null);
export const httpScenarios=[{
 id:'round-trip',name:'Full round trip',tag:'round trip',pipelineTitle:'Pipeline',fieldsTitle:'Headers',lanes:['Browser','DNS','Server'],stages:roundStages,
 code:`const url = 'https://api.example.test/items/7';

const response = await fetch(url, {
  headers: {
    Accept: 'application/json',
    Authorization: 'Bearer <demo-token>',
  },
});

console.log(response.status);
console.log(response.headers.get('content-type'));

const item = await response.json();
console.log(item.name);`.split('\n'),
 frames:[empty,
 frame(3,'Parse the URL and return a pending promise. No HTTP request has been sent yet.',-1,urlFields,[],0),
 frame(3,'Resolve the hostname. This cold-connection example needs a DNS lookup.',0,[...urlFields,['DNS','lookup pending']],packets.slice(0,1),10),
 frame(3,'The resolver replies with an IP address that can be cached according to its TTL.',0,[['HOST','api.example.test'],['ADDRESS','203.0.113.7'],['TTL','300 seconds']],packets.slice(0,2),20),
 frame(3,'Open TCP with SYN, SYN-ACK, and ACK. The stream is reliable and ordered.',1,[['DESTINATION','203.0.113.7:443'],['TRANSPORT','TCP'],['STATE','connection established']],packets.slice(0,5),50),
 frame(3,'Start TLS negotiation with supported protocols and a key share.',2,[['TLS','1.3'],['SNI','api.example.test'],['ALPN','http/1.1 (this example)']],packets.slice(0,6),65),
 frame(3,'Validate the certificate and finish negotiating session keys.',2,[['CERTIFICATE','trusted chain + hostname match'],['TLS','encrypted channel established']],packets.slice(0,8),80),
 frame(4,'Prepare request headers. The demonstration token is a placeholder, not a usable credential.',3,requestFields,packets.slice(0,8),80),
 frame(3,'Send the GET request through the protected connection to the server.',3,requestFields,packets.slice(0,9),95),
 frame(3,'The server validates access, matches the route, and awaits the database query.',4,[['ROUTE','GET /items/:id'],['PARAMS.ID','7'],['AUTH','validated (illustrative)'],['DATABASE','SELECT id, name FROM items WHERE id = $1']],packets.slice(0,9),110),
 frame(3,'Serialize the result and send the status, headers, and JSON body.',5,[['STATUS','200 OK'],['CONTENT-TYPE','application/json; charset=utf-8'],['CACHE-CONTROL','private, max-age=0'],['BODY','{"id":7,"name":"Notebook"}']],packets,125),
 frame(10,'Headers arrive and the fetch promise resolves with a Response. Body consumption is still separate.',5,[['RES.STATUS','200'],['RES.OK','true'],['CONTENT-TYPE','application/json; charset=utf-8'],['CONNECTION','available for reuse']],packets,125),
 frame(14,'Read and parse the JSON stream, then log the item name. Warm connections can skip the earlier handshakes.',6,[['RES.STATUS','200'],['CONTENT-TYPE','application/json; charset=utf-8'],['ITEM.NAME','Notebook'],['CONSOLE','200 → application/json; charset=utf-8 → Notebook']],packets,125)]
},{
 id:'inside-server',name:'Inside the server',tag:'inside the server',pipelineTitle:'Middleware Chain',fieldsTitle:'Request Object',lanes:['Client','Server','Database'],stages:serverStages,
 code:`const app = express();
app.use(logger);
app.use(express.json());
app.use(authenticate);

app.get('/items/:id', async (req, res, next) => {
  try {
    const item = await db.query(
      'SELECT id, name FROM items WHERE id = $1',
      [req.params.id],
    );
    res.status(200).json(item);
  } catch (error) { next(error); }
});
app.listen(3000);`.split('\n'),
 frames:[empty,
 frame(15,'The HTTP listener parses bytes into a request object and starts the registered middleware chain.',0,requestObject,[msg(0,1,'GET /items/7','connection accepted')],0),
 frame(2,'The logger records request metadata and calls next(). Middleware order determines what runs next.',1,[...requestObject,['REQUEST ID','req-demo-7']],[msg(0,1,'GET /items/7','connection accepted')],0.2),
 frame(3,'The JSON parser handles matching JSON bodies. This GET has no body to parse.',2,requestObject,[msg(0,1,'GET /items/7','no body')],0.4),
 frame(4,'Authentication validates the credential and attaches trusted identity to the request.',3,[...requestObject,['USER.ID','user-7']],[msg(0,1,'GET /items/7','identity verified')],1),
 frame(6,'The router matches the method and path, extracts params, and calls the handler.',4,[...requestObject,['USER.ID','user-7'],['PARAMS.ID','7']],[msg(0,1,'GET /items/7','matched /items/:id')],1.2),
 frame(8,'The handler sends a parameterized query and suspends at await.',5,[...requestObject,['PARAMS.ID','7'],['HANDLER','waiting for query']],[msg(0,1,'GET /items/7'),msg(1,2,'SELECT … WHERE id = $1','parameters: [7]')],2),
 frame(8,'Other work can proceed while I/O is pending. Await suspends this handler, not the entire server.',5,[['CONNECTION #1','awaiting database'],['EVENT LOOP','available for other I/O'],['PARAMS.ID','7']],[msg(0,1,'GET /items/7'),msg(1,2,'SELECT … WHERE id = $1','parameters: [7]')],8),
 frame(12,'The database result resolves the promise and the handler resumes.',5,[['PARAMS.ID','7'],['ITEM','{ id: 7, name: Notebook }']],[msg(0,1,'GET /items/7'),msg(1,2,'SELECT … WHERE id = $1'),msg(2,1,'1 row','{ id: 7, name: Notebook }')],16),
 frame(12,'res.json serializes the response body and sets its content type.',6,[['RES.STATUS','200'],['CONTENT-TYPE','application/json; charset=utf-8'],['BODY','{"id":7,"name":"Notebook"}']],[msg(0,1,'GET /items/7'),msg(1,2,'SELECT … WHERE id = $1'),msg(2,1,'1 row'),msg(1,0,'200 OK','JSON body')],17),
 frame(14,'The response completes. The middleware chain must not try to send a second response.',7,[['RES.STATUS','200'],['HEADERS SENT','true'],['HANDLER','complete']],[msg(0,1,'GET /items/7'),msg(1,2,'SELECT … WHERE id = $1'),msg(2,1,'1 row'),msg(1,0,'200 OK','response finished')],18)]
},{
 id:'status-codes',name:'Errors and status codes',tag:'status codes',pipelineTitle:'Middleware Chain',fieldsTitle:'Response',lanes:['Client','Server','Database'],stages:errorStages,
 code:`app.get('/items/:id', async (req, res, next) => {
  try {
    const item = await db.findItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (error) { next(error); }
});
// Authentication may stop a request before its handler.
app.get('/old-items/:id', (req, res) => {
  res.redirect(301, '/items/' + req.params.id);
});
app.use((error, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' });
});`.split('\n'),
 frames:[empty,
 frame(3,'404 example: a valid request reaches the database, but no item has the requested ID.',4,[['STATUS','not sent yet']],[msg(0,1,'GET /items/999','valid token'),msg(1,2,'findItem(999)'),msg(2,1,'null','no matching row')]),
 frame(4,'The handler deliberately returns a not-found response. This is not a database failure.',6,[['STATUS','404 Not Found'],['CONTENT-TYPE','application/json'],['BODY','{"error":"Not found"}']],[msg(0,1,'GET /items/999'),msg(1,0,'404 Not Found','JSON error','error')]),
 frame(4,'fetch still resolves for HTTP 404. The client must inspect status or ok.',7,[['RES.STATUS','404'],['RES.OK','false'],['FETCH PROMISE','fulfilled with Response']],[msg(0,1,'GET /items/999'),msg(1,0,'404 Not Found','check response.ok','error')]),
 frame(8,'401 example: authentication rejects a missing or invalid token before database access.',1,[['STATUS','401 Unauthorized'],['WWW-AUTHENTICATE','Bearer'],['DATABASE','not called']],[msg(0,1,'GET /items/7','invalid token'),msg(1,0,'401 Unauthorized','authentication challenge','error')]),
 frame(8,'The early response stops the ordinary route and handler from running.',6,[['RES.STATUS','401'],['RES.OK','false'],['HANDLER','skipped']],[msg(0,1,'GET /items/7','invalid token'),msg(1,0,'401 Unauthorized','no database query','error')]),
 frame(3,'500 example: the database operation rejects instead of returning a missing record.',4,[['STATUS','not sent yet'],['DATABASE','connection failure']],[msg(0,1,'GET /items/7'),msg(1,2,'findItem(7)'),msg(2,1,'query rejected','connection error','error')]),
 frame(6,'The catch forwards the error to error-handling middleware.',5,[['ERROR','forwarded using next(error)'],['INTERNAL DETAIL','kept out of client response']],[msg(0,1,'GET /items/7'),msg(2,1,'query rejected','forwarded to error handler','error')]),
 frame(13,'Send a generic 500 response while recording internal diagnostics securely.',6,[['STATUS','500 Internal Server Error'],['CONTENT-TYPE','application/json'],['BODY','{"error":"Internal Server Error"}']],[msg(0,1,'GET /items/7'),msg(1,0,'500 Internal Server Error','safe error body','error')]),
 frame(10,'301 example: a legacy URL redirects to the current resource URL.',6,[['STATUS','301 Moved Permanently'],['LOCATION','/items/7']],[msg(0,1,'GET /old-items/7'),msg(1,0,'301 Moved Permanently','Location: /items/7','redirect')]),
 frame(10,'By default, fetch follows the redirect and sends a request to the new URL.',2,[['REDIRECT POLICY','follow (default)'],['NEXT REQUEST','GET /items/7']],[msg(0,1,'GET /old-items/7'),msg(1,0,'301','Location: /items/7','redirect'),msg(0,1,'GET /items/7','follow redirect')]),
 frame(5,'The redirected request succeeds and returns the item.',6,[['STATUS','200 OK'],['CONTENT-TYPE','application/json'],['BODY','{"id":7,"name":"Notebook"}']],[msg(0,1,'GET /old-items/7'),msg(1,0,'301','Location: /items/7','redirect'),msg(0,1,'GET /items/7'),msg(1,0,'200 OK','JSON item')]),
 frame(5,'The final Response reports the destination URL and redirected=true. HTTP failures are distinct from rejected network requests.',7,[['RES.STATUS','200'],['RES.OK','true'],['RES.REDIRECTED','true'],['RES.URL','https://api.example.test/items/7']],[msg(0,1,'GET /old-items/7'),msg(1,0,'301','redirect','redirect'),msg(0,1,'GET /items/7'),msg(1,0,'200 OK','final response')])]
}];

// Branches that respond early must not look as though skipped middleware ran.
const statusScenario=httpScenarios.find(s=>s.id==='status-codes');
statusScenario.frames.forEach((frame,index)=>{
  if(index>=1&&index<=3)frame.skipped=[5];
  if(index===4||index===5)frame.skipped=[2,3,4,5];
  if(index>=9)frame.skipped=[5];
});
