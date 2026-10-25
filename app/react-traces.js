// Original React teaching traces. Scheduling/fiber diagrams are conceptual, not instrumentation.
const node=(label,depth=0,status='stable')=>({label,depth,status});
const f=(line,note,panels={},tree=[],preview=null)=>({line,note,panels,tree,preview,output:[]});
const scene=(id,title,code,frames,takeaway,source)=>({id,title,topic:'React',language:'React / JSX',code:code.split('\n'),frames:[f(0,'Ready. Predict the UI changes, then follow the render step by step.'),...frames],takeaway,source});
export const reactTraces=[
scene('virtual-dom','Virtual DOM',`function Greeting({ name }) {
  return <section>
    <h2>Hello, {name}</h2>
    <p>Welcome back.</p>
  </section>;
}
// Initial props: name = 'Mira'
// Update props: name = 'Nova'`,[
f(1,'React calls Greeting with its initial props.',{'Props':['name = Mira'],'Phase':['render: calculate UI']},[node('Greeting',0,'active')]),
f(3,'JSX describes elements. A modern JSX transform uses the JSX runtime.',{'Element description':['type: section','children: h2, p'],'JSX runtime':['jsx(h2, props)','jsx(p, props)','jsxs(section, props)']},[node('section',0,'active'),node('h2: Hello, Mira',1,'active'),node('p: Welcome back.',1,'active')]),
f(5,'On initial commit, React creates the matching browser nodes.',{'Phase':['commit: mount host nodes'],'DOM operations':['insert section','insert h2 and p']},[node('section'),node('h2: Hello, Mira',1),node('p: Welcome back.',1)],{title:'Hello, Mira',body:'Welcome back.'}),
f(8,'New props trigger another render; the browser still shows the committed UI.',{'Props':['name = Nova'],'Phase':['render: compare descriptions']},[node('section'),node('h2: Hello, Nova',1,'changed'),node('p: Welcome back.',1)],{title:'Hello, Mira',body:'Welcome back.'}),
f(3,'Commit the changed greeting text and keep the unchanged paragraph.',{'DOM operations':['update h2 text'],'Preserved nodes':['section','p']},[node('section'),node('h2: Hello, Nova',1,'changed'),node('p: Welcome back.',1)],{title:'Hello, Nova',body:'Welcome back.'})], 'React elements describe UI; rendering calculates it and committing updates browser nodes.', 'https://react.dev/learn/render-and-commit'),
scene('reconciliation','Reconciliation',`const initial = ['a', 'b', 'c'];
const next = ['c', 'a', 'b'];
return items.map(id => <Row key={id} id={id} />);
// Later: replace Row key="a" with Card key="a"`,[
f(1,'Mount three rows identified by type and key.',{'Current order':['a → b → c'],'Row state':['a: draft A','b: draft B','c: draft C']},[node('List'),node('Row key=a',1),node('Row key=b',1),node('Row key=c',1)]),
f(2,'The new render describes a different sibling order.',{'Current order':['a → b → c'],'Next order':['c → a → b']},[node('List'),node('Row key=c',1,'active'),node('Row key=a',1,'active'),node('Row key=b',1,'active')]),
f(3,'Stable keys let React match each row and preserve its state.',{'Committed order':['c → a → b'],'Preserved state':['c: draft C','a: draft A','b: draft B']},[node('List'),node('Row key=c · moved',1,'changed'),node('Row key=a · retained',1),node('Row key=b · retained',1)]),
f(4,'Changing component type replaces that subtree even with the same key.',{'Identity':['Row key=a → removed','Card key=a → mounted'],'State':['Card starts with fresh state']},[node('List'),node('Row key=c',1),node('Card key=a · new identity',1,'changed'),node('Row key=b',1)])], 'Type, position, and sibling keys determine identity and whether component state survives.', 'https://react.dev/learn/preserving-and-resetting-state'),
scene('context','Context Propagation',`const ThemeContext = createContext('light');
function App() {
  return <ThemeContext value={theme}>
    <Layout><Toolbar /><Profile /></Layout>
  </ThemeContext>;
}
// Toolbar and Profile call useContext(ThemeContext).
// Update provider: light → dark.`,[
f(1,'Context has a fallback when no matching provider exists.',{'Context default':['light'],'Outside consumer':['light']},[node('Outside consumer: light')]),
f(3,'The provider supplies light to its descendant consumers.',{'Provider value':['light'],'Consumers':['Toolbar = light','Profile = light']},[node('Theme provider: light'),node('Layout',1),node('Toolbar consumes light',2),node('Profile consumes light',2)]),
f(8,'Changing the value invalidates consumers reading this context.',{'Provider value':['dark'],'Scheduled consumers':['Toolbar','Profile'],'Outside consumer':['light (unchanged)']},[node('Theme provider: dark',0,'changed'),node('Layout',1),node('Toolbar scheduled',2,'active'),node('Profile scheduled',2,'active')]),
f(7,'Consumers read the closest provider without prop forwarding.',{'Consumers':['Toolbar = dark','Profile = dark'],'Note':['memo does not block fresh consumed context']},[node('Theme provider: dark'),node('Layout',1),node('Toolbar reads dark',2,'changed'),node('Profile reads dark',2,'changed')])], 'A changed provider value updates its context consumers; the nearest matching provider wins.', 'https://react.dev/reference/react/useContext'),
scene('fiber-tree','Fiber Tree',`function App() {
  return <main><Header /><Results /></main>;
}
// Conceptual work units:
// App → main → Header → Results
// Render prepares work; commit publishes it.`,[
f(1,'Fiber is React implementation machinery. This diagram abstracts its structure.',{'Current tree':['committed UI'],'Work in progress':['not started']},[node('App'),node('main',1),node('Header',2),node('Results',2)]),
f(2,'Begin work on the root and descend to its child.',{'Work in progress':['App → main'],'Links':['child: descend','sibling: next neighbor','return: parent']},[node('App',0,'active'),node('main',1,'active'),node('Header',2),node('Results',2)]),
f(5,'Visit a child, then its sibling as separate conceptual work units.',{'Work in progress':['Header complete','Results in progress'],'Current tree':['still displayed']},[node('App'),node('main',1),node('Header',2,'changed'),node('Results',2,'active')]),
f(6,'After render completes, commit applies the prepared host changes.',{'Work in progress':['completed'],'Commit':['publish finished tree'],'Caution':['implementation details can change']},[node('App',0,'changed'),node('main',1,'changed'),node('Header',2,'changed'),node('Results',2,'changed')])], 'Fiber represents units of React work; rendering can be interrupted while committed UI stays consistent.', 'https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react'),
scene('hooks','Hooks',`function Counter() {
  const [count, setCount] = useState(0);
  const [label] = useState('Clicks');
  const latest = useRef(null);
  return <button onClick={() => setCount(c => c + 1)}>
    {label}: {count}
  </button>;
}`, [
f(2,'The first state hook initializes count on mount.',{'Hook slots':['1: state count = 0']},[node('Counter',0,'active')]),
f(4,'Subsequent hooks occupy stable positions in this component.',{'Hook slots':['1: state count = 0','2: state label = Clicks','3: ref current = null']},[node('Counter'),node('useState count',1),node('useState label',1),node('useRef latest',1)]),
f(6,'The initial render commits a button.',{'Hook slots':['1: count = 0','2: label = Clicks','3: stable ref object']},[node('Counter'),node('button: Clicks 0',1)],{title:'Clicks: 0',body:'Committed button text'}),
f(5,'A click queues an updater for the first state hook.',{'Hook slots':['1: pending c => c + 1','2: label = Clicks','3: same ref object']},[node('Counter',0,'active'),node('button: Clicks 0',1)],{title:'Clicks: 0',body:'Update queued'}),
f(6,'The next render reads the hooks in the same order and commits count 1.',{'Hook slots':['1: count = 1','2: label = Clicks','3: same ref object']},[node('Counter'),node('button: Clicks 1',1,'changed')],{title:'Clicks: 1',body:'Committed button text'})], 'Call ordinary Hooks in the same order at the top level; state belongs to a component identity.', 'https://react.dev/reference/rules/rules-of-hooks'),
scene('render','Render Cycle',`function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>
    Count: {count}
  </button>;
}
// User clicks once.`,[
f(4,'Start with a committed button displaying zero.',{'Phase':['idle'],'Committed state':['count = 0']},[node('Counter'),node('button: Count 0',1)],{title:'Count: 0'}),
f(7,'An interaction triggers a state update.',{'Phase':['trigger'],'Update queue':['c => c + 1']},[node('Counter',0,'active'),node('button: Count 0',1)],{title:'Count: 0'}),
f(2,'React calls the component to calculate the next UI.',{'Phase':['render (pure calculation)'],'Next state':['count = 1']},[node('Counter',0,'active'),node('button: Count 1',1,'changed')],{title:'Count: 0',body:'Browser still shows the previous commit'}),
f(4,'The commit updates the button text in the DOM.',{'Phase':['commit'],'DOM mutation':['text: Count 0 → Count 1']},[node('Counter'),node('button: Count 1',1,'changed')],{title:'Count: 1'}),
f(0,'The browser can paint the committed result. Timing here is illustrative.',{'Phase':['paint opportunity'],'Committed state':['count = 1']},[node('Counter'),node('button: Count 1',1)],{title:'Count: 1'})], 'Trigger requests work, render calculates UI, and commit changes the DOM; a render may produce no DOM mutations.', 'https://react.dev/learn/render-and-commit'),
scene('memoization','Memoization',`const Row = memo(function Row({ item }) {
  return <li>{item.name}</li>;
});
const item = useMemo(() => ({ name }), [name]);
return <Row item={item} />;
// Parent updates unrelated state, then changes name.`,[
f(4,'Create and cache an item object for name Mira.',{'Dependencies':['name = Mira'],'Cached value':['item → object #1']},[node('Parent',0,'active'),node('Row item=#1',1,'active')]),
f(5,'Mount the memoized child.',{'Row props':['item → #1'],'Comparison':['first mount: render child']},[node('Parent'),node('Row: Mira',1)],{title:'Mira'}),
f(6,'An unrelated parent update leaves name unchanged.',{'Dependencies':['Object.is(previous name, next name) = true'],'Cached value':['reuse object #1']},[node('Parent',0,'active'),node('Row: Mira · can skip',1)],{title:'Mira'}),
f(5,'memo can skip the child when props compare equal.',{'Row props':['same item reference'],'Result':['child render may be skipped'],'Caveat':['memoization is an optimization, not a guarantee']},[node('Parent'),node('Row: Mira · reused',1)],{title:'Mira'}),
f(4,'Changing name to Nova creates a new cached object.',{'Dependencies':['Mira → Nova'],'Cached value':['item → object #2'],'Row props':['changed reference: render']},[node('Parent',0,'active'),node('Row: Nova',1,'changed')],{title:'Nova'})], 'memo compares props; useMemo caches a calculation by dependencies. Local state and consumed context can still update children.', 'https://react.dev/reference/react/memo'),
scene('suspense','Suspense',`const Details = lazy(() => import('./Details'));
function Page() {
  return <Suspense fallback={<p>Loading details…</p>}>
    <Details />
  </Suspense>;
}`, [
f(3,'Render the boundary and try its content.',{'Lazy module':['not loaded'],'Boundary':['trying content']},[node('Page'),node('Suspense',1),node('Details',2,'active')]),
f(4,'The lazy component suspends while its code loads.',{'Lazy module':['pending import promise'],'Boundary':['content suspended']},[node('Page'),node('Suspense',1,'active'),node('Details · suspended',2,'suspended')]),
f(3,'For this initial mount, commit the nearest boundary fallback.',{'Visible content':['Loading details…'],'Pending work':['Details module']},[node('Page'),node('Suspense',1),node('Fallback',2,'active')],{title:'Loading details…',loading:true}),
f(1,'The module resolves and React retries rendering Details.',{'Lazy module':['resolved'],'Boundary':['retrying content']},[node('Page'),node('Suspense',1),node('Details',2,'active')],{title:'Loading details…',loading:true}),
f(4,'Commit the content and replace the fallback.',{'Visible content':['Details'],'Boundary':['content revealed'],'Caveat':['fetching in an effect does not itself activate Suspense']},[node('Page'),node('Suspense',1),node('Details',2,'changed')],{title:'Project details',body:'The lazy component is ready.'})], 'Suspense coordinates supported suspending sources such as lazy-loaded components; it does not detect arbitrary effect-based fetching.', 'https://react.dev/reference/react/Suspense'),
scene('server-components','Server Components',`// Page.jsx — Server Component
import LikeButton from './LikeButton';
export default async function Page() {
  const post = await readPost();
  return <article><h2>{post.title}</h2><LikeButton /></article>;
}
// LikeButton.jsx starts with 'use client'.`,[
f(4,'In a supporting framework, the server component reads data in its server environment.',{'Server environment':['readPost() → { title: Learning React }'],'Client bundle':['Page implementation excluded']},[node('Page · server',0,'server'),node('LikeButton · client boundary',1,'client')]),
f(5,'Server output includes rendered descriptions and a client-component reference.',{'RSC payload (conceptual)':['article with post title','reference to LikeButton module'],'Boundary':['serializable props across boundary']},[node('article · server output',0,'server'),node('h2: Learning React',1,'server'),node('LikeButton',1,'client')]),
f(7,'A framework can also produce initial HTML; client components may participate in SSR.',{'Initial HTML':['article, title, button markup'],'Browser JavaScript':['LikeButton and client dependencies']},[node('article'),node('h2: Learning React',1),node('LikeButton · hydrate',1,'active')],{title:'Learning React',body:'Like button: 0 likes'}),
f(7,'Hydration connects client interactivity. Server-only code stays outside the browser bundle.',{'Browser':['LikeButton handles interactions'],'Server code':['not hydrated'],'This lab':['static teaching model; no server requests are made']},[node('article'),node('h2: Learning React',1),node('LikeButton · interactive',1,'client')],{title:'Learning React',body:'Like button: 1 like'})], 'Server Components execute outside the client bundle; a client boundary enables browser state and events in supporting frameworks.', 'https://react.dev/reference/rsc/server-components'),
scene('error-boundaries','Error Boundaries',`class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>Could not load.</p> : this.props.children; }
}
<><Header /><Boundary><BrokenPanel /></Boundary></>
// BrokenPanel throws while rendering.`,[
f(6,'Start rendering a page with a boundary around one subtree.',{'Boundary state':['failed = false'],'Unaffected sibling':['Header']},[node('Page'),node('Header',1),node('Boundary',1),node('BrokenPanel',2,'active')]),
f(7,'A descendant throws during rendering.',{'Error':['BrokenPanel: render failed'],'Search':['nearest ancestor error boundary']},[node('Page'),node('Header',1),node('Boundary',1,'active'),node('BrokenPanel · throws',2,'error')]),
f(3,'The boundary derives fallback state for a recovery render.',{'Boundary state':['failed = true'],'Recovery':['render fallback subtree']},[node('Page'),node('Header',1),node('Boundary',1,'active'),node('Fallback',2,'changed')]),
f(4,'Commit the fallback while the sibling stays visible.',{'Visible content':['Header','Could not load.'],'Not caught here':['event-handler errors','ordinary async callbacks','errors in this boundary itself']},[node('Page'),node('Header',1),node('Boundary',1),node('Fallback',2,'error')],{title:'Application header',body:'Could not load.',error:true})], 'Error boundaries recover from descendant render errors; they do not catch every kind of JavaScript error.', 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary'),
scene('effects','useEffect Lifecycle',`function Room({ room }) {
  useEffect(() => {
    const connection = connect(room);
    return () => connection.disconnect();
  }, [room]);
  return <h2>{room}</h2>;
}
// Mount: A → change: B → unmount`,[
f(6,'Commit the initial room UI before this effect setup.',{'Phase':['mount commit'],'Resources':['none yet']},[node('Room A'),node('h2: A',1)],{title:'Room A'}),
f(3,'Setup creates a connection owned by this effect instance.',{'Phase':['effect setup'],'Resources':['connection A active'],'Dependency snapshot':['room = A']},[node('Room A'),node('effect: connected A',1,'active')],{title:'Room A'}),
f(8,'Commit room B. The old effect still owns connection A until cleanup.',{'Phase':['dependency changed'],'Resources':['connection A'],'Dependency comparison':['A is not B']},[node('Room B',0,'changed'),node('old effect: A',1)],{title:'Room B'}),
f(4,'Cleanup disconnects the old resource before the new setup.',{'Phase':['cleanup A'],'Resources':['connection A disconnected']},[node('Room B'),node('cleanup A',1,'changed')],{title:'Room B'}),
f(3,'Setup now synchronizes with room B.',{'Phase':['setup B'],'Resources':['connection B active']},[node('Room B'),node('effect: connected B',1,'active')],{title:'Room B'}),
f(8,'Unmount runs the remaining cleanup. Development Strict Mode also probes setup and cleanup.',{'Phase':['unmount cleanup B'],'Resources':['no active connection'],'Timing':['effects are not guaranteed to run after paint in every case']},[node('Room · unmounted',0,'removed')],{title:'Room closed'})], 'An effect cleans up its previous synchronization before a changed-dependency setup and when the component unmounts.', 'https://react.dev/learn/lifecycle-of-reactive-effects'),
scene('state','State Batching',`const [count, setCount] = useState(0);
function replace() {
  setCount(count + 1); setCount(count + 1); setCount(count + 1);
}
function compose() {
  setCount(c => c + 1); setCount(c => c + 1); setCount(c => c + 1);
}
// Compare independent runs starting from count = 0.`,[
f(1,'Both independent examples begin with a render snapshot of zero.',{'Replacement run':['snapshot = 0'],'Updater run':['snapshot = 0']},[node('Counter: 0')],{title:'Count: 0'}),
f(3,'Each replacement reads the same snapshot.',{'Replacement queue':['replace with 1','replace with 1','replace with 1'],'Processing':['0 → 1 → 1 → 1']},[node('Counter',0,'active'),node('replace queue',1,'active')],{title:'Count: 0'}),
f(3,'Process the batched replacements and commit one.',{'Replacement result':['count = 1'],'Committed update':['after handler completes']},[node('Counter: 1',0,'changed')],{title:'Count: 1',body:'Three replacement updates'}),
f(6,'In a separate run from zero, updater functions compose on pending state.',{'Updater queue':['c => c + 1','c => c + 1','c => c + 1'],'Processing':['0 → 1 → 2 → 3']},[node('Counter',0,'active'),node('updater queue',1,'active')],{title:'Count: 0',body:'Separate run reset to zero'}),
f(6,'Commit the composed result of three.',{'Updater result':['count = 3'],'Contrast':['replacement: 1','updater: 3']},[node('Counter: 3',0,'changed')],{title:'Count: 3',body:'Three functional updates'})], 'Batching groups updates; updater functions compose against pending state while replacements use the captured snapshot.', 'https://react.dev/learn/queueing-a-series-of-state-updates'),
scene('concurrent-rendering','Concurrent Rendering',`function changeQuery(value) {
  setInput(value); // urgent controlled input
  startTransition(() => {
    setQuery(value); // non-urgent results
  });
}
// Type "r", then "re" before results finish.`,[
f(2,'An urgent update keeps the text input responsive.',{'Urgent lane':['input = r'],'Transition lane':['query = r queued']},[node('Search'),node('Input: r',1,'changed'),node('Results: previous query',1)],{title:'Search: r',body:'Results for previous query'}),
f(4,'Begin calculating the new results without committing a partial tree.',{'Urgent lane':['idle'],'Transition lane':['render query r in progress'],'Committed results':['previous query']},[node('Search'),node('Input: r',1),node('Results for r · work in progress',1,'active')],{title:'Search: r',body:'Results for previous query'}),
f(7,'New urgent input can interrupt the background render.',{'Urgent lane':['input = re'],'Transition lane':['r render interrupted','query = re queued']},[node('Search'),node('Input: re',1,'changed'),node('Results for r · abandoned',1,'removed')],{title:'Search: re',body:'Results for previous query'}),
f(4,'React restarts background work for the latest query.',{'Transition lane':['render query re'],'Committed results':['previous query'],'Model':['conceptual priority timeline, not scheduler instrumentation']},[node('Search'),node('Input: re',1),node('Results for re · calculating',1,'active')],{title:'Search: re',body:'Results for previous query'}),
f(0,'Commit the completed latest result tree together.',{'Urgent lane':['input = re'],'Transition lane':['finished'],'Committed results':['query = re']},[node('Search'),node('Input: re',1),node('Results for re',1,'changed')],{title:'Search: re',body:'Results for re'})], 'Concurrent rendering can pause or restart render work; transitions do not move JavaScript computation to another thread.', 'https://react.dev/reference/react/startTransition')
];
