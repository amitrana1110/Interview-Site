'use client';
import {createElement,memo,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,SkipBack,SkipForward} from 'lucide-react';
import MatchedLab from './MatchedLab';

const recordings=new Map();
const tags=new Set('section header div span p pre code ul ol li dl dt dd table thead tbody tr th td button strong b small em i s label input textarea select option h1 h2 h3 h4 hr br a svg g path line rect circle ellipse polyline polygon text tspan defs marker foreignObject linearGradient radialGradient stop clipPath title'.split(' '));
const attributeNames={'stroke-width':'strokeWidth','stroke-dasharray':'strokeDasharray','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','marker-end':'markerEnd','marker-start':'markerStart','text-anchor':'textAnchor','dominant-baseline':'dominantBaseline','clip-path':'clipPath','stop-color':'stopColor','stop-opacity':'stopOpacity',colspan:'colSpan',rowspan:'rowSpan',readonly:'readOnly'};
function ObservedNode({index,recording,prefix,onAction}){
 if(typeof index==='string')return index;
 const node=recording.nodes[index];if(!node||!tags.has(node.t))return null;
 const props={style:recording.styleBase?{...recording.styleBase,...recording.styles[node.s]}:recording.styles[node.s]};
 for(const [key,value] of Object.entries(node.a||{})){const name=attributeNames[key]||key;let next=value;if(name==='id')next=prefix+value;else if(typeof value==='string'&&value.includes('url(#'))next=value.replace(/url\(#([^)]+)\)/g,(_,id)=>'url(#'+prefix+id+')');if(['checked','readOnly','disabled'].includes(name))next=value===true||value==='';props[name]=next;}
 if(['input','textarea','select'].includes(node.t)){props.readOnly=true;if(props.value!==undefined){props.defaultValue=props.value;delete props.value;}}
 if(node.t==='button')props.onClick=()=>onAction?.(index);
 if(['input','hr','br'].includes(node.t))return createElement(node.t,props);
 return createElement(node.t,props,node.c.map((child,i)=><RecordedNode key={i} index={child} recording={recording} prefix={prefix} onAction={onAction}/>));
}
const RecordedNode=memo(ObservedNode);
function ObservedScene({frame,recording,onAction}){
 const host=useRef(null),[width,setWidth]=useState(0);
 useLayoutEffect(()=>{if(!host.current)return;const measure=()=>{const style=getComputedStyle(host.current);setWidth(host.current.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight))};measure();const observer=new ResizeObserver(measure);observer.observe(host.current);return()=>observer.disconnect()},[]);
 const narrow=width>0&&width<600,scale=width?width/frame.width:1;
 return <div className={'observed-board '+(narrow?'observed-narrow':'')} ref={host}>
 {narrow?frame.panels.map((pane,i)=>{const s=width*0.9/pane.r[2];return <div className="observed-pane-mobile" data-observed-panel={pane.name} role="region" aria-label={pane.name} key={pane.name+'-'+i} style={{width:width*0.9,height:pane.r[3]*s}}><div style={{width:pane.r[2],height:pane.r[3],transform:`scale(${s})`,transformOrigin:'top left'}}><RecordedNode index={pane.n} recording={recording} prefix={recording.id+'-'+i+'-'} onAction={onAction}/></div></div>}):<div className="observed-canvas-space" style={{height:frame.height*scale}}><div className="observed-canvas" style={{width:frame.width,height:frame.height,transform:`scale(${scale})`}}>{frame.panels.map((pane,i)=><div className="observed-pane" data-observed-panel={pane.name} role="region" aria-label={pane.name} key={pane.name+'-'+i} style={{left:pane.r[0],top:pane.r[1],width:pane.r[2],height:pane.r[3]}}><RecordedNode index={pane.n} recording={recording} prefix={recording.id+'-'+i+'-'} onAction={onAction}/></div>)}</div></div>}
 </div>
}
function RecordedPlayer({recording}){
 const [example,setExample]=useState(0),[step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[sandbox,setSandbox]=useState(false);
 const scene=recording.examples[example],last=scene.frames.length-1,frame=scene.frames[step];
 useEffect(()=>{if(!playing)return;if(step>=last){setPlaying(false);return;}const timer=setTimeout(()=>setStep(s=>Math.min(s+1,last)),recording.stepMs/speed);return()=>clearTimeout(timer)},[playing,step,last,speed,recording.stepMs]);
 function jump(n){setPlaying(false);setStep(Math.max(0,Math.min(last,n)))}
 function toggle(){if(playing){setPlaying(false);return;}if(step===0||step===last)setStep(1);setPlaying(true)}
 function keydown(e){if(e.target.closest('input,select,textarea'))return;if(e.key===' '){if(e.target.closest('button'))return;e.preventDefault();toggle()}if(e.key==='ArrowRight'){e.preventDefault();jump(step+1)}if(e.key==='ArrowLeft'){e.preventDefault();jump(step-1)}if(e.key.toLowerCase()==='r'){e.preventDefault();jump(0)}}
 if(sandbox)return <MatchedLab id="event-loop" initialCode={recordedSource(recording,scene.frames[0])} initialSandbox onExitSandbox={()=>{setSandbox(false);setStep(0)}}/>;
 const active=frame.panels.flatMap(p=>p.active.map(n=>p.name+': line '+n));
 return <section className="behavior-player matched-lab" data-recorded-topic={recording.id} data-recorded-example={scene.name} data-recorded-step={step} tabIndex={0} onKeyDown={keydown} aria-label={recording.id+' visualization'}>
 <div className="match-controls">{recording.id==='event-loop'&&<button className="match-sandbox-toggle" aria-label="Try Sandbox" onClick={()=>{setPlaying(false);setStep(0);setSandbox(true)}}>Try Sandbox</button>}{recording.examples.length>1?<label className="match-example"><span className="sr-only">Select example</span><select aria-label="Select example" value={example} onChange={e=>{setPlaying(false);setStep(0);setExample(Number(e.target.value))}}>{recording.examples.map((s,i)=><option key={s.name} value={i}>{s.name}</option>)}</select></label>:<span className="match-single-example">Step-by-step visualization</span>}
 <div className="match-transport"><span className="match-step">Step {step} / {last}</span><input type="range" aria-label="Jump to step" min="0" max={Math.max(0,last-1)} value={Math.max(0,step-1)} onChange={e=>jump(Number(e.target.value)+1)}/><button aria-label="Reset visualization" title="Reset (R)" onClick={()=>jump(0)}><RotateCcw size={16}/></button><button aria-label="Step back" title="Step back (←)" disabled={!step} onClick={()=>jump(step-1)}><SkipBack size={16}/></button><button className="match-play" aria-label={playing?'Pause visualization':'Play visualization'} onClick={toggle}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><button aria-label="Step forward" title="Step forward (→)" disabled={step===last} onClick={()=>jump(step+1)}><SkipForward size={16}/></button><select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[0.25,0.5,1,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></div></div>
 <div className="match-explanation" role="status" aria-live={playing?'off':'polite'}>{step===0?'Press Play or Step to begin.':active.length?active.join(' · '):'Runtime checkpoint · inspect the state changes below.'}</div>
 <ObservedScene frame={frame} recording={recording}/>
 <div className="match-footer"><span>{last} steps · {scene.name==='Default'?'interactive visualization':scene.name}</span><span>Space play / pause · ← → step · R reset</span></div>
 </section>
}
export default function BehaviorPlayer({id}){
 const [recording,setRecording]=useState(()=>recordings.get(id)||null),[error,setError]=useState('');
 useEffect(()=>{if(recordings.has(id)){setRecording(recordings.get(id));return;}const controller=new AbortController();setRecording(null);setError('');fetch('/behavior/'+id+'.json',{signal:controller.signal}).then(res=>{if(!res.ok)throw Error('Unable to load this visualization.');return res.json()}).then(data=>{if(data.version!==1||data.id!==id||!data.examples?.length)throw Error('Invalid visualization data.');recordings.set(id,data);setRecording(data)}).catch(err=>{if(err.name!=='AbortError')setError(err.message)});return()=>controller.abort()},[id]);
 if(error)return <div className="observed-loading" role="alert">{error}<button onClick={()=>location.reload()}>Reload</button></div>;
 if(!recording)return <div className="observed-loading" role="status">Loading visualization…</div>;
 return <RecordedPlayer key={id} recording={recording}/>;
}

function recordedSource(recording,frame){
 const pane=frame.panels.find(p=>p.name==='SOURCE CODE');if(!pane)return undefined;const lines=[];
 function text(index){if(typeof index==='string')return index;return recording.nodes[index].c.map(text).join('')}
 function walk(index){if(typeof index==='string')return;const node=recording.nodes[index];if(node.t==='code'){lines.push(text(index).replace(/\u00a0/g,' '));return;}node.c.forEach(walk)}
 walk(pane.n);return lines.join('\n');
}
