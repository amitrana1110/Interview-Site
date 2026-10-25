'use client';
import {useEffect,useState} from 'react';
import {Play,Pause,RotateCcw,SkipBack,SkipForward,ArrowRight,Orbit,Terminal,Code2} from 'lucide-react';
import {traceById} from './visual-traces';

export function Highlight({text}) {
  const tokens=text.split(/(\/\/.*$|'[^']*'|"[^"]*"|\b(?:const|let|var|function|return|async|await|yield|new|import|export|from|if|true|false|null|undefined)\b|\b\d+\b)/g);
  return tokens.map((token,i)=>{const kind=token.startsWith('//')?'comment':/^['"]/.test(token)?'string':/^\d+$/.test(token)?'number':/^(const|let|var|function|return|async|await|yield|new|import|export|from|if|true|false|null|undefined)$/.test(token)?'keyword':'';return <span key={i} className={kind?'trace-syntax-'+kind:undefined}>{token}</span>});
}
function BackendDiagram({frame,id}) {
  return <div className="backend-diagram"><div className="trace-panel-heading"><span>SYSTEM FLOW</span><b>Teaching model</b></div><div className="backend-flow">{frame.diagram?.length?frame.diagram.map((n,i)=><div className={'backend-flow-node backend-flow-'+n.state} key={i}><span className="backend-flow-order">{i+1}</span><strong>{n.label}</strong><small>{n.state==='miss'?'REJECT / MISS':n.state==='done'?'COMPLETE':n.state==='active'?'PROCESSING':'WAITING'}</small></div>):<p className="trace-empty">Step forward to follow the system.</p>}</div>
    {frame.cache&&<div className="backend-cache"><span>CACHE ENTRIES</span><table><thead><tr><th>Key</th><th>Value</th><th>State</th></tr></thead><tbody>{frame.cache.length?frame.cache.map(row=><tr key={row.key}><td>{row.key}</td><td>{row.value}</td><td>{row.status}</td></tr>):<tr><td colSpan={3}>Cache empty</td></tr>}</tbody></table></div>}
    {frame.bucket&&<div className="backend-bucket"><div><span>TOKEN BUCKET</span><b>{frame.bucket.tokens} / {frame.bucket.capacity}</b></div><div className="backend-tokens">{Array.from({length:frame.bucket.capacity},(_,i)=><span key={i} className={i<frame.bucket.tokens?'available':''}>{i<frame.bucket.tokens?'●':'○'}</span>)}</div></div>}
    {frame.tokenState&&<div className={'backend-jwt backend-jwt-'+frame.tokenState}><div><span>HEADER</span><code>eyJ…</code></div><b>.</b><div><span>PAYLOAD</span><code>eyJ…</code></div><b>.</b><div><span>SIGNATURE</span><code>sig…</code></div><strong>{frame.tokenState.toUpperCase()}</strong><p>Illustrative token only · payload is readable</p></div>}
  </div>
}
export default function VisualLab({id}) {
  const trace=traceById[id];
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1);
  const last=trace.frames.length-1;
  const current=trace.frames[step];
  useEffect(()=>{
    if(!playing)return;
    if(step>=last){setPlaying(false);return;}
    const timer=setTimeout(()=>setStep(s=>Math.min(s+1,last)),1200/speed);
    return()=>clearTimeout(timer);
  },[playing,step,last,speed]);
  const jump=n=>{setPlaying(false);setStep(Math.max(0,Math.min(n,last)));};
  function toggle(){if(step===last)setStep(0);setPlaying(p=>!p);}
  function keyboard(e){
    if(e.target.matches('input,select,textarea')||e.target.closest('button'))return;
    if(e.key===' '){e.preventDefault();toggle();}
    if(e.key==='ArrowRight'){e.preventDefault();jump(step+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();jump(step-1);}
    if(e.key.toLowerCase()==='r'){e.preventDefault();jump(0);}
  }
  const allLabels=Array.from(new Set(trace.frames.flatMap(f=>Object.keys(f.panels))));
  const labels=id==='event-loop'?['Call stack','Web APIs','Microtask queue','Task queue']:(trace.topic==='React'||trace.topic==='Backend')?(step?Object.keys(current.panels):allLabels.slice(0,2)):allLabels;
  return <section className={'trace-lab '+(trace.topic==='React'?'trace-react':'')} tabIndex={0} aria-label={`${trace.title} visualization. Space plays, arrow keys step, R resets.`} onKeyDown={keyboard}>
    <div className="trace-toolbar"><div className="trace-transport">
      <button aria-label="Reset visualization" title="Reset (R)" onClick={()=>jump(0)}><RotateCcw size={17}/></button>
      <button aria-label="Step back" title="Previous step (←)" disabled={!step} onClick={()=>jump(step-1)}><SkipBack size={17}/></button>
      <button className="trace-play" aria-label={playing?'Pause visualization':'Play visualization'} onClick={toggle}>{playing?<Pause size={18}/>:<Play size={18}/>}<span>{playing?'Pause':'Play'}</span></button>
      <button aria-label="Step forward" title="Next step (→)" disabled={step===last} onClick={()=>jump(step+1)}><SkipForward size={17}/></button>
      <label className="trace-speed"><span className="sr-only">Playback speed</span><select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[0.25,0.5,1,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></label>
    </div><span className="trace-counter">STEP <b>{step}</b> / {last}</span></div>
    <div className="trace-scrubber"><input aria-label="Jump to visualization step" type="range" min="0" max={last} value={step} onChange={e=>jump(Number(e.target.value))}/><div className="trace-markers">{trace.frames.map((f,i)=><button key={i} aria-label={`Go to step ${i}`} aria-current={step===i?'step':undefined} className={i<=step?'passed':''} onClick={()=>jump(i)}/>)}</div></div>
    <div className="trace-observation" role="status" aria-live={playing?'off':'polite'}><span className={playing?'trace-live playing':'trace-live'}/><p>{current.note}</p></div>
    <div className="trace-workspace"><div className="trace-source"><div className="trace-panel-heading"><Code2 size={14}/><span>SOURCE CODE</span><span className="trace-language">{trace.language||'JavaScript'}</span></div><pre>{trace.code.map((line,i)=><div key={i} className={current.line===i+1?'trace-line active':'trace-line'} aria-current={current.line===i+1?'step':undefined}><span className="trace-line-number">{i+1}</span><code><Highlight text={line||' '}/></code>{current.line===i+1&&<ArrowRight className="trace-line-arrow" size={13}/>}</div>)}</pre><div className="trace-source-foot">{current.line?`Executing line ${current.line}`:'Runtime checkpoint'}<span>READ ONLY</span></div></div>
    <div className={'trace-runtime '+(id==='event-loop'?'trace-queues':'')}>
      {trace.topic==='Backend'&&<BackendDiagram frame={current} id={id}/>}

      {trace.topic==='React'&&<div className="trace-react-tree"><div className="trace-panel-heading"><span>COMPONENT TREE</span><b>Conceptual view</b></div><div className="trace-tree-body">{current.tree?.length?current.tree.map((node,i)=><div key={i} className={'trace-tree-node trace-node-'+node.status} style={{marginLeft:node.depth*22,'--node-depth':node.depth}}><span className="trace-tree-branch">{node.depth?'└':'◈'}</span><code>{node.label}</code><span className="trace-node-status">{node.status}</span></div>):<p className="trace-empty">Step forward to build the tree.</p>}</div></div>}

      {labels.map((label,i)=><div key={label} className={`trace-panel trace-tone-${i%4}`}><div className="trace-panel-heading"><span className="trace-panel-dot"/><span>{label}</span><b>{current.panels[label]?.length||0}</b></div><div className={'trace-items '+(label==='Call stack'?'trace-stack':'')}>{current.panels[label]?.length?current.panels[label].map((item,j)=><div className="trace-token" key={`${step}-${j}`}><span>{label==='Call stack'?'↳':'◆'}</span><code>{item}</code></div>):<span className="trace-empty">empty</span>}</div></div>)}
      {id==='event-loop'&&<div className="trace-loop"><Orbit size={26} className={playing?'orbit-running':''}/><div><span>EVENT LOOP</span><strong>{step===0||step===last?'Idle':current.panels['Call stack']?.length?'Executing a callback':current.panels['Microtask queue']?.length?'Microtask checkpoint':'Ready for next task'}</strong></div></div>}
    </div></div>
    {trace.topic==='React'&&<div className="trace-dom-preview"><div className="trace-panel-heading"><span>BROWSER / COMMITTED UI</span><b>Illustrative preview</b></div><div className={'trace-preview-content '+(current.preview?.error?'trace-preview-error':'')}>{current.preview?<>{current.preview.loading&&<div className="trace-loading-bars"><i/><i/><i/></div>}<h3>{current.preview.title}</h3>{current.preview.body&&<p>{current.preview.body}</p>}</>:<p className="trace-preview-wait">No new UI committed at this step.</p>}</div></div>}
    {trace.topic!=='React'&&<div className="trace-console"><div className="trace-panel-heading"><Terminal size={14}/><span>{trace.topic==='Backend'?'RESULTS / RESPONSES':'CONSOLE OUTPUT'}</span><b>{current.output.length} entries</b></div><div className="trace-console-lines">{current.output.length?current.output.map((line,i)=><div key={i}><span>›</span><code>{line}</code><small>{i+1}</small></div>):<p>No output yet. Step through the source to see the result.</p>}</div></div>}
    <div className="trace-footer"><span>Teaching simulation · deterministic example</span><span>Space play / pause <b>·</b> ← → step <b>·</b> R reset</span></div>
  </section>
}
