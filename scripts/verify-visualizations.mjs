import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'app/behavior-manifest.json'),'utf8'));
const layouts=JSON.parse(fs.readFileSync(path.join(root,'app/reference-layouts.json'),'utf8'));
const allowed=new Set('section header div span p pre code ul ol li dl dt dd table thead tbody tr th td button strong b small em i s label input textarea select option h1 h2 h3 h4 hr br a svg g path line rect circle ellipse polyline polygon text tspan defs marker foreignObject linearGradient radialGradient stop clipPath title'.split(' '));
let examples=0,states=0,transitions=0;
assert.equal(Object.keys(manifest).length,37);
for(const [id,meta] of Object.entries(manifest)){
 const bytes=fs.readFileSync(path.join(root,'public/behavior',id+'.json'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256,id+': recording checksum');
 const record=JSON.parse(bytes);
 assert.equal(record.id,id);assert.equal(record.version,1);assert.equal(record.stepMs,1200);
 assert.deepEqual(record.examples.map(e=>e.name),layouts[id].examples.map(e=>e.name),id+': example menu');
 assert.ok(!bytes.includes(Buffer.from('[MaxDepth]')),id+': incomplete capture');
 record.nodes.forEach((node,index)=>{
  assert.ok(allowed.has(node.t),id+': unsupported rendering element '+node.t);
  assert.ok(record.styles[node.s],id+': invalid style reference');
  for(const key of Object.keys(node.a))assert.ok(!/^on/i.test(key)&&key!=='dangerouslySetInnerHTML',id+': unsafe attribute');
  node.c.forEach(child=>{if(typeof child==='number')assert.ok(child>=0&&child<index,id+': invalid or cyclic node reference');else assert.equal(typeof child,'string');});
 });
 record.examples.forEach((example,index)=>{
  examples++;states+=example.frames.length;transitions+=example.frames.length-1;
  assert.equal(example.frames.length,meta.examples[index].states,id+': step count');
  example.frames.forEach(frame=>{
   assert.ok(frame.width>0&&frame.height>0,id+': scene dimensions');
   assert.ok(frame.panels.some(p=>p.name==='SOURCE CODE'),id+': source panel');
   frame.panels.forEach(p=>{assert.ok(record.nodes[p.n],id+': panel node');assert.equal(typeof record.texts[p.text],'string');assert.ok(p.r.every(Number.isFinite)&&p.r[2]>0&&p.r[3]>0);assert.ok(p.active.every(n=>Number.isInteger(n)&&n>0));});
  });
 });
}
assert.equal(examples,112);assert.equal(states,1015);assert.equal(transitions,903);
console.log(`Verified 37 reference recordings, ${examples} examples, ${states} states / ${transitions} transitions, checksums, example menus, scene trees, and active-line metadata.`);
const asModule=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const kit=asModule(fs.readFileSync(path.join(root,'app/scenario-kit.js'),'utf8'));
const sandboxSource=fs.readFileSync(path.join(root,'app/event-loop-sandbox.js'),'utf8').replace("from 'acorn'","from '"+import.meta.resolve('acorn')+"'").replace("from './scenario-kit'","from '"+kit+"'");
const {compileEventLoop}=await import(asModule(sandboxSource));
const cases=[
 ["console.log('A'); setTimeout(() => console.log('T'), 0); Promise.resolve().then(() => console.log('P')); console.log('B');",['A','B','P','T']],
 ["Promise.resolve(3).then(n => n * 2).then(n => console.log(n));",['6']],
 ["setTimeout(() => console.log('later'),20); setTimeout(() => console.log('early'),1);",['early','later']],
 ["queueMicrotask(() => { console.log('M1'); queueMicrotask(() => console.log('M2')); }); console.log('S');",['S','M1','M2']],
 ["async function load() { console.log('in'); const n=await Promise.resolve(7); console.log(n); } load(); console.log('out');",['in','out','7']],
 ["new Promise(resolve => { console.log('executor'); resolve(9); }).then(n=>console.log(n)); console.log('sync');",['executor','sync','9']],
 ["Promise.reject(Error('offline')).catch(e=>console.log(e.message));",['offline']],
 ["let label='A';setTimeout(()=>console.log(label),0);label='B';",['B']]
];
for(const [code,expected] of cases)assert.deepEqual(compileEventLoop(code).frames.at(-1).data.output,expected);
for(const code of ["fetch('https://example.test')",'while(true){}','const n=1;n=2;','console.log(document.cookie)','x'.repeat(1001)])assert.throws(()=>compileEventLoop(code));
console.log('Bounded sandbox: 8 scheduling/closure/async cases and 5 input/limit cases passed.');
