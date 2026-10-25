// Small declarative primitives shared by the original visualization scenarios.
export const S=(line,note,data={})=>({line,note,data});
export function E(name,code,steps){let state={output:[]};return {name,code:code.split('\n'),frames:[S(0,'Press Play or Step to begin.',{output:[],...(steps[0]?.data?.transformed?{transformed:steps[0].data.transformed}:{})}),...steps.map(s=>{state={...state,...s.data};return {...s,data:state}})]}}
export const tree=(...lines)=>({kind:'tree',lines});
export const table=(columns,...rows)=>({kind:'table',columns,rows});
export const queue=(...items)=>({kind:'queue',items});
export const stack=(...items)=>({kind:'stack',items});
export const log=(...items)=>({kind:'log',items});
export const phase=(value,detail='')=>({kind:'phase',value,detail});
export const dom=(title,body='',items=[])=>({kind:'dom',title,body,items});
export const memory=(...rows)=>table(['Binding / object','Value / reference'],...rows);
export const timeline=(...events)=>({kind:'timeline',events});
export const message=(from,to,label,detail='')=>({from,to,label,detail});
export const messages=(lanes,...events)=>({kind:'messages',lanes,events});
