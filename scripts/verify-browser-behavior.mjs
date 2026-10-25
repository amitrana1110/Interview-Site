import fs from 'node:fs/promises';
const normalize=text=>text.replace(/\s+/g,' ').trim();
const palette=['color','backgroundColor','borderLeftColor','borderTopColor','opacity','textDecorationLine','fontWeight'];
function fingerprint(text){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16)}
function expectedSignature(recording,index){if(typeof index==='string')return '';const n=recording.nodes[index],s={...recording.styleBase,...recording.styles[n.s]};const direct=normalize(n.c.filter(c=>typeof c==='string').join(''));return n.t+'|'+palette.map(k=>String(s[k]||'').replace(/\s+/g,'')).join('|')+'|'+direct+';'+n.c.map(c=>expectedSignature(recording,c)).join('');}

export async function verifyTopic(tab,root,id){
 const recording=JSON.parse(await fs.readFile(root+'/public/behavior/'+id+'.json','utf8'));
 await tab.goto('http://localhost:3100/#concept/'+id);
 await tab.playwright.locator('[data-recorded-topic="'+id+'"]').waitFor({state:'visible'});
 let checked=0;
 for(let example=0;example<recording.examples.length;example++){
  if(recording.examples.length>1)await tab.playwright.getByRole('combobox',{name:'Select example',exact:true}).selectOption(String(example));
  await tab.playwright.getByRole('button',{name:'Reset visualization',exact:true}).click();
  const scenario=recording.examples[example];
  for(let step=0;step<scenario.frames.length;step++){
   const actual=await tab.playwright.evaluate(()=>{function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}function signature(n){if(n.nodeType!==1)return '';const cs=getComputedStyle(n),palette=['color','backgroundColor','borderLeftColor','borderTopColor','opacity','textDecorationLine','fontWeight'];const direct=[...n.childNodes].filter(c=>c.nodeType===3).map(c=>c.textContent).join('').replace(/\s+/g,' ').trim();return n.localName+'|'+palette.map(k=>String(cs[k]||'').replace(/\s+/g,'')).join('|')+'|'+direct+';'+[...n.children].map(signature).join('');}return {step:Number(document.querySelector('[data-recorded-step]')?.getAttribute('data-recorded-step')),panels:[...document.querySelectorAll('[data-observed-panel]')].map(p=>({name:p.getAttribute('data-observed-panel'),text:p.innerText.replace(/\s+/g,' ').trim(),styleHash:hash(signature(p.querySelector('section')))}))}});
   const expected=scenario.frames[step].panels.map(p=>({name:p.name,text:normalize(recording.texts[p.text]),styleHash:fingerprint(expectedSignature(recording,p.n))}));
   if(actual.step!==step||actual.panels.length!==expected.length||actual.panels.some((p,i)=>p.name!==expected[i].name||p.text!==expected[i].text||p.styleHash!==expected[i].styleHash)){
    const mismatch={id,example:scenario.name,step,actual,expected};await fs.writeFile(root+'/behavior-verification-failure.json',JSON.stringify(mismatch,null,2));throw Error('Reference mismatch: '+id+' / '+scenario.name+' / step '+step);
   }
   checked++;
   if(step<scenario.frames.length-1)await tab.playwright.getByRole('button',{name:'Step forward',exact:true}).click();
  }
  if(await tab.playwright.getByRole('button',{name:'Step forward',exact:true}).isEnabled())throw Error(id+': end boundary');
  await tab.playwright.getByRole('slider',{name:'Jump to step',exact:true}).press('Home');
  const seek=await tab.playwright.evaluate(()=>Number(document.querySelector('[data-recorded-step]').getAttribute('data-recorded-step')));if(seek!==1)throw Error(id+': seek Home must select first reference transition');
  await tab.playwright.getByRole('button',{name:'Reset visualization',exact:true}).click();
  if(await tab.playwright.getByRole('button',{name:'Step back',exact:true}).isEnabled())throw Error(id+': reset boundary');
 }
 const result={id,examples:recording.examples.length,states:checked,panelsAndValues:true,activeStyles:true,controls:true};
 await fs.mkdir(root+'/verification',{recursive:true});await fs.writeFile(root+'/verification/'+id+'.json',JSON.stringify(result,null,2));return result;
}
