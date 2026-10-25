import {E,S,tree,table,queue,stack,log,phase,dom,memory,timeline} from './scenario-kit';
export const reactExamples={
 'virtual-dom':[
E('Simple Element',`function Greeting() {
  return <article><h2>Hello</h2><p>Welcome.</p></article>;
}
root.render(<Greeting />);`,[S(4,'React resolves the component into element descriptions.',{vdom:tree('Greeting','  article'),calls:log('Greeting()')}),S(2,'JSX becomes runtime calls. Here createElement shows the conceptual equivalent.',{vdom:tree('article','  h2: Hello','  p: Welcome.'),calls:log('createElement(h2, null, Hello)','createElement(p, null, Welcome.)','createElement(article, null, …children)')}),S(4,'Commit browser elements matching the description.',{dom:dom('Hello','Welcome.')})]),
E('Nested Components',`function Title() { return <h2>Notebook</h2>; }
function Page() { return <main><Title /><p>Notes</p></main>; }
root.render(<Page />);`,[S(3,'Begin with a component element rather than a browser node.',{vdom:tree('Page'),calls:log('createElement(Page)')}),S(2,'Call Page and discover the nested Title component.',{vdom:tree('Page','  main','    Title','    p: Notes'),calls:log('Page()','createElement(Title)','createElement(main, …)')}),S(1,'Resolve Title into its host element.',{vdom:tree('main','  h2: Notebook','  p: Notes'),calls:log('Page()','Title()','createElement(h2, null, Notebook)')}),S(3,'Commit the resolved host tree.',{dom:dom('Notebook','Notes')})]),
E('Dynamic Props',`function Greeting({ name }) { return <h2>Hello, {name}</h2>; }
root.render(<Greeting name="Mira" />);
root.render(<Greeting name="Nova" />);`,[S(2,'Render with the initial props.',{vdom:tree('Greeting name=Mira','  h2: Hello, Mira'),calls:log('Greeting({name: Mira})'),dom:dom('Hello, Mira')}),S(3,'A new element carries new props into the next render.',{vdom:tree('Greeting name=Nova','  h2: Hello, Nova [changed]'),calls:log('Greeting({name: Nova})'),dom:dom('Hello, Mira','Previous commit remains visible during calculation.')}),S(1,'Commit only the needed host text change.',{dom:dom('Hello, Nova')})])],
reconciliation:[
E('Same Element Type',`// Before:
<button className="quiet">Save</button>
// After:
<button className="primary">Save</button>`,[S(2,'The committed tree contains a button.',{previous:tree('button class=quiet','  text: Save'),next:tree(),operations:log()}),S(4,'The new description has the same host element type.',{next:tree('button class=primary [changed]','  text: Save'),operations:log('Match button → button','Keep the existing DOM node')}),S(4,'Update the differing attribute; preserve the text node.',{operations:log('UPDATE class: quiet → primary','REUSE button and text')})]),
E('Different Element Type',`// Before:
<section><Counter /></section>
// After:
<article><Counter /></article>`,[S(2,'The original subtree is mounted under section.',{previous:tree('section','  Counter: count=3'),next:tree(),operations:log()}),S(4,'The root host type changes.',{next:tree('article [new]','  Counter: fresh state'),operations:log('Different type: section → article')}),S(4,'Replace the old subtree and remount descendants.',{operations:log('REMOVE section subtree','INSERT article subtree','Counter state initializes again')})]),
E('Key-Based List',`// Previous keys: a, b, c
// Next keys: c, a, b
items.map(item => <Row key={item.id} item={item} />);`,[S(1,'Each sibling has a stable identity.',{previous:tree('List','  Row key=a: draft A','  Row key=b: draft B','  Row key=c: draft C'),operations:log()}),S(2,'Match siblings by key and type across the reorder.',{next:tree('List','  Row key=c: draft C [moved]','  Row key=a: draft A','  Row key=b: draft B')}),S(3,'Move host nodes as needed while preserving row state.',{operations:log('MATCH c, a, b by key + type','MOVE c before a','PRESERVE drafts A, B, C')})])],
context:[
E('Basic Provider',`const Theme = createContext('light');
<Theme value="dark"><Layout><Card /></Layout></Theme>
function Card() { return <p>{useContext(Theme)}</p>; }`,[S(1,'Set the fallback for consumers outside providers.',{components:tree('Outside Card: light'),registry:memory(['Theme default','light']),consumer:memory(['Outside Card','light'])}),S(2,'A provider establishes a value for its descendants.',{components:tree('Theme.Provider: dark','  Layout','    Card [consumer]'),registry:memory(['Theme provider','dark'])}),S(3,'The consumer reads the nearest provider.',{consumer:memory(['Card','dark'],['Outside Card','light'])})]),
E('Nested Providers',`const Theme = createContext('light');
<Theme value="dark">
  <Card />
  <Theme value="mint"><Card /></Theme>
</Theme>`,[S(2,'Create an outer provider.',{components:tree('Theme: dark','  Outer Card'),registry:memory(['outer provider','dark'])}),S(4,'A nested provider shadows the outer value for its descendants.',{components:tree('Theme: dark','  Outer Card: dark','  Theme: mint','    Inner Card: mint'),registry:memory(['outer provider','dark'],['inner provider','mint'])}),S(5,'Each consumer selects its nearest provider independently.',{consumer:memory(['Outer Card','dark'],['Inner Card','mint'])})]),
E('Consumer Re-renders',`const Card = memo(function Card() {
  return <p>{useContext(Theme)}</p>;
});
<Theme value={theme}><Card /></Theme>
// Provider value changes from light to dark.`,[S(4,'The consumer initially reads light.',{components:tree('Provider: light','  Card memo: light'),registry:memory(['Theme','light']),consumer:memory(['Card','light'])}),S(5,'A changed context value schedules its consumers.',{components:tree('Provider: dark [changed]','  Card [scheduled]'),registry:memory(['Theme','dark']),consumer:memory(['Card','pending context update'])}),S(2,'memo does not block a consumed context update.',{components:tree('Provider: dark','  Card: dark [rendered]'),consumer:memory(['Card','dark'])})])],
 'fiber-tree':[
E('Work Loop Traversal',`function App() {
  return <main><Header /><Content><p>Notes</p></Content></main>;
}
// Conceptual traversal: begin work, descend, complete, visit sibling.`,[S(1,'Start at the host root.',{fiberTree:tree('HostRoot [active]','  App','    main','      Header','      Content','        p'),work:phase('BEGIN WORK','HostRoot'),detail:memory(['fiber','HostRoot'],['child','App'])}),S(2,'Descend through child links.',{fiberTree:tree('HostRoot','  App','    main [active]','      Header','      Content','        p'),work:phase('BEGIN WORK','main'),detail:memory(['fiber','main'],['return','App'],['child','Header'])}),S(2,'Complete Header, then follow its sibling link.',{fiberTree:tree('HostRoot','  App','    main','      Header [complete]','      Content [active]','        p'),work:phase('BEGIN WORK','Content'),detail:memory(['fiber','Content'],['sibling','none'],['child','p'])}),S(2,'Complete the leaf and bubble through return links.',{fiberTree:tree('HostRoot','  App','    main','      Header [complete]','      Content [complete]','        p [complete]'),work:phase('COMPLETE WORK','return toward root'),detail:memory(['fiber','p'],['return','Content'])}),S(4,'The illustrative traversal is finished. Fiber fields are implementation details.',{work:phase('IDLE','no remaining work'),detail:memory(['status','completed render'])})]),
E('Unit of Work',`// Conceptual Fiber fields for a function component:
{ type: Panel, child: heading, sibling: Footer,
  return: parent, pendingProps: { title: 'New' },
  memoizedProps: { title: 'Old' } }`,[S(2,'Inspect one work unit in the tree.',{fiberTree:tree('App','  Panel [active]','    heading','  Footer'),work:phase('BEGIN WORK','Panel'),detail:memory(['type','Panel'],['child','heading'],['sibling','Footer'],['return','App'])}),S(3,'Pending props describe the new work.',{detail:memory(['pendingProps','{ title: New }'],['memoizedProps','{ title: Old }']),work:phase('CALCULATE CHILDREN','Panel')}),S(4,'Complete this unit and continue traversal.',{fiberTree:tree('App','  Panel [complete]','    heading [changed]','  Footer [active]'),work:phase('NEXT UNIT','Footer'),detail:memory(['completed','Panel'],['next sibling','Footer'])})])],
hooks:[
E('Hook Linked List',`function Counter() {
  const [count, setCount] = useState(0);
  const [label] = useState('Clicks');
  useEffect(() => {}, [count]);
  return <button onClick={() => setCount(c => c + 1)}>{label}: {count}</button>;
}`, [S(2,'The first hook creates the head of this component’s hook list.',{hooks:queue('#0 useState: 0'),fiber:memory(['Counter.memoizedState','→ Hook #0'])}),S(3,'Append the second state hook in call order.',{hooks:queue('#0 useState: 0','#1 useState: Clicks'),fiber:memory(['Counter.memoizedState','→ #0 → #1'])}),S(4,'Append effect bookkeeping. These are conceptual internal records.',{hooks:queue('#0 useState: 0','#1 useState: Clicks','#2 useEffect: [0]'),fiber:memory(['Counter.memoizedState','→ #0 → #1 → #2'])}),S(5,'The next render reads the same sequence with updated state.',{hooks:queue('#0 useState: 1','#1 useState: Clicks','#2 useEffect: [1]'),fiber:memory(['Counter identity','preserved'],['hook order','unchanged'])})]),
E('Order Violation',`function Broken({ enabled }) {
  const [a] = useState(0);
  if (enabled) useState('conditional');
  const [b] = useState('last');
  return <p>{b}</p>;
}`, [S(3,'The enabled render calls three state hooks.',{hooks:queue('#0 a: 0','#1 conditional','#2 b: last'),fiber:memory(['render 1','3 hook calls'])}),S(3,'The next render skips a hook when enabled is false.',{hooks:queue('#0 a: 0','#1 now receives b call [mismatch]'),fiber:memory(['render 2','2 hook calls'])}),S(4,'The hook sequence no longer matches. Ordinary hooks must remain unconditional.',{hooks:queue('#0 matched','#1 wrong identity','#2 missing'),fiber:memory(['result','hook order error'],['fix','move condition inside appropriate logic'])})])],
render:[
E('Render vs Commit',`function Counter() {
  const [count, setCount] = useState(0);
  useLayoutEffect(() => measure(), [count]);
  useEffect(() => synchronize(), [count]);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`, [S(5,'Start with a committed UI.',{phase:phase('IDLE'),current:tree('Counter','  button: 0'),wip:tree(),effects:log()}),S(2,'Calculate the next tree without changing the visible commit.',{phase:phase('RENDER'),wip:tree('Counter [working]','  button: 1 [changed]')}),S(5,'Commit the completed host mutations.',{phase:phase('COMMIT'),current:tree('Counter','  button: 1'),wip:tree(),effects:log('DOM mutation: text 0 → 1')}),S(3,'Layout effects run as part of the commit work before repaint.',{effects:log('DOM mutation: done','useLayoutEffect: measure')}),S(4,'Passive effects synchronize after commit; their relation to paint can vary.',{phase:phase('IDLE'),effects:log('DOM mutation: done','useLayoutEffect: done','useEffect: synchronize')})]),
E('Batched Updates',`function click() {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
}`, [S(1,'Begin from committed count zero.',{phase:phase('EVENT'),current:tree('Counter','  text: 0'),wip:tree(),effects:log()}),S(4,'Queue three updaters during one handler.',{phase:phase('UPDATES QUEUED'),effects:log('queued +1','queued +1','queued +1')}),S(4,'Process pending state as 0 → 1 → 2 → 3.',{phase:phase('RENDER'),wip:tree('Counter','  text: 3 [changed]')}),S(0,'Commit the completed result together.',{phase:phase('COMMIT'),current:tree('Counter','  text: 3'),wip:tree(),effects:log('text 0 → 3')})])],
memoization:[
E('React.memo',`const Child = memo(function Child({ label }) {
  return <p>{label}</p>;
});
// Parent changes unrelated state; label remains 'Notes'.`,[S(1,'Mount the child with its initial props.',{components:tree('Parent','  Child label=Notes [render]'),cache:memory(['previous props','{ label: Notes }']),decisions:log('first mount: render')}),S(4,'The parent updates but child props compare equal.',{components:tree('Parent [render]','  Child label=Notes [reuse]'),decisions:log('Object.is(Notes, Notes) = true','memo may skip child render')}),S(0,'Memoization is an optimization; context and local state can still update the child.',{decisions:log('reuse child result','do not rely on memo for correctness')})]),
E('useMemo',`const filtered = useMemo(
  () => items.filter(item => item.active),
  [items]
);`,[S(2,'Run the calculation on the first render.',{components:tree('List [render]'),cache:memory(['deps','items reference #1'],['result','filtered array #2']),decisions:log('cache miss → calculate')}),S(3,'An unchanged dependency lets React reuse the cached result.',{cache:memory(['deps','same reference #1'],['result','reuse #2']),decisions:log('Object.is dependencies equal','cache hit')}),S(3,'A new items reference invalidates the cached calculation.',{cache:memory(['deps','new reference #3'],['result','new array #4']),decisions:log('dependency changed','recalculate')})]),
E('useCallback',`const onSave = useCallback(() => save(id), [id]);
return <MemoButton onSave={onSave} />;`,[S(1,'Cache a function identity for the dependency value.',{components:tree('Editor','  MemoButton'),cache:memory(['id','7'],['onSave','function #1']),decisions:log('create function #1')}),S(2,'With id unchanged, the child receives the same callback reference.',{cache:memory(['id','7'],['onSave','reuse function #1']),decisions:log('same callback prop','memo child can skip')}),S(1,'Changing id requires a callback with the new closure.',{cache:memory(['id','8'],['onSave','function #2']),decisions:log('dependency changed','new callback identity')})]),
E('Cache Invalidation',`const options = { mode: 'all' };
const result = useMemo(() => search(items, options), [items, options]);`,[S(1,'A new render allocates a fresh options object.',{components:tree('Search [render]'),cache:memory(['options','object #1']),decisions:log('initial calculation')}),S(1,'The next render creates a different object even with equal contents.',{cache:memory(['old options','object #1'],['new options','object #2']),decisions:log('Object.is(#1, #2) = false')}),S(2,'The dependency change invalidates the cache.',{decisions:log('cache miss on every render','move object creation inside calculation or stabilize dependencies')})])]
};
Object.assign(reactExamples,{
suspense:[
E('Single Boundary',`const Details = lazy(() => import('./Details'));
<Suspense fallback={<p>Loading…</p>}><Details /></Suspense>`,[S(2,'Attempt to render the content inside the boundary.',{components:tree('Suspense','  Details [attempt]'),boundary:phase('TRY CONTENT')}),S(1,'The lazy module is pending and suspends this subtree.',{components:tree('Suspense','  Details [suspended]','  fallback: Loading… [visible]'),boundary:phase('FALLBACK','waiting for lazy module')}),S(2,'When the module is available, retry and reveal its content.',{components:tree('Suspense','  Details [visible]'),boundary:phase('CONTENT','fallback removed')})]),
E('Nested Boundaries',`<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<ListSkeleton />}><Results /></Suspense>
</Suspense>`,[S(1,'The outer boundary can independently protect the page shell.',{components:tree('Outer Suspense','  Header','  Inner Suspense','    Results'),boundary:memory(['outer','trying content'],['inner','trying content'])}),S(3,'Results suspends at the inner boundary while Header stays visible.',{components:tree('Outer Suspense [content]','  Header [visible]','  Inner Suspense [fallback]','    ListSkeleton [visible]'),boundary:memory(['outer','content'],['inner','fallback'])}),S(3,'Reveal Results when its supported data or code source is ready.',{components:tree('Outer Suspense','  Header','  Inner Suspense','    Results [visible]'),boundary:memory(['outer','content'],['inner','content'])})]),
E('Waterfall vs Parallel',`// Waterfall: child work starts after parent data is ready.
// Parallel: start independent supported sources ahead of render.
const profilePromise = loadProfile();
const feedPromise = loadFeed();`,[S(1,'A waterfall starts the second source only after the first finishes.',{components:tree('Profile [loading]','  Feed [not started]'),boundary:memory(['waterfall time','A + B'])}),S(3,'In a separate comparison, start both independent loads early.',{components:tree('Profile [loading]','Feed [loading]'),boundary:memory(['profilePromise','pending'],['feedPromise','pending'])}),S(4,'Parallel preparation removes the avoidable dependency. Boundary placement controls reveal behavior.',{components:tree('Profile [ready]','Feed [ready]'),boundary:memory(['parallel time','roughly max(A, B)'],['requirement','Suspense-enabled framework/source'])})])],
 'server-components':[
E('Server vs Client',`// Page.jsx: Server Component
async function Page() {
  const post = await readPost();
  return <article><h2>{post.title}</h2><LikeButton /></article>;
}
// LikeButton.jsx begins with 'use client'.`,[S(3,'Read data in the server-component environment.',{phase:phase('SERVER RENDER'),components:tree('Page [server]','  article','    LikeButton [client boundary]'),payload:log('Server-only Page implementation stays outside client bundle')}),S(4,'Produce a payload containing rendered descriptions and a client module reference.',{payload:table(['Payload part','Value'],['host output','article + post title'],['client reference','LikeButton'],['props','serializable data'])}),S(6,'A supporting framework renders initial HTML and hydrates the client boundary.',{phase:phase('CLIENT HYDRATION'),components:tree('article [host]','  h2: Notebook','  LikeButton [interactive]')})]),
E('RSC Payload',`// Conceptual payload, not the wire format:
{ host: 'article', children: [
  { host: 'h2', text: 'Notebook' },
  { clientReference: 'LikeButton', props: { count: 0 } }
] }`,[S(1,'The payload describes resolved server output, not server-component source code.',{phase:phase('SERIALIZE'),components:tree('article','  h2','  LikeButton [reference]'),payload:table(['Part','Meaning'],['host description','article, h2'],['text','Notebook'])}),S(4,'Client references identify code that the browser needs.',{payload:table(['Part','Meaning'],['module reference','LikeButton'],['props','{ count: 0 }'],['server implementation','not shipped'])}),S(5,'The framework integrates the payload with client modules.',{phase:phase('CLIENT INTEGRATION'),components:tree('article','  h2: Notebook','  LikeButton: count 0')})]),
E('Composition Pattern',`// Server parent:
<ClientShell><ServerContent /></ClientShell>
// ClientShell.jsx:
'use client';
function ClientShell({ children }) { return <aside>{children}</aside>; }`,[S(2,'The server parent composes both elements.',{phase:phase('SERVER COMPOSITION'),components:tree('Server parent','  ClientShell [client boundary]','    ServerContent [server output]'),payload:log('Resolve ServerContent in server environment')}),S(2,'Pass the resolved server content through the children slot.',{payload:table(['ClientShell prop','Value'],['children','resolved server-rendered content'])}),S(5,'The client shell can be interactive without importing server-only implementation.',{phase:phase('CLIENT RENDER'),components:tree('ClientShell [interactive]','  aside','    resolved ServerContent')})])],
 'error-boundaries':[
E('Basic Error Boundary',`<Header />
<Boundary fallback={<p>Could not load.</p>}><BrokenPanel /></Boundary>
// BrokenPanel throws during render.`,[S(2,'Attempt to render the protected subtree.',{components:tree('Page','  Header','  Boundary','    BrokenPanel [render]'),error:phase('NO ERROR')}),S(3,'The descendant throws; React searches for an ancestor boundary.',{components:tree('Page','  Header','  Boundary [capture]','    BrokenPanel [error]'),error:phase('RENDER ERROR','BrokenPanel failed')}),S(2,'Commit fallback UI while preserving the sibling header.',{components:tree('Page','  Header [visible]','  Boundary','    fallback [visible]'),error:phase('HANDLED','not all asynchronous or event-handler errors are caught')})]),
E('Nested Boundaries',`<PageBoundary>
  <Header />
  <PanelBoundary><BrokenPanel /></PanelBoundary>
</PageBoundary>`,[S(3,'The nearest eligible ancestor handles a descendant render failure.',{components:tree('PageBoundary','  Header','  PanelBoundary','    BrokenPanel [error]'),error:phase('SEARCH','BrokenPanel → PanelBoundary')}),S(3,'PanelBoundary renders its own fallback.',{components:tree('PageBoundary [content]','  Header [visible]','  PanelBoundary [fallback]'),error:phase('HANDLED','page boundary did not need to replace its subtree')}),S(1,'If the inner boundary itself fails, an outer boundary can handle that failure.',{components:tree('PageBoundary [fallback]','  page fallback'),error:phase('OUTER RECOVERY','alternative failure case')})]),
E('Recovery Pattern',`<Boundary key={attempt}>
  <Panel />
</Boundary>
<button onClick={() => setAttempt(n => n + 1)}>Retry</button>`,[S(2,'A render failure activates the fallback.',{components:tree('Boundary key=0','  fallback [visible]'),error:phase('FAILED','attempt 0')}),S(4,'A deliberate retry changes the boundary identity.',{components:tree('Boundary key=1 [new]','  Panel [retry]'),error:phase('RETRY','reset boundary state by remount')}),S(2,'If the underlying issue is fixed, the retried content commits.',{components:tree('Boundary key=1','  Panel [visible]'),error:phase('RECOVERED','a persistent error would show fallback again')})])],
effects:[
E('Mount & Unmount',`useEffect(() => {
  console.log('setup');
  return () => console.log('cleanup');
}, []);`,[S(1,'Commit the mounted component.',{components:tree('App','  Widget [mounted]'),effectTimeline:timeline({time:0,label:'commit',state:'done'})}),S(2,'Setup runs after commit.',{effectTimeline:timeline({time:0,label:'commit',state:'done'},{time:1,label:'setup',state:'done'}),output:['setup']}),S(3,'Unmount invokes the cleanup owned by that setup.',{components:tree('App','  Widget [unmounted]'),effectTimeline:timeline({time:0,label:'commit',state:'done'},{time:1,label:'setup',state:'done'},{time:2,label:'cleanup',state:'done'}),output:['setup','cleanup']})]),
E('Dependency Array',`useEffect(() => {
  const connection = connect(room);
  return () => connection.disconnect();
}, [room]);`,[S(2,'Mount and synchronize with room A.',{components:tree('Room: A'),effectTimeline:timeline({time:0,label:'setup A',state:'done'}),output:['connect A']}),S(4,'The next commit changes room from A to B.',{components:tree('Room: B [changed]'),effectTimeline:timeline({time:0,label:'setup A',state:'done'},{time:1,label:'deps A → B',state:'active'})}),S(3,'Clean up the previous synchronization first.',{output:['connect A','disconnect A'],effectTimeline:timeline({time:0,label:'setup A',state:'done'},{time:1,label:'cleanup A',state:'done'})}),S(2,'Then set up the effect using B.',{output:['connect A','disconnect A','connect B'],effectTimeline:timeline({time:0,label:'setup A',state:'done'},{time:1,label:'cleanup A',state:'done'},{time:2,label:'setup B',state:'done'})})]),
E('Cleanup Timing',`useEffect(() => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}, [room]);`,[S(2,'The effect owns one timer.',{components:tree('Widget room=A','  interval A [active]'),effectTimeline:timeline({time:0,label:'setup timer A',state:'done'}),output:['timer A started']}),S(3,'On a dependency change, dispose of the old timer before another setup.',{components:tree('Widget room=B','  interval A [cleared]'),effectTimeline:timeline({time:0,label:'setup A',state:'done'},{time:1,label:'cleanup A',state:'done'}),output:['timer A started','timer A cleared']}),S(2,'Only the new interval remains active.',{components:tree('Widget room=B','  interval B [active]'),effectTimeline:timeline({time:0,label:'setup A',state:'done'},{time:1,label:'cleanup A',state:'done'},{time:2,label:'setup B',state:'done'}),output:['timer A started','timer A cleared','timer B started']})]),
E('Common Patterns',`// Every commit:
useEffect(sync);
// Once per mount, with cleanup:
useEffect(subscribe, []);
// When dependencies change:
useEffect(connect, [room]);`,[S(2,'Without a dependency array, setup runs after each relevant commit.',{components:tree('Widget [commit]'),effectTimeline:timeline({time:0,label:'commit',state:'done'},{time:1,label:'sync',state:'done'}),output:['sync after commit']}),S(4,'An empty dependency list still needs resource cleanup and supports remounts.',{effectTimeline:timeline({time:0,label:'mount setup',state:'done'},{time:1,label:'unmount cleanup',state:'done'}),output:['mount setup → unmount cleanup']}),S(6,'Explicit dependencies resynchronize when compared values change.',{effectTimeline:timeline({time:0,label:'setup A',state:'done'},{time:1,label:'cleanup A',state:'done'},{time:2,label:'setup B',state:'done'}),output:['Object.is compares each dependency','Strict Mode may probe setup/cleanup in development']})])],
state:[
E('Three setState calls, one render',`function click() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}`, [S(1,'The handler sees one render snapshot of zero.',{updates:queue(),hookState:memory(['count snapshot','0']),renderLog:log('initial commit: 0'),loop:phase('EVENT HANDLER'),output:[]}),S(4,'All three replacements use the same snapshot.',{updates:queue('replace 1','replace 1','replace 1'),hookState:memory(['pending processing','0 → 1 → 1 → 1'])}),S(0,'After the handler, process the batched queue.',{loop:phase('RENDER'),renderLog:log('render count=1')}),S(0,'Commit the result, rather than three visible intermediate results.',{updates:queue(),hookState:memory(['committed count','1']),renderLog:log('initial commit: 0','next commit: 1'),loop:phase('IDLE'),output:['1']})]),
E('Updater functions',`function click() {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
}`, [S(1,'Begin from pending state zero.',{hookState:memory(['count','0']),updates:queue(),loop:phase('EVENT HANDLER'),renderLog:log('initial commit: 0')}),S(4,'Queue three functions rather than three captured values.',{updates:queue('c => c + 1','c => c + 1','c => c + 1')}),S(0,'Each updater receives the preceding pending result.',{hookState:memory(['processing','0 → 1 → 2 → 3']),loop:phase('RENDER')}),S(0,'Commit three as one completed result.',{updates:queue(),hookState:memory(['count','3']),renderLog:log('initial commit: 0','next commit: 3'),loop:phase('IDLE'),output:['3']})]),
E('Automatic batching outside events',`setTimeout(() => {
  setCount(c => c + 1);
  setReady(true);
}, 0);`, [S(1,'A timer will run later as a task.',{updates:queue(),hookState:memory(['count','0'],['ready','false']),loop:phase('TIMER WAITING'),renderLog:log('initial commit')}),S(3,'The callback schedules both updates.',{updates:queue('count: c => c + 1','ready: true'),loop:phase('TIMER TASK')}),S(0,'Modern React roots can batch these updates outside React event handlers too.',{loop:phase('RENDER'),hookState:memory(['pending count','1'],['pending ready','true'])}),S(0,'Both new values appear in the completed commit.',{updates:queue(),hookState:memory(['count','1'],['ready','true']),renderLog:log('initial commit','batched commit: count 1, ready true'),loop:phase('IDLE'),output:['count=1, ready=true']})])],
 'concurrent-rendering':[
E('Blocking render',`function change(value) {
  setQuery(value);
}
return <><Input /><ExpensiveList query={query} /></>;`,[S(2,'This update is urgent in the blocking comparison.',{lanes:table(['Update','Priority / status'],['query=a','urgent: pending']),work:phase('RENDER','synchronous work'),frames:timeline({time:0,label:'input a',state:'active'}),dom:dom('Input: a','List still shows previous query')}),S(4,'Long synchronous work prevents processing another input until it yields.',{lanes:table(['Update','Priority / status'],['query=a','rendering'],['input=ab','waiting']),work:phase('BLOCKED','illustrative long render'),frames:timeline({time:0,label:'input a',state:'done'},{time:16,label:'blocked',state:'error'},{time:32,label:'blocked',state:'error'})}),S(4,'After the first commit, the newer urgent update can run.',{lanes:table(['Update','Priority / status'],['query=a','committed'],['query=ab','committed']),work:phase('COMMIT','completed latest update'),frames:timeline({time:0,label:'a',state:'done'},{time:16,label:'blocked',state:'error'},{time:32,label:'ab commit',state:'done'}),dom:dom('Input: ab','Results for ab')})]),
E('startTransition',`function change(value) {
  setInput(value);
  startTransition(() => setQuery(value));
}
return <><Input value={input} /><Results query={query} /></>;`,[S(2,'Keep the controlled input update urgent.',{lanes:table(['Update','Priority / status'],['input=a','urgent: committed'],['query=a','transition: pending']),work:phase('BEGIN TRANSITION'),frames:timeline({time:0,label:'input a',state:'done'}),dom:dom('Input: a','Previous results remain visible')}),S(3,'Calculate results as interruptible background render work.',{work:phase('RENDER','transition for a in progress'),frames:timeline({time:0,label:'input a',state:'done'},{time:5,label:'render slice',state:'active'})}),S(2,'A newer urgent input can interrupt and restart that work.',{lanes:table(['Update','Priority / status'],['input=ab','urgent: committed'],['query=a','abandoned'],['query=ab','transition: rendering']),work:phase('INTERRUPTED','restart for latest query'),frames:timeline({time:0,label:'a',state:'done'},{time:5,label:'ab input',state:'done'},{time:10,label:'restart',state:'active'}),dom:dom('Input: ab','Previous results remain visible')}),S(5,'Publish the completed latest tree together. This is a teaching timeline, not scheduler instrumentation.',{lanes:table(['Update','Priority / status'],['input=ab','committed'],['query=ab','committed']),work:phase('COMMIT'),frames:timeline({time:0,label:'a',state:'done'},{time:5,label:'ab',state:'done'},{time:16,label:'commit',state:'done'}),dom:dom('Input: ab','Results for ab')})]),
E('useDeferredValue and Suspense',`const deferredQuery = useDeferredValue(query);
return <Suspense fallback={<Loading />}>
  <Results query={deferredQuery} />
</Suspense>;`,[S(1,'Initially the deferred value matches the current query.',{lanes:table(['Value','State'],['query','a'],['deferredQuery','a']),work:phase('IDLE'),frames:timeline({time:0,label:'a committed',state:'done'}),dom:dom('Input: a','Results for a')}),S(1,'An urgent input change can retain the earlier deferred value.',{lanes:table(['Value','State'],['query','ab'],['deferredQuery','a (stale)']),work:phase('BACKGROUND RENDER','trying deferred ab'),frames:timeline({time:0,label:'input ab',state:'done'},{time:5,label:'background attempt',state:'active'}),dom:dom('Input: ab','Stale results for a remain visible')}),S(3,'If background content suspends, React can keep the already revealed result visible.',{work:phase('SUSPENDED','waiting for supported source'),frames:timeline({time:0,label:'ab input',state:'done'},{time:5,label:'suspended',state:'active'})}),S(4,'When ready, commit the deferred result.',{lanes:table(['Value','State'],['query','ab'],['deferredQuery','ab']),work:phase('COMMIT'),frames:timeline({time:0,label:'ab input',state:'done'},{time:5,label:'waiting',state:'done'},{time:16,label:'commit',state:'done'}),dom:dom('Input: ab','Results for ab')})])]
});
