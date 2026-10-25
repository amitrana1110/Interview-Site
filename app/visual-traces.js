import {backendTraces} from './backend-traces';
import {reactTraces} from './react-traces';
// Original, deterministic teaching traces. These model language behavior, not engine internals.
const frame=(line,note,panels={},output=[])=>({line,note,panels,output});
const scene=(id,title,code,frames,takeaway)=>({id,title,code:code.split('\n'),frames:[frame(0,'Ready. Predict the result, then step through the program.'),...frames],takeaway});
const javascriptTraces=[
scene('event-loop','Event Loop',`console.log('Begin');
setTimeout(() => console.log('Timer'), 0);
Promise.resolve().then(() => {
  console.log('Microtask');
}).then(() => console.log('Chained'));
console.log('Finish');`,[
frame(1,'The script runs synchronously.',{'Call stack':['script','console.log("Begin")']},['Begin']),
frame(2,'Register a timer with the browser. Zero is a minimum delay.',{'Call stack':['script'],'Web APIs':['timer: 0 ms']} ,['Begin']),
frame(3,'The fulfilled promise schedules its first reaction.',{'Call stack':['script'],'Web APIs':['timer'],'Microtask queue':['first reaction']},['Begin']),
frame(6,'Finish the synchronous script before any queued callback.',{'Call stack':['script','console.log("Finish")'],'Task queue':['timer callback'],'Microtask queue':['first reaction']},['Begin','Finish']),
frame(0,'The stack is empty. Start the microtask checkpoint.',{'Microtask queue':['first reaction'],'Task queue':['timer callback']},['Begin','Finish']),
frame(4,'Run the first reaction. Completing it settles the next promise.',{'Call stack':['first reaction'],'Task queue':['timer callback']},['Begin','Finish','Microtask']),
frame(5,'The chained reaction is appended to the microtask queue.',{'Microtask queue':['chained reaction'],'Task queue':['timer callback']},['Begin','Finish','Microtask']),
frame(5,'Drain the chained reaction before taking another task.',{'Call stack':['chained reaction'],'Task queue':['timer callback']},['Begin','Finish','Microtask','Chained']),
frame(2,'Now the event loop can take the eligible timer task.',{'Call stack':['timer callback']},['Begin','Finish','Microtask','Chained','Timer']),
frame(0,'All callbacks in this example have completed.',{},['Begin','Finish','Microtask','Chained','Timer'])], 'Microtasks drain before the next task; timers cannot interrupt synchronous work.'),
scene('hoisting','Hoisting',`console.log(score);
var score = 7;
let total = 9;
console.log(total);`,[
frame(0,'Before execution, declarations create bindings.',{'Environment':['score = undefined','total = uninitialized (TDZ)']}),
frame(1,'var can be read before its assignment.',{'Environment':['score = undefined','total = TDZ']},['undefined']),
frame(2,'Assign the var binding.',{'Environment':['score = 7','total = TDZ']},['undefined']),
frame(3,'The let declaration initializes total and ends its TDZ.',{'Environment':['score = 7','total = 9']},['undefined']),
frame(4,'Reading total now succeeds.',{'Environment':['score = 7','total = 9']},['undefined','9'])], 'Bindings are prepared before execution; source text is not moved.'),
scene('execution-context','Execution Context',`function double(n) {
  return n * 2;
}
function calculate() {
  return double(4);
}
console.log(calculate());`,[
frame(7,'Enter the global execution context.',{'Call stack':['global'],'Global bindings':['double → function','calculate → function']}),
frame(5,'Calling calculate pushes a new execution context.',{'Call stack':['global','calculate()'],'Local environment':['calculate: no parameters']}),
frame(2,'double gets its own parameter binding.',{'Call stack':['global','calculate()','double(4)'],'Local environment':['n = 4']}),
frame(5,'Return 8 and remove the double frame.',{'Call stack':['global','calculate()'],'Return value':['8']}),
frame(7,'Return from calculate; log the result.',{'Call stack':['global']},['8'])], 'Each call has its own environment and returns to its caller.'),
scene('closure','Closures',`function makeCounter() {
  let count = 0;
  return () => ++count;
}
const next = makeCounter();
console.log(next());
console.log(next());`,[
frame(2,'Create a fresh lexical environment.',{'Call stack':['makeCounter()'],'Retained environment':['count = 0']}),
frame(3,'The returned function retains access to count.',{'Bindings':['next → closure'],'Retained environment':['count = 0']}),
frame(6,'Calling the closure updates its captured binding.',{'Call stack':['next()'],'Retained environment':['count = 1']},['1']),
frame(7,'The next call uses the same binding.',{'Call stack':['next()'],'Retained environment':['count = 2']},['1','2'])], 'A closure retains access to bindings, not a frozen copy of their values.'),
scene('promises','Promises',`const p = new Promise(resolve => {
  console.log('executor');
  resolve(6);
});
p.then(n => n * 2).then(console.log);
console.log('sync');`,[
frame(2,'The executor runs immediately.',{'Promise p':['pending'],'Call stack':['executor']},['executor']),
frame(3,'Resolve with a plain value; p becomes fulfilled.',{'Promise p':['fulfilled: 6']},['executor']),
frame(5,'Register a reaction; it runs as a microtask.',{'Promise p':['fulfilled: 6'],'Microtask queue':['n => n * 2']},['executor']),
frame(6,'Synchronous code finishes first.',{'Microtask queue':['n => n * 2']},['executor','sync']),
frame(5,'The first reaction returns 12 to the next promise.',{'Chain':['p: fulfilled 6','next: fulfilled 12'],'Microtask queue':['console.log(12)']},['executor','sync']),
frame(5,'The next reaction consumes the transformed value.',{'Chain':['p: fulfilled 6','next: fulfilled 12']},['executor','sync','12'])], 'Executors run synchronously; promise reactions run asynchronously.'),
scene('this-keyword','this Keyword',`'use strict';
const team = { name: 'Orbit', read() { return this.name; } };
console.log(team.read());
const detached = team.read;
console.log(detached.call({ name: 'Nova' }));`,[
frame(2,'A regular method does not permanently bind its receiver.',{'Objects':['team → { name: Orbit, read: function }']}),
frame(3,'The method call supplies team as this.',{'Call site':['team.read()'],'this binding':['team']},['Orbit']),
frame(4,'Copy the function reference without its receiver.',{'Bindings':['detached → read function']},['Orbit']),
frame(5,'call explicitly supplies a different receiver.',{'Call site':['detached.call({ name: Nova })'],'this binding':['{ name: Nova }']},['Orbit','Nova'])], 'Regular-function this depends on the call; arrows capture this lexically.'),
scene('scope','Scope Chain',`const color = 'blue';
function outer() {
  const color = 'green';
  return function inner() { return color; };
}
console.log(outer()());`,[
frame(1,'Create the global binding.',{'Global scope':['color = blue']}),
frame(3,'outer shadows the global binding.',{'Global scope':['color = blue'],'Outer scope':['color = green']}),
frame(4,'inner stores its lexical link to outer.',{'Scope lookup':['inner → outer → global'],'Outer scope':['color = green']}),
frame(6,'No local color in inner; outer supplies the value.',{'Scope lookup':['inner: miss','outer: green (found)','global: not visited']},['green'])], 'Variable lookup follows definition-time lexical environments.'),
scene('type-coercion','Type Coercion',`console.log('8' + 2);
console.log('8' - 2);
console.log(0 == false);
console.log(0 === false);`,[
frame(1,'A string operand makes + concatenate.',{'Operands':['string: "8"','number: 2'],'Conversion':['2 → "2"'],'Result':['string: "82"']},['82']),
frame(2,'Subtraction converts the string to a number.',{'Operands':['string: "8"','number: 2'],'Conversion':['"8" → 8'],'Result':['number: 6']},['82','6']),
frame(3,'Loose equality converts false to zero.',{'Conversion':['false → 0'],'Comparison':['0 == 0 → true']},['82','6','true']),
frame(4,'Strict equality performs no type conversion.',{'Comparison':['number !== boolean'],'Result':['false']},['82','6','true','false'])], 'Coercion rules depend on the operator; strict equality avoids coercion.'),
scene('destructuring','Destructuring',`const user = { name: 'Mira', role: undefined };
const { name: label, role = 'reader' } = user;
const [first, , third] = [10, 20, 30];
console.log(label, role, first, third);`,[
frame(1,'Start with an object containing two properties.',{'Source object':['name: Mira','role: undefined']}),
frame(2,'Rename name to label. An undefined value activates the default.',{'Bindings':['label = Mira','role = reader']}),
frame(3,'Array positions determine bindings; skip index 1.',{'Array slots':['0 → first = 10','1 → skipped','2 → third = 30']}),
frame(4,'The new bindings are available independently.',{'Bindings':['label = Mira','role = reader','first = 10','third = 30']},['Mira reader 10 30'])], 'Defaults apply to undefined, including missing properties, but not null.'),
scene('spread-rest','Spread & Rest',`const original = [1, 2];
const copy = [...original, 3];
function sum(...values) {
  return values.reduce((a, b) => a + b, 0);
}
console.log(sum(...copy));`,[
frame(1,'Create the original array.',{'Arrays':['original → [1, 2]']}),
frame(2,'Spread expands iterable values into a fresh outer array.',{'Arrays':['original → [1, 2]','copy → [1, 2, 3]']}),
frame(6,'Call-site spread passes three arguments.',{'Arguments':['1','2','3']}),
frame(3,'A rest parameter collects the arguments into an array.',{'Local binding':['values → [1, 2, 3]']}),
frame(4,'Reduce the collected values.',{'Accumulator':['0 → 1 → 3 → 6']},['6'])], 'Spread expands; rest collects. Object and array copies are shallow.'),
scene('prototypal-inheritance','Prototypal Inheritance',`const base = { greet() { return 'hello'; } };
const child = Object.create(base);
child.name = 'Mira';
console.log(child.greet());
console.log(Object.hasOwn(child, 'greet'));`,[
frame(1,'Create an object with an own method.',{'Prototype chain':['base: own greet → Object.prototype → null']}),
frame(2,'child delegates property lookup to base.',{'Prototype chain':['child → base → Object.prototype → null']}),
frame(3,'Assign an own property on child.',{'Own properties':['child.name = Mira'],'Prototype chain':['child → base']}),
frame(4,'greet is missing on child; find it on base.',{'Lookup':['child.greet: miss','base.greet: found']},['hello']),
frame(5,'Inherited properties are not own properties.',{'Own properties':['child: name','base: greet']},['hello','false'])], 'Inheritance delegates lookup through prototype links; it does not copy methods.'),
scene('reference-value','Reference vs Value',`let a = 3;
let b = a;
b = 8;
const first = { score: 3 };
const second = first;
second.score = 8;
console.log(a, first.score);`,[
frame(2,'Primitive assignment copies the value.',{'Bindings':['a = 3','b = 3']}),
frame(3,'Reassigning b does not change a.',{'Bindings':['a = 3','b = 8']}),
frame(4,'Allocate an object and bind its reference.',{'References':['first → object #1'],'Heap':['#1 { score: 3 }']}),
frame(5,'Both bindings now contain the same object reference.',{'References':['first → #1','second → #1'],'Heap':['#1 { score: 3 }']}),
frame(6,'Mutation through either reference affects the same object.',{'References':['first → #1 ← second'],'Heap':['#1 { score: 8 }']}),
frame(7,'The primitive is unchanged; the shared object is mutated.',{'Bindings':['a = 3','b = 8'],'Heap':['#1 { score: 8 }']},['3 8'])], 'All arguments and assignments copy values; an object value is a reference.'),
scene('heap-stack','Heap & Stack',`function build() {
  const item = { ready: true };
  return item;
}
const result = build();
console.log(result.ready);`,[
frame(5,'Calling build creates a frame.',{'Call stack':['global','build()']}),
frame(2,'Model an object allocation and a reference from the local environment.',{'Call stack':['global','build(): item → #1'],'Heap':['#1 { ready: true }']}),
frame(3,'Return the reference; pop the function frame.',{'Call stack':['global: result → #1'],'Heap':['#1 { ready: true }']}),
frame(6,'The object remains reachable after build returns.',{'Call stack':['global'],'Heap':['#1 reachable through result']},['true'])], 'This is a conceptual memory model; engines choose actual storage representations.'),
scene('garbage-collection','Garbage Collection',`let root = { child: { value: 1 } };
let retained = root.child;
root = null;
retained = null;`,[
frame(1,'Both objects are reachable from a root binding.',{'Roots':['root → #1'],'Object graph':['#1 → child #2','#2 → value 1']}),
frame(2,'Add another path to the child object.',{'Roots':['root → #1','retained → #2'],'Object graph':['#1 → #2','#2 → value 1']}),
frame(3,'The parent is unreachable; the child still has a root path.',{'Roots':['root = null','retained → #2'],'Reachability':['#1: eligible for collection','#2: reachable']}),
frame(4,'Now both objects are unreachable.',{'Roots':['root = null','retained = null'],'Reachability':['#1: eligible','#2: eligible']})], 'Unreachable objects are eligible for collection. Collection timing is not guaranteed.'),
scene('generators-iterators','Generators & Iterators',`function* steps() {
  yield 'first';
  yield 'second';
  return 'finished';
}
const it = steps();
console.log(it.next());
console.log(it.next());
console.log(it.next());`,[
frame(6,'Calling a generator creates an iterator without running its body.',{'Generator state':['suspended at start']}),
frame(2,'next resumes until the first yield.',{'Generator state':['suspended at first yield'],'Iterator result':['value: first','done: false']},['{ value: "first", done: false }']),
frame(3,'The second next continues after the first yield.',{'Generator state':['suspended at second yield'],'Iterator result':['value: second','done: false']},['{ value: "first", done: false }','{ value: "second", done: false }']),
frame(4,'return completes the generator.',{'Generator state':['completed'],'Iterator result':['value: finished','done: true']},['{ value: "first", done: false }','{ value: "second", done: false }','{ value: "finished", done: true }'])], 'Generators preserve execution state between calls to next().'),
scene('delegation','Event Delegation',`list.addEventListener('click', event => {
  const item = event.target.closest('[data-item]');
  if (!item || !list.contains(item)) return;
  console.log(item.dataset.item);
});
// Click a span inside item "book".`,[
frame(6,'A click targets the nested span.',{'DOM path':['span (target)','button[data-item="book"]','list (listener)'],'Event phase':['target']}),
frame(1,'The click bubbles to the list listener.',{'DOM path':['span → button → list'],'Event properties':['target = span','currentTarget = list']}),
frame(2,'closest walks from span to its matching ancestor.',{'Matching':['span: no match','button: data-item = book']}),
frame(3,'Check that the match belongs to this list.',{'Guard':['item exists','list.contains(item) = true']}),
frame(4,'One ancestor listener handles the descendant interaction.',{'Event properties':['target stays span','currentTarget is list']},['book'])], 'Delegation uses propagation and matching; not every event bubbles.'),
scene('modules-imports','Modules & Imports',`// counter.js
export let count = 0;
export function increment() { count++; }
// main.js
import { count, increment } from './counter.js';
increment();
console.log(count);`,[
frame(5,'Link imports to exports before module evaluation.',{'Module graph':['main.js → counter.js'],'Import bindings':['count → counter.count','increment → counter.increment']}),
frame(2,'Evaluate the dependency and initialize its export.',{'counter.js':['count = 0'],'main.js imports':['count → live binding']}),
frame(6,'The exported function updates its module binding.',{'counter.js':['count = 1'],'main.js imports':['count reads 1']}),
frame(7,'Imports observe the current exported binding.',{'Module graph':['counter.js evaluated once for this module instance']},['1'])], 'ES module imports are live read-only bindings, not snapshots of exported values.'),
scene('async-await','Async/Await',`async function load() {
  console.log('inside');
  const value = await Promise.resolve(5);
  console.log(value);
}
load();
console.log('outside');`,[
frame(2,'An async function starts synchronously.',{'Call stack':['script','load()'],'Async result':['pending promise']},['inside']),
frame(3,'await suspends this function and schedules its continuation.',{'Call stack':['script'],'Microtask queue':['resume load with 5']},['inside']),
frame(7,'The caller continues without waiting.',{'Microtask queue':['resume load with 5']},['inside','outside']),
frame(4,'Resume after await at the microtask checkpoint.',{'Call stack':['load continuation'],'Local binding':['value = 5']},['inside','outside','5']),
frame(5,'Completing load fulfills its returned promise.',{'Async result':['fulfilled: undefined']},['inside','outside','5'])], 'await pauses the async function, not the main thread.'),
scene('debounce','Debounce & Throttle',`// Trailing debounce, 300 ms window
input('a');  // t = 0 ms
input('ab'); // t = 100 ms
input('abc');// t = 200 ms
// No more input: run at t = 500 ms
// Leading-only throttle accepts t = 0 ms.`,[
frame(2,'First input schedules a debounce callback.',{'Input events':['0 ms: a'],'Debounce timer':['due at 300 ms'],'Leading throttle':['run a at 0 ms']}),
frame(3,'Cancel the old timer and schedule from the latest input.',{'Input events':['0 ms: a','100 ms: ab'],'Debounce timer':['300 ms cancelled','due at 400 ms'],'Leading throttle':['100 ms ignored']}),
frame(4,'The latest input replaces the pending callback again.',{'Input events':['0 ms: a','100 ms: ab','200 ms: abc'],'Debounce timer':['400 ms cancelled','due at 500 ms'],'Leading throttle':['200 ms ignored']}),
frame(5,'After 300 ms of quiet, the debounce callback uses abc.',{'Debounce timer':['fired at 500 ms (illustrative)'],'Leading throttle':['only a ran in this scenario']},['debounce: abc','throttle: a'])], 'Leading and trailing options change behavior; this trace uses trailing debounce and leading-only throttle.')
];
export const traces=[...javascriptTraces.map(t=>({...t,topic:'JavaScript'})),...reactTraces,...backendTraces];
export const traceById=Object.fromEntries(traces.map(t=>[t.id,t]));
