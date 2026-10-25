import {parse} from 'acorn';
import {E,S,stack,queue,phase} from './scenario-kit';

// Deliberately small interpreter: source is parsed as data, never eval'd.
// No DOM, network, property mutation, loops, or access to browser globals.
export function compileEventLoop(source){
 if(source.length>1000||source.split('\n').length>25)throw Error('Use at most 25 lines and 1000 characters.');
 const program=parse(source,{ecmaVersion:2022,locations:true});
 const events=[],micro=[],timers=[],output=[],callStack=['script'];let operations=0,clock=0,nextId=1;
 const env=(parent=null)=>({parent,bindings:new Map(),constants:new Set()});const global=env();
 function spend(){if(++operations>4000||events.length>200)throw Error('This example exceeds the sandbox operation limit.');}
 function emit(line,note){spend();events.push(S(line,note,{stack:stack(...callStack),apis:queue(...timers.filter(t=>t.due>clock).map(t=>t.label+' · '+(t.due-clock)+' ms remaining')),tasks:queue(...timers.filter(t=>t.due<=clock).map(t=>t.label)),micro:queue(...micro.map(t=>t.label)),loop:phase(callStack.length?'EXECUTING':micro.length?'MICROTASK CHECKPOINT':'IDLE'),output:[...output]}));}
 function set(e,name,value){for(let scope=e;scope;scope=scope.parent)if(scope.bindings.has(name)){if(scope.constants.has(name))throw Error('Assignment to constant binding: '+name);scope.bindings.set(name,value);return value;}throw Error('Unknown binding: '+name)}
 function get(e,name){if(name==='undefined')return undefined;for(let scope=e;scope;scope=scope.parent)if(scope.bindings.has(name))return scope.bindings.get(name);throw Error('Unsupported or unknown identifier: '+name)}
 function fn(node,e){if(node.params.some(p=>p.type!=='Identifier'))throw Error('Use simple named parameters.');return {kind:'function',node,env:e,name:node.id?.name||'callback'}}
 function text(value){if(value?.kind==='promise')return '[Promise '+value.state+']';if(value?.kind==='function')return '[Function]';return String(value)}
 class P {
  constructor(){this.kind='promise';this.state='pending';this.value=undefined;this.reactions=[]}
  settle(state,value){if(this.state!=='pending')return;if(value instanceof P){value.listen(v=>this.settle('fulfilled',v),e=>this.settle('rejected',e));return;}this.state=state;this.value=value;this.reactions.splice(0).forEach(r=>this.schedule(r))}
  schedule(r){const label='promise reaction #'+nextId++;micro.push({label,line:r.line,run:()=>{try{const handler=this.state==='fulfilled'?r.good:r.bad;if(handler)r.next.settle('fulfilled',handler(this.value));else r.next.settle(this.state,this.value)}catch(error){r.next.settle('rejected',error)}}})}
  listen(good,bad,line=0){const next=new P(),reaction={good,bad,next,line};if(this.state==='pending')this.reactions.push(reaction);else this.schedule(reaction);return next}
 }
 const resolved=value=>{const p=new P();p.settle('fulfilled',value);return p};
 function sync(generator){const result=generator.next();if(!result.done)throw Error('await is supported only inside async functions.');return result.value}
 function invoke(func,args,line){spend();if(func?.native)return func.native(...args);if(func?.kind!=='function')throw Error('The callback must be a function.');const local=env(func.env);func.node.params.forEach((p,i)=>local.bindings.set(p.name,args[i]));const iterator=func.node.body.type==='BlockStatement'?body(func.node.body.body,local):expr(func.node.body,local);if(!func.node.async){callStack.push(func.name);try{return sync(iterator)}finally{callStack.pop()}}
  const result=new P();function resume(value,failed=false){callStack.push(func.name);try{const step=failed?iterator.throw(value):iterator.next(value);if(step.done)result.settle('fulfilled',step.value);else {const awaited=step.value;emit(line,'await suspends '+func.name+' and schedules a continuation.');(awaited instanceof P?awaited:resolved(awaited)).listen(v=>resume(v),e=>resume(e,true),line)}}catch(error){result.settle('rejected',error)}finally{callStack.pop()}}resume();return result;
 }
 function* expr(node,e){spend();if(!node)return undefined;const line=node.loc.start.line;
  switch(node.type){
   case 'Literal': if(node.regex)throw Error('Regular expressions are outside this sandbox.');return node.value;
   case 'Identifier':return get(e,node.name);
   case 'ArrowFunctionExpression':case 'FunctionExpression':return fn(node,e);
   case 'AwaitExpression':return yield (yield* expr(node.argument,e));
   case 'TemplateLiteral':{let value=node.quasis[0].value.cooked;for(let i=0;i<node.expressions.length;i++)value+=text(yield* expr(node.expressions[i],e))+node.quasis[i+1].value.cooked;return value;}
   case 'UnaryExpression':{const value=yield* expr(node.argument,e);if(node.operator==='!')return !value;if(node.operator==='-')return -value;if(node.operator==='+')return +value;if(node.operator==='typeof')return typeof value;throw Error('Unsupported unary operator.')}
   case 'BinaryExpression':{const a=yield* expr(node.left,e),b=yield* expr(node.right,e);switch(node.operator){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':return a/b;case '===':return a===b;case '!==':return a!==b;case '<':return a<b;case '>':return a>b;default:throw Error('Unsupported binary operator.')}}
   case 'AssignmentExpression':{if(node.left.type!=='Identifier'||node.operator!=='=')throw Error('Only simple binding assignments are supported.');return set(e,node.left.name,yield* expr(node.right,e))}
   case 'UpdateExpression':{if(node.argument.type!=='Identifier')throw Error('Update a named local binding only.');const value=get(e,node.argument.name),next=value+(node.operator==='++'?1:-1);set(e,node.argument.name,next);return node.prefix?next:value;}
   case 'CallExpression':{
    const callee=node.callee,args=[];for(const arg of node.arguments){if(arg.type==='SpreadElement')throw Error('Spread calls are outside this sandbox.');args.push(yield* expr(arg,e));}
    if(callee.type==='Identifier'){
     if(callee.name==='setTimeout'){const delay=args[1]??0;if(typeof delay!=='number'||!Number.isFinite(delay)||delay<0)throw Error('Use a finite nonnegative timer delay.');const label='timer #'+nextId++;timers.push({label,line,due:clock+delay,run:()=>invoke(args[0],args.slice(2),line)});emit(line,'Register '+label+' with a '+delay+' ms minimum delay.');return nextId-1;}
     if(callee.name==='queueMicrotask'){const label='microtask #'+nextId++;micro.push({label,line,run:()=>invoke(args[0],[],line)});emit(line,'Queue '+label+'.');return undefined;}
     if(callee.name==='Error')return Error(text(args[0]));
     return invoke(get(e,callee.name),args,line);
    }
    if(callee.type==='MemberExpression'&&!callee.computed){const property=callee.property.name;if(callee.object.type==='Identifier'&&callee.object.name==='console'&&property==='log'){output.push(args.map(text).join(' '));emit(line,'console.log writes to the output.');return undefined;}
     if(callee.object.type==='Identifier'&&callee.object.name==='Promise'&&['resolve','reject'].includes(property)){const p=new P();p.settle(property==='resolve'?'fulfilled':'rejected',args[0]);return p;}
     const value=yield* expr(callee.object,e);if(value instanceof P&&property==='then'){const next=value.listen(args[0]?v=>invoke(args[0],[v],line):null,args[1]?v=>invoke(args[1],[v],line):null,line);emit(line,'Register a promise reaction.');return next;}
     if(value instanceof P&&property==='catch'){const next=value.listen(null,args[0]?v=>invoke(args[0],[v],line):null,line);emit(line,'Register a rejection handler.');return next;}
    }
    throw Error('Supported calls: console.log, setTimeout, queueMicrotask, Promise.resolve/reject, then/catch, and declared functions.');
   }
   case 'NewExpression':{if(node.callee.type==='Identifier'&&node.callee.name==='Error')return Error(text(yield* expr(node.arguments[0],e)));if(node.callee.type==='Identifier'&&node.callee.name==='Promise'){const executor=yield* expr(node.arguments[0],e),p=new P();try{invoke(executor,[{native:v=>p.settle('fulfilled',v)},{native:v=>p.settle('rejected',v)}],line)}catch(error){p.settle('rejected',error)}return p;}throw Error('Only Promise and Error constructors are supported.');}
   case 'MemberExpression':{if(!node.computed&&node.property.name==='message'){const value=yield* expr(node.object,e);if(value instanceof Error)return value.message;}throw Error('General property access is not supported.');}
   default:throw Error('Unsupported syntax: '+node.type+'. Use logging, timers, promises, and simple functions.');
  }
 }
 function* body(statements,e){for(const stmt of statements){if(stmt.type==='FunctionDeclaration')e.bindings.set(stmt.id.name,fn(stmt,e));if(stmt.type==='VariableDeclaration'&&stmt.kind==='var')for(const d of stmt.declarations)if(d.id.type==='Identifier')e.bindings.set(d.id.name,undefined);}for(const stmt of statements){spend();switch(stmt.type){case 'EmptyStatement':case 'FunctionDeclaration':break;case 'ExpressionStatement':yield* expr(stmt.expression,e);break;case 'VariableDeclaration':for(const d of stmt.declarations){if(d.id.type!=='Identifier')throw Error('Use simple variable declarations.');e.bindings.set(d.id.name,yield* expr(d.init,e));if(stmt.kind==='const')e.constants.add(d.id.name);}break;case 'ReturnStatement':return yield* expr(stmt.argument,e);case 'ThrowStatement':throw yield* expr(stmt.argument,e);default:throw Error('Unsupported statement: '+stmt.type+'. Loops and browser APIs are not available.');}}return undefined;}
 emit(0,'Start the synchronous script.');sync(body(program.body,global));callStack.pop();emit(0,'The script task has finished. Drain microtasks before the next task.');
 while(micro.length||timers.length){spend();while(micro.length){const task=micro.shift();callStack.push(task.label);emit(task.line,'Run '+task.label+' at the microtask checkpoint.');try{task.run()}finally{callStack.pop()}emit(task.line,'Complete '+task.label+'.');}if(timers.length){timers.sort((a,b)=>a.due-b.due);clock=Math.max(clock,timers[0].due);const task=timers.shift();callStack.push(task.label);emit(task.line,'Take eligible '+task.label+' at illustrative t='+clock+' ms.');try{task.run()}finally{callStack.pop()}emit(task.line,'Complete timer task; check microtasks again.');}}
 emit(0,'The supported example has no remaining queued work.');return E('Sandbox',source,events);
}
