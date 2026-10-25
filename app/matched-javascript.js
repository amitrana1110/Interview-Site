import {E,S,tree,table,queue,stack,log,phase,dom,memory,timeline} from './scenario-kit';
export const javascriptExamples={
hoisting:[
E('var Declarations',`console.log(score);
var score = 8;
console.log(score);`,[
S(0,'Create the var binding before executing statements.',{transformed:`var score;\nconsole.log(score);\nscore = 8;\nconsole.log(score);`}),S(1,'Before assignment, score contains undefined.',{output:['undefined']}),S(2,'Execute the assignment in source order.',{variables:memory(['score','8'])}),S(3,'Read the initialized binding.',{output:['undefined','8']})]),
E('Function Declarations',`console.log(greet());
function greet() { return 'Welcome'; }`,[S(0,'Initialize the function declaration before running the scope.',{transformed:`function greet() { return 'Welcome'; }\nconsole.log(greet());`}),S(1,'The function is already callable.',{output:['Welcome']})]),
E('let/const & TDZ',`console.log(total);
let total = 8;`,[S(0,'Create total without initializing it.',{transformed:`// total exists but is uninitialized (TDZ)\nconsole.log(total);\nlet total = 8;`}),S(1,'An early read throws. Execution does not reach the declaration.',{output:['ReferenceError: Cannot access total before initialization']})]),
E('Function Expressions',`run();
var run = function () { return 8; };`,[S(0,'Only the var binding is initialized early.',{transformed:`var run;\nrun();\nrun = function () { return 8; };`}),S(1,'Calling undefined throws before the assignment executes.',{output:['TypeError: run is not a function']})])],
promises:[
E('Resolve & Reject',`const good = Promise.resolve(8);
const bad = Promise.reject('offline');
good.then(console.log);
bad.catch(console.log);
console.log('sync');`,[S(1,'Fulfill the first promise.',{promise:memory(['good','fulfilled: 8'])}),S(2,'Reject the second promise; its handler is attached in this turn.',{promise:memory(['good','fulfilled: 8'],['bad','rejected: offline'])}),S(4,'Register reactions as microtasks.',{micro:queue('then(8)','catch(offline)')}),S(5,'Synchronous code runs before the reactions.',{output:['sync']}),S(3,'Run queued reactions and handle the rejection.',{micro:queue(),output:['sync','8','offline']})]),
E('Promise Chaining',`Promise.resolve(3)
  .then(n => n * 4)
  .then(n => { console.log(n); throw Error('stop'); })
  .catch(e => console.log(e.message));`,[S(1,'The first promise is fulfilled with 3.',{promise:memory(['P1','fulfilled: 3']),micro:queue('multiply reaction')}),S(2,'Returning 12 fulfills the next promise.',{promise:memory(['P1','fulfilled: 3'],['P2','fulfilled: 12']),micro:queue('log + throw reaction')}),S(3,'A thrown error rejects the next promise.',{promise:memory(['P3','rejected: stop']),micro:queue('catch reaction'),output:['12']}),S(4,'The catch handles that rejection.',{promise:memory(['P4','fulfilled: undefined']),micro:queue(),output:['12','stop']})]),
E('async/await',`async function read() {
  const n = await Promise.resolve(8);
  console.log(n);
}
read();
console.log('caller');`,[S(2,'await suspends this function and queues its continuation.',{promise:memory(['awaited','fulfilled: 8'],['read() result','pending']),micro:queue('resume read')}),S(6,'The caller continues synchronously.',{output:['caller']}),S(3,'The continuation reads 8 and completes.',{promise:memory(['read() result','fulfilled: undefined']),micro:queue(),output:['caller','8']})])],
 'this-keyword':[
E('Implicit vs Default',`'use strict';
function read() { return this?.name; }
const team = { name: 'Orbit', read };
console.log(team.read());
const detached = team.read;
console.log(detached());`,[S(3,'A method is a function stored on an object.',{objects:memory(['team','{ name: Orbit, read: function }'])}),S(4,'The method call supplies the receiver as this.',{binding:memory(['call','team.read()'],['this','team']),output:['Orbit']}),S(6,'A strict-mode plain call has undefined this.',{binding:memory(['call','detached()'],['this','undefined']),output:['Orbit','undefined']})]),
E('Explicit Binding',`function read(prefix) { return prefix + this.name; }
const person = { name: 'Mira' };
console.log(read.call(person, 'Hi '));
console.log(read.apply(person, ['Yo ']));
const fixed = read.bind(person, 'Hey ');
console.log(fixed());`,[S(2,'Prepare the explicit receiver.',{objects:memory(['person','{ name: Mira }'])}),S(3,'call passes individual arguments.',{binding:memory(['this','person'],['prefix','Hi ']),output:['Hi Mira']}),S(4,'apply passes an argument list.',{binding:memory(['this','person'],['prefix','Yo ']),output:['Hi Mira','Yo Mira']}),S(6,'bind returns a function with a fixed receiver.',{binding:memory(['this','person (bound)'],['prefix','Hey ']),output:['Hi Mira','Yo Mira','Hey Mira']})]),
E('new Binding',`function Person(name) { this.name = name; }
const user = new Person('Nova');
console.log(user.name);`,[S(2,'Allocate a new object linked to Person.prototype.',{objects:tree('Person.prototype','  new object #1'),binding:memory(['this','#1'])}),S(1,'The constructor writes to the new receiver.',{objects:memory(['#1','{ name: Nova }'])}),S(3,'new returns the constructed object.',{binding:memory(['user','#1']),output:['Nova']})]),
E('Arrow Functions',`const box = {
  name: 'Orbit',
  make() { return () => this.name; }
};
const read = box.make();
console.log(read.call({ name: 'Other' }));`,[S(5,'The regular method runs with box as this.',{objects:memory(['box','{ name: Orbit }']),binding:memory(['make this','box'])}),S(3,'The arrow captures its surrounding this.',{binding:memory(['arrow this','box (lexical)'])}),S(6,'call cannot rebind an arrow function’s this.',{output:['Orbit']})])],
scope:[
E('Identifier Lookup',`const theme = 'global';
function outer() {
  const color = 'mint';
  function inner() { return color + ' ' + theme; }
  return inner();
}
console.log(outer());`,[S(1,'Create the global scope.',{scope:tree('Global: theme = global')}),S(3,'outer has its own color binding.',{scope:tree('inner','  outer: color = mint','    global: theme = global')}),S(4,'Look for color locally, then in outer.',{lookup:log('inner: color missing','outer: color = mint FOUND')}),S(4,'theme is found in the global environment.',{lookup:log('inner: theme missing','outer: theme missing','global: theme = global FOUND')}),S(7,'Return the looked-up values.',{output:['mint global']})]),
E('Block vs Function Scope',`function demo() {
  if (true) { var a = 1; let b = 2; }
  console.log(a);
  console.log(b);
}
demo();`,[S(2,'var belongs to the function; let belongs to the block.',{scope:tree('demo: a = 1','  if block: b = 2'),lookup:log('a → function scope','b → block scope')}),S(3,'After the block, a is still visible.',{output:['1']}),S(4,'There is no b binding in this lookup chain.',{lookup:log('demo: b missing','global: b missing'),output:['1','ReferenceError: b is not defined']})]),
E('Lexical Scope',`const name = 'global';
function read() { return name; }
function caller() {
  const name = 'caller';
  return read();
}
console.log(caller());`,[S(2,'read closes over the environment where it is defined.',{scope:tree('read','  global: name = global')}),S(4,'The caller creates a different local name.',{scope:tree('caller: name = caller','read → global: name = global')}),S(5,'Calling read does not replace its lexical environment.',{lookup:log('read: local name missing','global: name = global FOUND')}),S(7,'The global binding supplies the result.',{output:['global']})])],
 'type-coercion':[
E('Loose vs Strict',`console.log('6' == 6);
console.log('6' === 6);
console.log(false == 0);`,[S(1,'Loose equality converts these operands before comparison.',{coercion:log('string "6" → number 6','6 == 6 → true'),output:['true']}),S(2,'Strict equality rejects different types without conversion.',{coercion:log('string versus number → false'),output:['true','false']}),S(3,'For loose equality, false converts to zero.',{coercion:log('false → 0','0 == 0 → true'),output:['true','false','true']})]),
E('Truthy & Falsy',`console.log(Boolean(''));
console.log(Boolean('0'));
console.log(Boolean([]));
console.log(Boolean(0));`,[S(1,'The empty string is falsy.',{coercion:log('ToBoolean("") → false'),output:['false']}),S(2,'A nonempty string is truthy, even when it contains zero.',{coercion:log('ToBoolean("0") → true'),output:['false','true']}),S(3,'An array object is truthy.',{coercion:log('ToBoolean([]) → true'),output:['false','true','true']}),S(4,'Numeric zero is falsy.',{coercion:log('ToBoolean(0) → false'),output:['false','true','true','false']})]),
E('null & undefined',`console.log(null == undefined);
console.log(null === undefined);
console.log(null == 0);
console.log(Number(null), Number(undefined));`,[S(1,'Loose equality has a specific null/undefined rule.',{coercion:log('null == undefined → true'),output:['true']}),S(2,'Strict equality preserves their different types.',{coercion:log('null !== undefined'),output:['true','false']}),S(3,'null is not loosely equal to zero.',{coercion:log('null == 0 → false'),output:['true','false','false']}),S(4,'Explicit number conversion follows different rules.',{coercion:log('Number(null) → 0','Number(undefined) → NaN'),output:['true','false','false','0 NaN']})]),
E('NaN Quirks',`const value = Number('oops');
console.log(value === value);
console.log(Number.isNaN(value));
console.log(Object.is(value, value));`,[S(1,'An invalid numeric conversion produces NaN.',{coercion:log('Number("oops") → NaN')}),S(2,'NaN is unequal to itself under strict equality.',{coercion:log('NaN === NaN → false'),output:['false']}),S(3,'Number.isNaN checks for the numeric NaN value.',{output:['false','true']}),S(4,'Object.is treats two NaN values as the same value.',{output:['false','true','true']})])],
destructuring:[
E('Array Destructuring',`const source = [4, 8, 12];
const [first, , third] = source;
console.log(first, third);`,[S(1,'Array destructuring reads iterable positions.',{variables:memory(['source','[4, 8, 12]'])}),S(2,'Bind positions zero and two; skip position one.',{variables:memory(['first','4'],['third','12'])}),S(3,'Read the new bindings.',{output:['4 12']})]),
E('Object Destructuring',`const source = { name: 'Mira', role: 'reader' };
const { name: label, role } = source;
console.log(label, role);`,[S(1,'Object properties are matched by name.',{variables:memory(['source','{ name: Mira, role: reader }'])}),S(2,'Rename name to label while keeping role’s name.',{variables:memory(['label','Mira'],['role','reader'])}),S(3,'Read the bound values.',{output:['Mira reader']})]),
E('Defaults & Nested',`const user = { settings: { theme: undefined } };
const { settings: { theme = 'light' } } = user;
console.log(theme);`,[S(1,'The settings property contains a nested object.',{variables:memory(['user.settings','{ theme: undefined }'])}),S(2,'The undefined property activates the default.',{variables:memory(['theme','light'])}),S(3,'The default becomes the local binding.',{output:['light']})]),
E('Function Parameters',`function describe({ name, role = 'reader' }) {
  return name + ': ' + role;
}
console.log(describe({ name: 'Nova' }));`,[S(4,'Pass an object as the argument.',{variables:memory(['argument','{ name: Nova }'])}),S(1,'Destructure the parameter and fill its missing role.',{variables:memory(['name','Nova'],['role','reader'])}),S(2,'Use the local parameter bindings.',{output:['Nova: reader']})])],
 'spread-rest':[
E('Array Spread',`const a = [1, 2];
const b = [...a, 3];
const c = [0, ...b];
console.log(c);`,[S(1,'Create the original array.',{variables:memory(['a','[1, 2]'])}),S(2,'Expand a into a new outer array.',{variables:memory(['a','[1, 2]'],['b','[1, 2, 3]'])}),S(3,'Spread preserves order while building another array.',{variables:memory(['c','[0, 1, 2, 3]'])}),S(4,'The original array is unchanged.',{output:['[0, 1, 2, 3]']})]),
E('Object Spread',`const base = { theme: 'light', size: 2 };
const next = { ...base, theme: 'dark' };
console.log(base.theme, next.theme);`,[S(1,'Prepare the source object.',{variables:memory(['base','{ theme: light, size: 2 }'])}),S(2,'Copy own enumerable properties, then override theme.',{variables:memory(['base.theme','light'],['next.theme','dark'],['next.size','2'])}),S(3,'Only the new outer object has the overridden value.',{output:['light dark']})]),
E('Rest Parameters',`function sum(...values) {
  return values.reduce((a, b) => a + b, 0);
}
console.log(sum(2, 4, 6));`,[S(4,'Pass three separate arguments.',{variables:memory(['arguments','2, 4, 6'])}),S(1,'Rest collects all arguments into an array.',{variables:memory(['values','[2, 4, 6]'])}),S(2,'Reduce the collected values.',{variables:memory(['accumulator','0 → 2 → 6 → 12']),output:['12']})]),
E('Rest in Destructuring',`const [head, ...tail] = [2, 4, 6];
const { name, ...details } = { name: 'Mira', age: 30, role: 'reader' };
console.log(head, tail, details);`,[S(1,'Rest gathers the remaining iterable values.',{variables:memory(['head','2'],['tail','[4, 6]'])}),S(2,'Object rest copies the properties not already picked.',{variables:memory(['name','Mira'],['details','{ age: 30, role: reader }'])}),S(3,'The rest bindings hold new outer containers.',{output:['2 [4, 6] { age: 30, role: reader }']})])],
 'prototypal-inheritance':[
E('Object.create',`const base = { greet() { return 'hello'; } };
const child = Object.create(base);
console.log(child.greet());`,[S(1,'The base owns greet.',{prototype:tree('base: greet()','  Object.prototype','    null')}),S(2,'The new object delegates to base.',{prototype:tree('child','  base: greet()','    Object.prototype','      null')}),S(3,'Lookup walks to base and finds the method.',{output:['hello']})]),
E('new, instanceof & Inheritance',`function Animal() {}
Animal.prototype.move = () => 'moving';
function Dog() {}
Dog.prototype = Object.create(Animal.prototype);
const pet = new Dog();
console.log(pet instanceof Animal, pet.move());`,[S(4,'Link the derived prototype to Animal.prototype.',{prototype:tree('Dog.prototype','  Animal.prototype: move()','    Object.prototype')}),S(5,'new links pet to Dog.prototype.',{prototype:tree('pet','  Dog.prototype','    Animal.prototype','      Object.prototype')}),S(6,'instanceof searches the prototype chain.',{output:['true moving']})]),
E('Property Shadowing',`const base = { color: 'blue' };
const child = Object.create(base);
child.color = 'green';
delete child.color;
console.log(child.color);`,[S(2,'The inherited value is initially blue.',{prototype:tree('child (no own color)','  base: color = blue')}),S(3,'An own property shadows the inherited property.',{prototype:tree('child: color = green','  base: color = blue')}),S(4,'Delete the own property to reveal the inherited one.',{prototype:tree('child (no own color)','  base: color = blue')}),S(5,'Lookup reaches base again.',{output:['blue']})])],
 'reference-value':[
E('Primitives (By Value)',`let a = 5;
let b = a;
b = 9;
console.log(a, b);`,[S(2,'Copy the primitive value into b.',{memory:memory(['a','5'],['b','5'])}),S(3,'Reassign b independently.',{memory:memory(['a','5'],['b','9'])}),S(4,'a keeps its original value.',{output:['5 9']})]),
E('Object Reference',`const a = { count: 1 };
const b = a;
b.count++;
console.log(a.count);`,[S(1,'Allocate one object.',{memory:memory(['a','→ object #1'],['#1','{ count: 1 }'])}),S(2,'Assignment copies the object reference.',{memory:memory(['a','→ #1'],['b','→ #1'],['#1','{ count: 1 }'])}),S(3,'Both bindings refer to the same mutated object.',{memory:memory(['a, b','→ #1'],['#1','{ count: 2 }'])}),S(4,'Read through a to see that mutation.',{output:['2']})]),
E('Shallow Copy',`const a = { nested: { count: 1 } };
const b = { ...a };
b.nested.count = 9;
console.log(a.nested.count);`,[S(1,'The outer object refers to a nested object.',{memory:memory(['a','→ #1'],['#1.nested','→ #2'],['#2.count','1'])}),S(2,'Spread copies only the outer level.',{memory:memory(['a','→ #1'],['b','→ #3'],['#1.nested, #3.nested','→ #2'])}),S(3,'The nested reference is still shared.',{memory:memory(['#2.count','9'])}),S(4,'The original observes the nested mutation.',{output:['9']})]),
E('Deep Copy',`const a = { nested: { count: 1 } };
const b = structuredClone(a);
b.nested.count = 9;
console.log(a.nested.count, b.nested.count);`,[S(2,'structuredClone copies this supported object graph.',{memory:memory(['a.nested','→ #2 { count: 1 }'],['b.nested','→ #4 { count: 1 }'])}),S(3,'The cloned nested object is independent.',{memory:memory(['#2.count','1'],['#4.count','9'])}),S(4,'The two graphs hold different values.',{output:['1 9']})])]
};
Object.assign(javascriptExamples,{
 'heap-stack':[
E('Primitives on the Stack',`let count = 3;
let label = 'ready';
count++;
console.log(count);`,[S(1,'Model a local binding with a primitive value.',{stack:stack('global: count = 3'),heap:memory()}),S(2,'Add a second binding to the current frame.',{stack:stack('global: count = 3, label = ready')}),S(3,'Update the numeric value. Actual storage is engine-dependent.',{stack:stack('global: count = 4, label = ready')}),S(4,'Read the current binding.',{output:['4']})]),
E('Objects on the Heap',`const item = { name: 'Mira' };
const alias = item;
alias.name = 'Nova';
console.log(item.name);`,[S(1,'Model an object allocation and its reference.',{stack:stack('global: item → #1'),heap:memory(['#1','{ name: Mira }'])}),S(2,'Both bindings hold the same reference.',{stack:stack('global: item → #1, alias → #1')}),S(3,'Mutation changes the shared object.',{heap:memory(['#1','{ name: Nova }'])}),S(4,'Both references observe the updated property.',{output:['Nova']})]),
E('Nested Function Calls',`function outer() { return inner(4); }
function inner(n) { return n * 2; }
console.log(outer());`,[S(3,'The global code calls outer.',{stack:stack('global','outer()'),heap:memory()}),S(1,'outer calls inner, adding another execution frame.',{stack:stack('global','outer()','inner(): n = 4')}),S(2,'Return 8 and remove inner’s frame.',{stack:stack('global','outer()')}),S(3,'outer returns, then global code logs the result.',{stack:stack('global'),output:['8']})]),
E('Garbage Collection',`let item = { count: 1 };
let alias = item;
item = null;
alias = null;`,[S(1,'A reachable binding keeps this object alive.',{stack:stack('global: item → #1'),heap:memory(['#1','reachable'])}),S(2,'Add a second root path.',{stack:stack('global: item → #1, alias → #1')}),S(3,'Removing one reference does not make the object unreachable.',{stack:stack('global: item = null, alias → #1'),heap:memory(['#1','still reachable'])}),S(4,'With no root path, the object is eligible for collection; timing is unspecified.',{stack:stack('global: item = null, alias = null'),heap:memory(['#1','unreachable / eligible'])})])],
 'garbage-collection':[
E('Mark and Sweep',`let root = { child: {} };
let retained = root.child;
root = null;
retained = null;`,[S(1,'Mark objects reachable from roots.',{roots:memory(['root','→ #1']),heap:tree('#1 reachable','  #2 child reachable')}),S(2,'The child gains an independent root path.',{roots:memory(['root','→ #1'],['retained','→ #2'])}),S(3,'The parent becomes unreachable, but the child remains reachable.',{roots:memory(['retained','→ #2']),heap:tree('#1 unreachable / eligible','#2 reachable')}),S(4,'Remove the final root. Both objects are now eligible; collection is not immediate.',{roots:memory(['root','null'],['retained','null']),heap:tree('#1 eligible','#2 eligible')})]),
E('Forgotten Timer Leak',`let payload = new Array(1000).fill('data');
const held = payload;
const timer = setInterval(() => consume(held), 1000);
payload = null;
clearInterval(timer);`,[S(3,'The timer callback retains its captured data.',{roots:tree('timer registry','  callback closure','    held → array #1'),heap:memory(['array #1','reachable: 1000 entries'])}),S(4,'Clearing a different reference does not remove the timer’s reference path.',{roots:tree('timer registry','  callback closure → held'),heap:memory(['array #1','still retained by closure'])}),S(5,'Cancel the timer. Collection still depends on other live bindings and reachability.',{roots:tree('held binding (if still live)'),heap:memory(['array #1','eligible only after all root paths disappear'])})]),
E('Closure Leak',`function makeReader() {
  const data = new Array(1000).fill('record');
  return () => data.length;
}
let reader = makeReader();
reader = null;`,[S(2,'The factory allocates a large array.',{roots:tree('makeReader frame','  data → array #1'),heap:memory(['#1','1000 records'])}),S(5,'Keeping the returned closure keeps its captured binding accessible.',{roots:tree('reader','  closure environment','    data → #1'),heap:memory(['#1','reachable through reader'])}),S(6,'Releasing the closure removes that root path.',{roots:tree('reader = null'),heap:memory(['#1','eligible if no other root path exists'])})]),
E('WeakRef',`let object = { name: 'Mira' };
const weak = new WeakRef(object);
object = null;
const value = weak.deref();
console.log(value?.name ?? 'unavailable');`,[S(2,'A WeakRef does not by itself strongly retain its target.',{roots:memory(['object','strong → #1'],['weak','weak → #1']),heap:memory(['#1','{ name: Mira }'])}),S(3,'Remove the strong reference. Collection timing cannot be predicted.',{roots:memory(['weak','weak → #1']),heap:memory(['#1','may be collected in a later job'])}),S(4,'Within the creation job, the target is kept alive. In a later job deref may return undefined.',{heap:memory(['deref result','object in this job; maybe undefined in a later job'])}),S(5,'This same-job example observes the target.',{output:['Mira']})])],
 'generators-iterators':[
E('Basic yield',`function* sequence() { yield 'A'; yield 'B'; return 'done'; }
const iterator = sequence();
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());`,[S(2,'Calling a generator creates an iterator without running its body.',{generator:phase('SUSPENDED START'),flow:log('caller → sequence(): iterator')}),S(3,'next resumes through the first yield.',{generator:phase('SUSPENDED YIELD','value A'),flow:log('caller → next()','generator → caller: A'),output:['{ value: A, done: false }']}),S(4,'The next call continues after the first yield.',{generator:phase('SUSPENDED YIELD','value B'),output:['{ value: A, done: false }','{ value: B, done: false }']}),S(5,'return completes the generator.',{generator:phase('COMPLETED'),flow:log('return done → caller'),output:['{ value: A, done: false }','{ value: B, done: false }','{ value: done, done: true }']})]),
E('Two-way Data Flow',`function* calculate() {
  const n = yield 'send a number';
  return n * 3;
}
const iterator = calculate();
console.log(iterator.next());
console.log(iterator.next(4));`,[S(5,'Create the suspended iterator.',{generator:phase('SUSPENDED START'),flow:log('calculate() → iterator')}),S(6,'The first next runs up to yield and returns the prompt.',{generator:phase('SUSPENDED YIELD'),flow:log('generator → caller: send a number'),output:['{ value: send a number, done: false }']}),S(7,'The next input becomes the value of the suspended yield expression.',{generator:phase('RUNNING','n = 4'),flow:log('caller → generator: 4')}),S(3,'Return the calculated result.',{generator:phase('COMPLETED'),output:['{ value: send a number, done: false }','{ value: 12, done: true }']})]),
E('Iterator Protocol',`const iterable = {
  *[Symbol.iterator]() { yield 2; yield 4; }
};
for (const value of iterable) console.log(value);`,[S(4,'for…of obtains an iterator through Symbol.iterator.',{generator:phase('ITERATOR CREATED'),flow:log('for…of → Symbol.iterator()')}),S(2,'next returns the first value with done=false.',{generator:phase('SUSPENDED YIELD'),flow:log('next → { value: 2, done: false }'),output:['2']}),S(2,'The loop asks for another value.',{flow:log('next → { value: 4, done: false }'),output:['2','4']}),S(4,'The final done=true response ends the loop.',{generator:phase('COMPLETED'),flow:log('next → { value: undefined, done: true }')})])],
delegation:[
E('Capture & Bubble',`outer.addEventListener('click', () => log('capture'), true);
button.addEventListener('click', () => log('target'));
outer.addEventListener('click', () => log('bubble'));
button.click();`,[S(4,'A click targets the button.',{domtree:tree('outer','  button [target]'),path:queue('capture: document → outer → button')}),S(1,'The ancestor capture listener runs on the way down.',{path:queue('outer [capture]','button [target]'),output:['capture']}),S(2,'Run the target listener.',{path:queue('button [target]'),output:['capture','target']}),S(3,'Bubble back to the ancestor.',{path:queue('button → outer [bubble]'),output:['capture','target','bubble']})]),
E('stopPropagation',`outer.addEventListener('click', () => log('outer'));
button.addEventListener('click', event => {
  log('button'); event.stopPropagation();
});
button.click();`,[S(5,'Dispatch a bubbling click at the button.',{domtree:tree('outer','  button [target]'),path:queue('button → outer')}),S(3,'The target listener stops further propagation.',{path:queue('button [stopPropagation]'),output:['button']}),S(5,'The outer bubble listener is not reached. Other listeners on the same target are not stopped by this method alone.',{path:log('outer: skipped'),output:['button']})]),
E('Event Delegation',`list.addEventListener('click', event => {
  const item = event.target.closest('[data-id]');
  if (item && list.contains(item)) log(item.dataset.id);
});
// Click the span inside button[data-id="7"].`,[S(5,'The nested span is the original target.',{domtree:tree('list [listener]','  button data-id=7','    span [target]'),path:queue('span → button → list')}),S(1,'The event bubbles to the single list listener.',{path:memory(['target','span'],['currentTarget','list'])}),S(2,'closest locates the button carrying the data attribute.',{path:log('span: no data-id','button: data-id=7 FOUND')}),S(3,'The containment guard accepts the matched item.',{output:['7']})])],
 'modules-imports':[
E('Named & Default Exports',`// values.js
export const tax = 2;
export default function double(n) { return n * 2; }
// main.js
import double, { tax } from './values.js';
console.log(double(tax));`,[S(5,'Link the importer to both exports.',{modules:tree('main.js','  values.js'),bindings:memory(['double','default export'],['tax','named export'])}),S(2,'Evaluate the dependency once for this module instance.',{bindings:memory(['tax','2'],['double','function'])}),S(6,'Use the imported bindings.',{output:['4']})]),
E('Live Bindings',`// counter.js
export let count = 0;
export function increment() { count++; }
// main.js
import { count, increment } from './counter.js';
increment();
console.log(count);`,[S(5,'Imports link to exported bindings rather than copying a snapshot.',{modules:tree('main.js','  counter.js'),bindings:memory(['main.count','→ counter.count = 0'])}),S(6,'The exported function updates its module binding.',{bindings:memory(['counter.count','1'],['main.count','reads current value 1'])}),S(7,'The importer observes the updated value.',{output:['1']})]),
E('Circular Dependencies',`// a.js
import { b } from './b.js';
export const a = 'A';
// b.js
import { a } from './a.js';
export const b = a + 'B';`,[S(2,'Link the cycle without evaluating declarations yet.',{modules:tree('a.js [linking]','  b.js [linking]','    ↻ a.js (cycle)'),bindings:memory(['a','uninitialized'],['b','uninitialized'])}),S(6,'Evaluation reaches a read of a before its initialization.',{bindings:memory(['a','TDZ'],['b','initializer waiting'])}),S(6,'A live binding does not bypass the temporal dead zone.',{output:['ReferenceError: Cannot access a before initialization']})])],
 'async-await':[
E('await yields to the caller',`async function load() {
  console.log('inside');
  const n = await Promise.resolve(4);
  console.log(n);
}
load();
console.log('outside');`,[S(2,'Start the async function synchronously.',{stack:stack('script','load()'),async:phase('RUNNING'),output:['inside']}),S(3,'await suspends this function and queues its continuation.',{stack:stack('script'),micro:queue('resume load(4)'),async:phase('SUSPENDED')}),S(7,'The caller runs before the continuation.',{output:['inside','outside']}),S(4,'Resume during the microtask checkpoint.',{stack:stack('load continuation'),micro:queue(),async:phase('COMPLETED'),output:['inside','outside','4']})]),
E('Sequential vs Promise.all',`// Each wait resolves after about 100 ms.
await wait('A');
await wait('B');
// Independent comparison:
await Promise.all([wait('A'), wait('B')]);`,[S(2,'Sequential execution starts only A.',{stack:stack('async caller'),timers:queue('A: pending 100 ms'),micro:queue(),timeline:timeline({time:0,label:'A starts',state:'active'})}),S(3,'After A resolves, start B.',{timers:queue('B: pending 100 ms'),timeline:timeline({time:0,label:'A starts',state:'done'},{time:100,label:'B starts',state:'active'})}),S(3,'Sequential work takes roughly two waits.',{timers:queue(),output:['sequential: A then B'],timeline:timeline({time:0,label:'A',state:'done'},{time:100,label:'B',state:'done'},{time:200,label:'complete',state:'done'})}),S(5,'In an independent run, create both promises before awaiting.',{timers:queue('A pending','B pending'),timeline:timeline({time:0,label:'A + B start',state:'active'})}),S(5,'Both independent waits can finish in roughly one wait interval.',{timers:queue(),output:['sequential: A then B','parallel: A and B'],timeline:timeline({time:0,label:'A + B',state:'done'},{time:100,label:'complete',state:'done'})})]),
E('Errors and try/catch',`async function load() {
  try { await Promise.reject(Error('offline')); }
  catch (error) { console.log(error.message); }
  finally { console.log('cleanup'); }
}
load();
console.log('caller');`,[S(2,'await a rejected promise and suspend.',{stack:stack('script'),micro:queue('resume with rejection'),async:phase('SUSPENDED')}),S(7,'The caller continues synchronously.',{output:['caller']}),S(3,'Resuming with rejection throws inside the async function and enters catch.',{stack:stack('load catch'),micro:queue(),async:phase('HANDLING ERROR'),output:['caller','offline']}),S(4,'finally runs before the async function completes.',{async:phase('COMPLETED'),stack:stack(),output:['caller','offline','cleanup']})])],
debounce:[
E('Debounce a search input',`function debounce(fn, delay) {
  let timer;
  return value => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(value), delay);
  };
}
// Inputs at 0, 100, 200 ms; delay = 300 ms.`,[S(8,'The first input schedules a callback.',{timeline:timeline({time:0,label:'a',state:'active'}),timer:phase('SCHEDULED','due at 300 ms'),closure:memory(['latest input','a'])}),S(4,'The second input cancels and replaces the timer.',{timeline:timeline({time:0,label:'a',state:'done'},{time:100,label:'ab',state:'active'}),timer:phase('RESET','due at 400 ms'),closure:memory(['latest input','ab'])}),S(5,'The third input moves the deadline again.',{timeline:timeline({time:0,label:'a',state:'done'},{time:100,label:'ab',state:'done'},{time:200,label:'abc',state:'active'}),timer:phase('RESET','due at 500 ms'),closure:memory(['latest input','abc'])}),S(5,'After quiet time, run only the latest callback.',{timer:phase('FIRED','500 ms (illustrative)'),output:['search abc']})]),
E('Throttle a scroll handler',`function throttle(fn, delay) {
  let last = -Infinity;
  return value => {
    const now = performance.now();
    if (now - last < delay) return;
    last = now; fn(value);
  };
}
// Leading-only: events at 0, 100, 350 ms; interval 300 ms.`,[S(6,'Accept the first event immediately.',{timeline:timeline({time:0,label:'scroll A',state:'done'}),timer:phase('WINDOW','next eligible at 300 ms'),throttle:memory(['last execution','0 ms']),output:['A']}),S(5,'Ignore an event inside the throttle interval.',{timeline:timeline({time:0,label:'A',state:'done'},{time:100,label:'B ignored',state:'error'}),throttle:memory(['last execution','0 ms']),output:['A']}),S(6,'A later event is eligible and runs.',{timeline:timeline({time:0,label:'A',state:'done'},{time:100,label:'B ignored',state:'error'},{time:350,label:'C',state:'done'}),timer:phase('WINDOW','next eligible at 650 ms'),throttle:memory(['last execution','350 ms']),output:['A','C']})]),
E('Choosing between them',`// Inputs: 0, 100, 200, 400 ms.
// Trailing debounce: delay 300 ms.
// Leading-only throttle: interval 300 ms.`,[S(1,'Both receive the same event stream.',{timeline:timeline({time:0,label:'A'},{time:100,label:'B'},{time:200,label:'C'},{time:400,label:'D'}),comparison:table(['Strategy','Behavior'],['Debounce','wait for quiet'],['Throttle','limit frequency'])}),S(3,'Throttle accepts A at 0 and D at 400.',{comparison:table(['Strategy','Callbacks'],['Debounce','still waiting'],['Throttle','0 ms: A, 400 ms: D']),output:['throttle A','throttle D']}),S(2,'Debounce runs D at 700 after the final quiet interval.',{comparison:table(['Strategy','Callbacks'],['Debounce','700 ms: D'],['Throttle','0 ms: A, 400 ms: D']),output:['throttle A','throttle D','debounce D']})])]
});
Object.assign(javascriptExamples,{
 'event-loop':[E('Default',`console.log('Begin');
setTimeout(() => console.log('Timer'), 0);
Promise.resolve()
  .then(() => console.log('First microtask'))
  .then(() => console.log('Second microtask'));
console.log('Finish');`,[
S(1,'Execute the synchronous script.',{stack:stack('script','console.log(Begin)'),apis:queue(),micro:queue(),tasks:queue(),loop:phase('SCRIPT RUNNING'),output:['Begin']}),
S(2,'Register a browser timer without interrupting the script.',{stack:stack('script','setTimeout'),apis:queue('timer: 0 ms minimum')}),
S(3,'The fulfilled promise schedules its first reaction.',{stack:stack('script'),micro:queue('first reaction')}),
S(6,'Finish synchronous logging.',{stack:stack('script','console.log(Finish)'),tasks:queue('timer callback'),apis:queue(),output:['Begin','Finish']}),
S(0,'At the end of the task, reach the microtask checkpoint.',{stack:stack(),loop:phase('MICROTASK CHECKPOINT')}),
S(4,'Run the first reaction and settle the next promise.',{stack:stack('first reaction'),micro:queue(),output:['Begin','Finish','First microtask']}),
S(5,'Queue the chained reaction.',{stack:stack(),micro:queue('second reaction')}),
S(5,'Drain that reaction before the next task.',{stack:stack('second reaction'),micro:queue(),output:['Begin','Finish','First microtask','Second microtask']}),
S(2,'Take the eligible timer task.',{stack:stack('timer callback'),tasks:queue(),loop:phase('TASK RUNNING'),output:['Begin','Finish','First microtask','Second microtask','Timer']}),
S(0,'This example has no remaining work.',{stack:stack(),loop:phase('IDLE')})])],
 'execution-context':[E('Default',`const factor = 2;
function outer(n) {
  function inner(value) { return value * factor; }
  return inner(n);
}
console.log(outer(4));`,[
S(0,'Create the global environment before execution.',{phase:phase('CREATION'),contexts:stack('global'),activity:log('Register outer function','factor uninitialized')}),
S(1,'Execute the global declaration.',{phase:phase('EXECUTION'),activity:log('factor = 2')}),
S(6,'Call outer and create its execution context.',{contexts:stack('global','outer: n = 4'),activity:log('Push outer context','Bind n = 4')}),
S(4,'Call inner with a separate local parameter environment.',{contexts:stack('global','outer: n = 4','inner: value = 4'),activity:log('Push inner context','Read lexical factor = 2')}),
S(3,'Return 8 and remove the inner context.',{contexts:stack('global','outer: n = 4'),activity:log('inner returns 8','Pop inner context')}),
S(6,'outer returns; global code logs its result.',{contexts:stack('global'),phase:phase('EXECUTION'),activity:log('Pop outer context','Log 8'),output:['8']})])],
closure:[E('Default',`function makeCounter() {
  let count = 0;
  return function next() {
    count++;
    return count;
  };
}
const next = makeCounter();
console.log(next());
console.log(next());`,[
S(8,'Call the factory and create a new lexical environment.',{stack:stack('global','makeCounter()'),scope:tree('makeCounter environment','  count = 0','  next function → this environment')}),
S(3,'Return a function that retains access to the count binding.',{stack:stack('global'),scope:tree('next binding → closure','  retained environment','    count = 0')}),
S(9,'The first call updates the retained count.',{stack:stack('global','next()'),scope:tree('next() environment','  retained makeCounter environment','    count = 1'),output:['1']}),
S(10,'The next call uses that same binding.',{scope:tree('next() environment','  retained makeCounter environment','    count = 2'),output:['1','2']}),
S(0,'The factory frame is gone, but its environment remains reachable.',{stack:stack('global')})])]
});
