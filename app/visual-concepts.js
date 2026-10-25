import {traces} from './visual-traces';
const sources={
'event-loop':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model',
hoisting:'https://developer.mozilla.org/en-US/docs/Glossary/Hoisting',
'execution-context':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model',
closure:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures',
promises:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises',
 'this-keyword':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this',
scope:'https://developer.mozilla.org/en-US/docs/Glossary/Scope',
 'type-coercion':'https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion',
destructuring:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring',
 'spread-rest':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax',
 'prototypal-inheritance':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain',
 'reference-value':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects',
 'heap-stack':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model',
 'garbage-collection':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management',
 'generators-iterators':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators',
delegation:'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling',
 'modules-imports':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules',
 'async-await':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
debounce:'https://developer.mozilla.org/en-US/docs/Glossary/Debounce'
};
export const visualConcepts=traces.map(t=>({id:t.id,topic:t.topic,title:t.title,subtitle:t.takeaway,kind:'STEP-BY-STEP VISUALIZATION',time:'5 min',challenge:t.topic==='Backend'?'Predict the system decision. Follow each request, data change, and failure path using the timeline.':t.topic==='React'?'Predict which components and DOM nodes change. Step through the tree and compare rendering with the committed UI.':'Predict the output. Use Play or Step forward to follow each state change; scrub back to compare earlier states.',explanation:t.takeaway,takeaway:t.takeaway,source:t.source||sources[t.id]}));
