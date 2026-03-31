import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sun, Moon, Home, CheckSquare, CalendarDays, BookOpen, Wallet, BarChart2,
  Plus, Trash2, Edit3, X, Copy, ChevronLeft, ChevronRight, Upload, RefreshCw,
  Sparkles, Star, Check, TrendingUp, Clock, Printer, ArrowRight, FileText,
  Brain, Target, Zap, DollarSign, AlertCircle, MoreHorizontal, Terminal
} from "lucide-react";

/* ══════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════ */
const DARK = {
  bg: "#010e24", bgAlt: "#02132b",
  surf: "#061934", surfH: "#0b203d", surfHH: "#102645", surfB: "#152c4e",
  pri: "#81ecff", priD: "#00d4ec", onPri: "#003840",
  sec: "#feaa00", secD: "#ec9e00",
  ter: "#9cff93", terD: "#00ec3b",
  err: "#ff716c",
  txt: "#dbe6ff", txtS: "#9eabc8",
  out: "#687690", outV: "#3b4861",
  glass: "rgba(16,38,69,0.7)",
  nav: "rgba(1,14,36,0.92)",
};
const LIGHT = {
  bg: "#f0f5ff", bgAlt: "#e6eeff",
  surf: "#ffffff", surfH: "#edf3ff", surfHH: "#dce8ff", surfB: "#f5f8ff",
  pri: "#006976", priD: "#005762", onPri: "#ffffff",
  sec: "#8B5E00", secD: "#704900",
  ter: "#006413", terD: "#004d0a",
  err: "#ba1a1a",
  txt: "#0d1b2e", txtS: "#3a4a5e",
  out: "#687690", outV: "#cdd8f0",
  glass: "rgba(255,255,255,0.9)",
  nav: "rgba(240,245,255,0.95)",
};

/* ══════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════ */
const CATS = ["Grocery","Transport","Coffee","Dining","Shopping","Bills","Healthcare","Entertainment","Rent","Education","Savings","Investment","Other"];
const DAYS_S = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ══════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const todayKey = () => new Date().toISOString().split("T")[0];
const monthKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtMoney = (aed, cur, rate) => cur==="AED" ? `AED ${aed.toFixed(2)}` : `₹ ${(aed*(rate||22.56)).toFixed(2)}`;
const hourGreet = () => { const h=new Date().getHours(); return h<12?"Good Morning":h<17?"Good Afternoon":"Good Evening"; };
const fmtDateLong = (s) => { try { return new Date(s+"T00:00:00").toLocaleDateString("en-AE",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); } catch { return s; } };

/* ══════════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════════ */
const DB = {
  async get(k) { try { const r=await window.storage.get(k); return r?JSON.parse(r.value):null; } catch { return null; } },
  async set(k,v) { try { await window.storage.set(k,JSON.stringify(v)); } catch(e){ console.warn("DB.set",e); } },
  async del(k) { try { await window.storage.delete(k); } catch {} },
};

/* ══════════════════════════════════════════════════
   ANTHROPIC API
══════════════════════════════════════════════════ */
async function ai(prompt, system="", maxTokens=1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:maxTokens,
      ...(system&&{system}),
      messages:[{role:"user",content:prompt}]
    })
  });
  const d = await res.json();
  if(d.error) throw new Error(d.error.message);
  return d.content.filter(b=>b.type==="text").map(b=>b.text).join("");
}

/* ══════════════════════════════════════════════════
   UI PRIMITIVES
══════════════════════════════════════════════════ */
function Btn({c,children,onClick,v="pri",sz="md",disabled,fw,style={},className=""}) {
  const pad = sz==="sm"?"7px 14px":sz==="lg"?"15px 30px":"11px 22px";
  const fs = sz==="sm"?11:13;
  const variants = {
    pri:  { background:c.pri, color:c.onPri||c.bg, border:"none" },
    sec:  { background:c.sec, color:"#1a0d00", border:"none" },
    ghost:{ background:"transparent", color:c.pri, border:`1.5px solid ${c.pri}66` },
    surf: { background:c.surfH, color:c.txt, border:`1px solid ${c.outV}` },
    err:  { background:`${c.err}18`, color:c.err, border:`1px solid ${c.err}44` },
    outline:{ background:"transparent", color:c.out, border:`1px solid ${c.outV}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[v], padding:pad, borderRadius:10, cursor:disabled?"not-allowed":"pointer",
      fontSize:fs, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700,
      letterSpacing:"0.02em", display:"inline-flex", alignItems:"center", gap:6,
      opacity:disabled?0.5:1, width:fw?"100%":undefined,
      justifyContent:fw?"center":undefined, transition:"all 0.15s ease",
      whiteSpace:"nowrap", ...style
    }}>
      {children}
    </button>
  );
}

function Inp({c,value,onChange,placeholder,type="text",style={}}) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
      width:"100%", background:c.surfH, border:`1px solid ${c.outV}`,
      borderRadius:10, padding:"10px 14px", color:c.txt, fontSize:13,
      fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box",
      transition:"border-color 0.2s", ...style
    }}
    onFocus={e=>e.target.style.borderColor=c.pri}
    onBlur={e=>e.target.style.borderColor=c.outV}
    />
  );
}

function Sel({c,value,onChange,children,style={}}) {
  return (
    <select value={value} onChange={onChange} style={{
      width:"100%", background:c.surfH, border:`1px solid ${c.outV}`,
      borderRadius:10, padding:"10px 14px", color:c.txt, fontSize:13,
      fontFamily:"'Inter',sans-serif", outline:"none", cursor:"pointer", ...style
    }}>
      {children}
    </select>
  );
}

function Lbl({c,children}) {
  return <div style={{fontSize:10,fontWeight:700,color:c.txtS,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',sans-serif",marginBottom:6}}>{children}</div>;
}

function Badge({c,children,col="pri"}) {
  return (
    <span style={{background:`${c[col]}22`,color:c[col],fontSize:9,fontWeight:800,
      padding:"2px 8px",borderRadius:20,fontFamily:"'Space Grotesk',sans-serif",
      letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
      {children}
    </span>
  );
}

function SectionHeader({c,children,accent="pri",right}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:20,borderRadius:2,background:c[accent]}}/>
        <span style={{fontSize:11,fontWeight:800,color:c[accent],fontFamily:"'Space Grotesk',sans-serif",
          textTransform:"uppercase",letterSpacing:"0.15em"}}>
          {children}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE: DASHBOARD
══════════════════════════════════════════════════ */
function Dashboard({c,tasks,wisdom,expenses,rate,cur,setPage}) {
  const d = new Date();
  const dateStr = d.toLocaleDateString("en-AE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const allT = [...(tasks.morning||[]),...(tasks.evening||[]),...(tasks.custom||[])];
  const done = allT.filter(t=>t.done).length;
  const monthExp = expenses.filter(e=>e.date?.startsWith(monthKey()));
  const monthTot = monthExp.reduce((s,e)=>s+e.amtAED,0);
  const todayExp = expenses.filter(e=>e.date===todayKey());
  const todayTot = todayExp.reduce((s,e)=>s+e.amtAED,0);

  const cards = [
    { key:"tasks",   Icon:CheckSquare,   label:"Daily Tasks",    sub:`${done}/${allT.length} complete`, col:"pri" },
    { key:"calendar",Icon:CalendarDays,   label:"Calendar",       sub:"Events & reminders",              col:"sec" },
    { key:"wisdom",  Icon:BookOpen,       label:"Daily Wisdom",   sub:"Today's insight",                 col:"ter" },
    { key:"finance", Icon:Wallet,         label:"Finance",        sub:fmtMoney(monthTot,cur,rate)+" / mo", col:"sec" },
    { key:"report",  Icon:BarChart2,      label:"AI Report",      sub:"Financial intelligence",          col:"pri" },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{
        background:`linear-gradient(135deg,${c.surf} 0%,${c.surfH} 100%)`,
        borderRadius:20,padding:"26px 24px",marginBottom:16,
        border:`1px solid ${c.outV}`,boxShadow:`0 0 50px ${c.pri}12`,
        position:"relative",overflow:"hidden"
      }}>
        <div style={{position:"absolute",top:-30,right:-30,width:180,height:180,borderRadius:"50%",background:`${c.pri}06`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-40,left:-20,width:120,height:120,borderRadius:"50%",background:`${c.sec}05`,pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:c.ter,display:"inline-block",boxShadow:`0 0 8px ${c.ter}`,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:10,fontWeight:700,color:c.out,letterSpacing:"0.15em",textTransform:"uppercase",fontFamily:"'Space Grotesk',sans-serif"}}>System Nominal</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:800,color:c.pri,fontFamily:"'Space Grotesk',sans-serif",margin:"2px 0 4px",letterSpacing:"-0.02em"}}>
            {hourGreet()}, Commander
          </h1>
          <div style={{fontSize:12,color:c.txtS,marginBottom:18}}>{dateStr}</div>
          {/* Progress bar */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:10,color:c.txtS,fontFamily:"'Space Grotesk',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em"}}>Daily Progress</span>
              <span style={{fontSize:10,color:c.pri,fontWeight:700}}>{done}/{allT.length} tasks</span>
            </div>
            <div style={{height:5,background:c.outV,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${allT.length?Math.round(done/allT.length*100):0}%`,background:`linear-gradient(90deg,${c.pri},${c.priD})`,borderRadius:3,transition:"width 0.6s ease"}}/>
            </div>
          </div>
          {/* Stats chips */}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {[
              {label:"Today",val:fmtMoney(todayTot,cur,rate),col:"sec"},
              {label:"This Month",val:fmtMoney(monthTot,cur,rate),col:"ter"},
            ].map(({label,val,col})=>(
              <div key={label} style={{background:`${c[col]}15`,border:`1px solid ${c[col]}33`,borderRadius:10,padding:"8px 14px"}}>
                <div style={{fontSize:9,color:c[col],fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:1}}>{label}</div>
                <div style={{fontSize:16,fontWeight:800,color:c[col],fontFamily:"'Space Grotesk',sans-serif"}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wisdom teaser */}
      {wisdom && (
        <div onClick={()=>setPage("wisdom")} style={{
          background:c.surf,borderRadius:14,padding:"16px 18px",marginBottom:16,
          border:`1px solid ${c.pri}28`,cursor:"pointer",position:"relative",overflow:"hidden"
        }}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:`${c.pri}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <BookOpen size={15} color={c.pri}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,fontWeight:800,color:c.pri,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>✦ Today's Wisdom · {wisdom.category}</div>
              <p style={{fontSize:13,color:c.txt,fontStyle:"italic",margin:0,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>"{wisdom.quote}"</p>
              <div style={{fontSize:11,color:c.txtS,marginTop:4}}>— {wisdom.attribution}</div>
            </div>
            <ArrowRight size={14} color={c.pri} style={{flexShrink:0,marginTop:8}}/>
          </div>
        </div>
      )}

      {/* Nav grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {cards.map(({key,Icon,label,sub,col})=>(
          <div key={key} onClick={()=>setPage(key)} style={{
            background:c.surf,borderRadius:14,padding:16,
            border:`1px solid ${c.outV}`,cursor:"pointer",
            transition:"all 0.2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=c[col]+"66";e.currentTarget.style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=c.outV;e.currentTarget.style.transform="translateY(0)";}}
          >
            <div style={{width:34,height:34,borderRadius:9,background:`${c[col]}18`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
              <Icon size={16} color={c[col]}/>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:c.txt,fontFamily:"'Space Grotesk',sans-serif",marginBottom:2}}>{label}</div>
            <div style={{fontSize:11,color:c.txtS,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE: TASKS
══════════════════════════════════════════════════ */
function TasksPage({c,tasks,saveTasks,onRegenEvening,loadEvening}) {
  const [showAdd,setShowAdd] = useState(false);
  const [nTitle,setNTitle] = useState("");
  const [nTime,setNTime] = useState("");
  const [nPri,setNPri] = useState("medium");

  const toggle = (sec,id) => {
    saveTasks({...tasks,[sec]:tasks[sec].map(t=>t.id===id?{...t,done:!t.done}:t)});
  };
  const setNotes = (sec,id,notes) => {
    saveTasks({...tasks,[sec]:tasks[sec].map(t=>t.id===id?{...t,notes}:t)});
  };
  const addCustom = () => {
    if(!nTitle.trim()) return;
    const t={id:uid(),title:nTitle,done:false,notes:"",time:nTime,priority:nPri};
    saveTasks({...tasks,custom:[...tasks.custom,t]});
    setNTitle("");setNTime("");setNPri("medium");setShowAdd(false);
  };
  const delCustom = (id) => saveTasks({...tasks,custom:tasks.custom.filter(t=>t.id!==id)});

  const priCol = {high:c.err,medium:c.sec,low:c.ter};

  const TaskCard = ({task,sec,showPri=false}) => {
    const [showNotes,setShowNotes] = useState(false);
    return (
      <div style={{
        background:task.done?`${c.outV}28`:c.surfH,
        borderRadius:12,padding:14,
        border:`1px solid ${task.done?c.outV:c.outV}`,
        borderLeft:`3px solid ${showPri?priCol[task.priority||"medium"]:c.pri}`,
        opacity:task.done?0.65:1,transition:"all 0.2s",
      }}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <button onClick={()=>toggle(sec,task.id)} style={{
            width:22,height:22,borderRadius:6,flexShrink:0,
            border:`2px solid ${task.done?c.pri:c.out}`,
            background:task.done?c.pri:"transparent",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,
            transition:"all 0.2s"
          }}>
            {task.done&&<Check size={11} color={c.onPri||c.bg}/>}
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{
              fontSize:13,fontWeight:600,color:task.done?c.txtS:c.txt,
              textDecoration:task.done?"line-through":"none",
              fontFamily:"'Inter',sans-serif",lineHeight:1.4
            }}>{task.title}</div>
            {task.description&&<div style={{fontSize:11,color:c.txtS,marginTop:3,lineHeight:1.5}}>{task.description}</div>}
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5,flexWrap:"wrap"}}>
              {task.topic&&<Badge c={c} col="pri">{task.topic}</Badge>}
              {task.duration&&<span style={{fontSize:10,color:c.out,display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>{task.duration}</span>}
              {task.time&&<span style={{fontSize:10,color:c.out}}>⏰ {task.time}</span>}
              {showPri&&<Badge c={c} col={task.priority==="high"?"err":task.priority==="low"?"ter":"sec"}>{task.priority||"medium"}</Badge>}
            </div>
          </div>
          <button onClick={()=>setShowNotes(!showNotes)} style={{background:"none",border:"none",cursor:"pointer",color:c.out,padding:2,flexShrink:0}}>
            <MoreHorizontal size={14}/>
          </button>
          {sec==="custom"&&(
            <button onClick={()=>delCustom(task.id)} style={{background:"none",border:"none",cursor:"pointer",color:`${c.err}88`,padding:2,flexShrink:0}}>
              <Trash2 size={13}/>
            </button>
          )}
        </div>
        {showNotes&&(
          <div style={{marginTop:10,paddingLeft:32}}>
            <textarea
              value={task.notes||""} onChange={e=>setNotes(sec,task.id,e.target.value)}
              placeholder="Add notes..."
              style={{width:"100%",background:`${c.outV}33`,border:`1px solid ${c.outV}`,borderRadius:8,
                padding:"6px 10px",color:c.txtS,fontSize:12,fontFamily:"'Inter',sans-serif",
                resize:"none",outline:"none",minHeight:44,boxSizing:"border-box"}}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Morning */}
      <div style={{marginBottom:24}}>
        <SectionHeader c={c} accent="sec">☀ Morning Block</SectionHeader>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(tasks.morning||[]).map(t=><TaskCard key={t.id} task={t} sec="morning"/>)}
        </div>
      </div>

      {/* Evening */}
      <div style={{marginBottom:24}}>
        <SectionHeader c={c} accent="pri"
          right={<Btn c={c} v="ghost" sz="sm" onClick={()=>onRegenEvening()} disabled={loadEvening}>
            <RefreshCw size={11}/>{loadEvening?"Generating...":"New Sessions"}
          </Btn>}
        >◆ Evening Learning — AI Recommendations</SectionHeader>
        {loadEvening?(
          <div style={{textAlign:"center",padding:30,color:c.txtS,fontSize:13}}>
            <div style={{fontSize:22,color:c.pri,animation:"spin 1.5s linear infinite",display:"inline-block"}}>◉</div>
            <div style={{marginTop:10}}>AI is generating your learning sessions...</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(tasks.evening||[]).map(t=><TaskCard key={t.id} task={t} sec="evening"/>)}
            {!tasks.evening?.length&&<div style={{textAlign:"center",padding:24,color:c.out,fontSize:13}}>Loading AI sessions...</div>}
          </div>
        )}
      </div>

      {/* Custom */}
      <div>
        <SectionHeader c={c} accent="ter"
          right={<Btn c={c} v="ghost" sz="sm" onClick={()=>setShowAdd(!showAdd)}><Plus size={11}/>Add Task</Btn>}
        >● Custom Tasks</SectionHeader>
        {showAdd&&(
          <div style={{background:c.surfH,borderRadius:14,padding:16,border:`1px solid ${c.pri}44`,marginBottom:12}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div><Lbl c={c}>Task Title</Lbl><Inp c={c} value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="What needs to be done?"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><Lbl c={c}>Time (optional)</Lbl><Inp c={c} type="time" value={nTime} onChange={e=>setNTime(e.target.value)}/></div>
                <div><Lbl c={c}>Priority</Lbl>
                  <Sel c={c} value={nPri} onChange={e=>setNPri(e.target.value)}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Sel>
                </div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Btn c={c} v="outline" sz="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
                <Btn c={c} v="pri" sz="sm" onClick={addCustom}><Plus size={11}/>Add</Btn>
              </div>
            </div>
          </div>
        )}
        {(tasks.custom||[]).length===0&&!showAdd&&(
          <div style={{textAlign:"center",padding:28,color:c.out,fontSize:13,border:`2px dashed ${c.outV}`,borderRadius:12}}>
            No custom tasks. Click "Add Task" to get started.
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(tasks.custom||[]).map(t=><TaskCard key={t.id} task={t} sec="custom" showPri/>)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE: CALENDAR
══════════════════════════════════════════════════ */
function CalendarPage({c,events,saveEvents}) {
  const now = new Date();
  const [vy,setVy] = useState(now.getFullYear());
  const [vm,setVm] = useState(now.getMonth());
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({title:"",date:"",time:"",notes:""});

  const dim = new Date(vy,vm+1,0).getDate();
  const fd = new Date(vy,vm,1).getDay();
  const today = todayKey();

  const dayStr = (d) => `${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const dayEvents = (d) => events.filter(e=>e.date===dayStr(d));

  const openAdd = (d) => {
    setEditing(null);
    setForm({title:"",date:dayStr(d),time:"",notes:""});
    setModal(true);
  };
  const openEdit = (ev) => {
    setEditing(ev);
    setForm({...ev});
    setModal(true);
  };
  const save = () => {
    if(!form.title.trim()) return;
    if(editing) saveEvents(events.map(e=>e.id===editing.id?{...form,id:editing.id}:e));
    else saveEvents([...events,{...form,id:uid()}]);
    setModal(false);
  };
  const del = (id) => { saveEvents(events.filter(e=>e.id!==id)); setModal(false); };

  const prev = () => { if(vm===0){setVy(y=>y-1);setVm(11);}else setVm(m=>m-1); };
  const next = () => { if(vm===11){setVy(y=>y+1);setVm(0);}else setVm(m=>m+1); };

  const upcoming = [...events].filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,6);

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={prev} style={{background:c.surfH,border:`1px solid ${c.outV}`,borderRadius:9,padding:"8px 12px",cursor:"pointer",color:c.txt}}><ChevronLeft size={16}/></button>
        <h2 style={{fontSize:20,fontWeight:800,color:c.txt,fontFamily:"'Space Grotesk',sans-serif",margin:0}}>{MONTHS[vm]} {vy}</h2>
        <button onClick={next} style={{background:c.surfH,border:`1px solid ${c.outV}`,borderRadius:9,padding:"8px 12px",cursor:"pointer",color:c.txt}}><ChevronRight size={16}/></button>
      </div>

      {/* Day labels */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {DAYS_S.map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:c.out,fontFamily:"'Space Grotesk',sans-serif",textTransform:"uppercase",padding:"3px 0"}}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:24}}>
        {Array.from({length:fd},(_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:dim},(_,i)=>{
          const day=i+1; const ds=dayStr(day); const isToday=ds===today; const de=dayEvents(day);
          return (
            <div key={day} onClick={()=>openAdd(day)} style={{
              background:isToday?c.pri:c.surfH,
              borderRadius:10,padding:"6px 4px",textAlign:"center",cursor:"pointer",
              border:`1px solid ${isToday?c.pri:c.outV}`,minHeight:50,
              transition:"all 0.15s",position:"relative"
            }}
            onMouseEnter={e=>{if(!isToday)e.currentTarget.style.borderColor=c.pri+"66";}}
            onMouseLeave={e=>{if(!isToday)e.currentTarget.style.borderColor=c.outV;}}
            >
              <div style={{fontSize:13,fontWeight:isToday?800:500,color:isToday?c.bg:c.txt,fontFamily:"'Space Grotesk',sans-serif"}}>{day}</div>
              {de.length>0&&(
                <div style={{display:"flex",justifyContent:"center",gap:2,marginTop:3,flexWrap:"wrap"}}>
                  {de.slice(0,3).map((_,j)=><div key={j} style={{width:4,height:4,borderRadius:"50%",background:isToday?c.bg:c.sec}}/>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming */}
      <SectionHeader c={c} accent="sec">Upcoming Events</SectionHeader>
      {upcoming.length===0?(
        <div style={{textAlign:"center",padding:24,color:c.out,fontSize:13,border:`2px dashed ${c.outV}`,borderRadius:12}}>No upcoming events. Tap a day to add one.</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {upcoming.map(ev=>(
            <div key={ev.id} onClick={()=>openEdit(ev)} style={{
              background:c.surfH,borderRadius:12,padding:"12px 16px",
              border:`1px solid ${c.outV}`,cursor:"pointer",borderLeft:`3px solid ${c.sec}`
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:c.txt,marginBottom:2}}>{ev.title}</div>
                  <div style={{fontSize:11,color:c.out}}>{fmtDateLong(ev.date)}{ev.time&&` · ${ev.time}`}</div>
                  {ev.notes&&<div style={{fontSize:12,color:c.txtS,marginTop:3}}>{ev.notes}</div>}
                </div>
                <Edit3 size={13} color={c.out}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal&&(
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:c.surf,borderRadius:20,padding:24,width:"100%",maxWidth:400,border:`1px solid ${c.pri}44`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontSize:16,fontWeight:800,color:c.txt,fontFamily:"'Space Grotesk',sans-serif",margin:0}}>{editing?"Edit Event":"Add Event"}</h3>
              <button onClick={()=>setModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:c.txtS}}><X size={20}/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><Lbl c={c}>Event Title *</Lbl><Inp c={c} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Meeting, appointment..."/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><Lbl c={c}>Date</Lbl><Inp c={c} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                <div><Lbl c={c}>Time</Lbl><Inp c={c} type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
              </div>
              <div><Lbl c={c}>Notes</Lbl>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Additional notes..."
                  style={{width:"100%",background:c.surfH,border:`1px solid ${c.outV}`,borderRadius:10,padding:"10px 14px",
                    color:c.txt,fontSize:13,fontFamily:"'Inter',sans-serif",resize:"none",outline:"none",minHeight:72,boxSizing:"border-box"}}
                />
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>
                {editing&&<Btn c={c} v="err" sz="sm" onClick={()=>del(editing.id)}><Trash2 size={11}/>Delete</Btn>}
                <Btn c={c} v="outline" sz="sm" onClick={()=>setModal(false)}>Cancel</Btn>
                <Btn c={c} v="pri" sz="sm" onClick={save}>{editing?"Update":"Add Event"}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE: WISDOM
══════════════════════════════════════════════════ */
function WisdomPage({c,wisdom,refreshWisdom,loadWisdom,savedWisdom,setSavedWisdom}) {
  const [copied,setCopied] = useState(false);

  const save = () => {
    if(!wisdom) return;
    const ns = [wisdom,...savedWisdom.filter(w=>w.quote!==wisdom.quote)];
    setSavedWisdom(ns); DB.set("lifex-saved-wisdom",ns);
  };
  const copy = async () => {
    if(!wisdom) return;
    try { await navigator.clipboard.writeText(`"${wisdom.quote}" — ${wisdom.attribution}`); setCopied(true); setTimeout(()=>setCopied(false),2200); } catch {}
  };
  const rem = (i) => { const ns=savedWisdom.filter((_,j)=>j!==i); setSavedWisdom(ns); DB.set("lifex-saved-wisdom",ns); };

  return (
    <div>
      {/* Main wisdom card */}
      <div style={{
        background:`linear-gradient(150deg,${c.surfH} 0%,${c.surfHH} 100%)`,
        borderRadius:20,padding:28,marginBottom:20,
        border:`1px solid ${c.pri}33`,boxShadow:`0 0 40px ${c.pri}10`,
        position:"relative",overflow:"hidden",minHeight:260
      }}>
        <div style={{position:"absolute",top:-10,right:-10,fontSize:140,color:c.pri,opacity:0.04,fontFamily:"Georgia,serif",lineHeight:1,pointerEvents:"none",userSelect:"none"}}>"</div>
        {loadWisdom?(
          <div style={{textAlign:"center",padding:50,color:c.txtS}}>
            <div style={{fontSize:28,color:c.pri,animation:"spin 2s linear infinite",display:"inline-block"}}>◉</div>
            <div style={{marginTop:14,fontSize:14,fontWeight:500}}>Channeling profound wisdom...</div>
          </div>
        ):wisdom?(
          <>
            <div style={{marginBottom:12}}><Badge c={c} col="pri">{wisdom.category}</Badge></div>
            <blockquote style={{fontSize:17,lineHeight:1.75,color:c.txt,fontFamily:"'Lora',Georgia,serif",fontStyle:"italic",margin:"0 0 14px"}}>
              "{wisdom.quote}"
            </blockquote>
            <div style={{fontSize:13,color:c.sec,fontWeight:700,marginBottom:14}}>— {wisdom.attribution}</div>
            {wisdom.insight&&(
              <div style={{background:`${c.outV}40`,borderRadius:10,padding:"10px 14px",borderLeft:`3px solid ${c.pri}55`,marginBottom:18}}>
                <span style={{fontSize:9,fontWeight:800,color:c.pri,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',sans-serif"}}>Why This Matters · </span>
                <span style={{fontSize:12,color:c.txtS,lineHeight:1.6}}>{wisdom.insight}</span>
              </div>
            )}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Btn c={c} v="pri" sz="sm" onClick={save}><Star size={11}/>Save</Btn>
              <Btn c={c} v="ghost" sz="sm" onClick={copy}><Copy size={11}/>{copied?"Copied!":"Copy"}</Btn>
              <Btn c={c} v="outline" sz="sm" onClick={refreshWisdom} disabled={loadWisdom}><RefreshCw size={11}/>New Quote</Btn>
            </div>
          </>
        ):(
          <div style={{textAlign:"center",padding:40}}>
            <Btn c={c} v="pri" onClick={refreshWisdom}><Sparkles size={14}/>Generate Today's Wisdom</Btn>
          </div>
        )}
      </div>

      {/* Saved wisdom */}
      {savedWisdom.length>0&&(
        <div>
          <SectionHeader c={c} accent="sec">⊕ Saved Wisdom ({savedWisdom.length})</SectionHeader>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {savedWisdom.map((w,i)=>(
              <div key={i} style={{background:c.surfH,borderRadius:12,padding:16,border:`1px solid ${c.outV}`}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{marginBottom:6}}><Badge c={c} col="sec">{w.category}</Badge></div>
                    <p style={{fontSize:13,color:c.txt,fontStyle:"italic",margin:"0 0 4px",lineHeight:1.55}}>"{w.quote}"</p>
                    <div style={{fontSize:11,color:c.out}}>— {w.attribution}</div>
                  </div>
                  <button onClick={()=>rem(i)} style={{background:"none",border:"none",cursor:"pointer",color:c.out,padding:2,alignSelf:"flex-start"}}><X size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE: FINANCE
══════════════════════════════════════════════════ */
function FinancePage({c,expenses,saveExpenses,uploads,setUploads,cur,setCur,rate,refreshRate,loadRate}) {
  const [form,setForm] = useState({amount:"",cat:"Grocery",notes:"",date:todayKey()});
  const [filt,setFilt] = useState("month");
  const fileRef = useRef();
  const aedToInr = rate?.AEDtoINR||22.56;

  const addExp = () => {
    if(!form.amount||parseFloat(form.amount)<=0) return;
    const rawAED = cur==="AED"?parseFloat(form.amount):parseFloat(form.amount)/aedToInr;
    const e={id:uid(),date:form.date,amtAED:rawAED,amtINR:rawAED*aedToInr,inputCur:cur,cat:form.cat,notes:form.notes};
    saveExpenses([e,...expenses]);
    setForm(f=>({...f,amount:"",notes:"",date:todayKey()}));
  };

  const delExp = (id) => saveExpenses(expenses.filter(e=>e.id!==id));

  const handleFile = (ev) => {
    const file=ev.target.files[0]; if(!file) return;
    const up={id:uid(),name:file.name,size:file.size,type:file.type,date:todayKey(),uploadedAt:new Date().toISOString()};
    const nu=[up,...uploads]; setUploads(nu); DB.set("lifex-uploads",nu);
    ev.target.value="";
  };

  const disp = (aed) => cur==="AED"?`AED ${aed.toFixed(2)}`:`₹ ${(aed*aedToInr).toFixed(0)}`;

  const filtered = expenses.filter(e=>
    filt==="today"?e.date===todayKey():
    filt==="month"?e.date?.startsWith(monthKey()):true
  );
  const totAED = filtered.reduce((s,e)=>s+e.amtAED,0);

  const monthExp = expenses.filter(e=>e.date?.startsWith(monthKey()));
  const monthTot = monthExp.reduce((s,e)=>s+e.amtAED,0);
  const byCat = {}; monthExp.forEach(e=>{ byCat[e.cat]=(byCat[e.cat]||0)+e.amtAED; });
  const sortedCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);

  return (
    <div>
      {/* Currency & Rate */}
      <div style={{background:c.surfH,borderRadius:14,padding:16,marginBottom:16,border:`1px solid ${c.outV}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <Lbl c={c}>Primary Currency</Lbl>
          <div style={{display:"flex",gap:6}}>
            {["AED","INR"].map(cc=>(
              <button key={cc} onClick={()=>{setCur(cc);DB.set("lifex-currency",cc);}} style={{
                padding:"6px 18px",borderRadius:8,border:"none",cursor:"pointer",
                background:cur===cc?c.pri:c.surfHH,color:cur===cc?c.onPri||c.bg:c.txt,
                fontWeight:800,fontSize:12,fontFamily:"'Space Grotesk',sans-serif",transition:"all 0.2s"
              }}>{cc}</button>
            ))}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
            <span style={{fontSize:18,fontWeight:800,color:c.pri,fontFamily:"'Space Grotesk',sans-serif"}}>
              1 AED = ₹{aedToInr.toFixed(4)}
            </span>
            <button onClick={refreshRate} disabled={loadRate} style={{background:"none",border:"none",cursor:"pointer",color:loadRate?c.out:c.pri,padding:2}}>
              <RefreshCw size={13} style={loadRate?{animation:"spin 1s linear infinite"}:{}}/>
            </button>
          </div>
          {rate?.updated&&<div style={{fontSize:9,color:c.out,marginTop:2}}>Updated {new Date(rate.updated).toLocaleTimeString()}</div>}
        </div>
      </div>

      {/* Month Summary */}
      <div style={{background:`linear-gradient(135deg,${c.surfH},${c.surfHH})`,borderRadius:16,padding:20,marginBottom:16,border:`1px solid ${c.sec}33`,boxShadow:`0 0 25px ${c.sec}0a`}}>
        <div style={{fontSize:10,fontWeight:800,color:c.sec,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Space Grotesk',sans-serif",marginBottom:3}}>This Month's Spending</div>
        <div style={{fontSize:34,fontWeight:800,color:c.sec,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"-0.02em",marginBottom:3}}>{disp(monthTot)}</div>
        <div style={{fontSize:12,color:c.txtS,marginBottom:14}}>≈ {cur==="AED"?`₹ ${(monthTot*aedToInr).toFixed(0)}`:`AED ${monthTot.toFixed(2)}`}</div>
        {sortedCat.slice(0,5).map(([cat,amt])=>(
          <div key={cat} style={{marginBottom:7}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:10,color:c.txtS}}>{cat}</span>
              <span style={{fontSize:10,color:c.txt,fontWeight:700}}>{disp(amt)}</span>
            </div>
            <div style={{height:3,background:c.outV,borderRadius:2}}>
              <div style={{height:"100%",width:`${monthTot?amt/monthTot*100:0}%`,background:c.sec,borderRadius:2,transition:"width 0.5s"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Add Form */}
      <div style={{background:c.surf,borderRadius:16,padding:20,marginBottom:16,border:`1px solid ${c.pri}30`}}>
        <SectionHeader c={c} accent="pri">+ Log Expense</SectionHeader>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Lbl c={c}>Amount ({cur})</Lbl><Inp c={c} type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00"/></div>
            <div><Lbl c={c}>Date</Lbl><Inp c={c} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          </div>
          <div>
            <Lbl c={c}>Category</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {CATS.map(cat=>(
                <button key={cat} onClick={()=>setForm(f=>({...f,cat}))} style={{
                  padding:"5px 11px",borderRadius:20,cursor:"pointer",fontSize:11,fontWeight:600,
                  fontFamily:"'Space Grotesk',sans-serif",transition:"all 0.15s",
                  border:`1px solid ${form.cat===cat?c.pri:c.outV}`,
                  background:form.cat===cat?`${c.pri}20`:"transparent",
                  color:form.cat===cat?c.pri:c.txtS,
                }}>{cat}</button>
              ))}
            </div>
          </div>
          <div><Lbl c={c}>Notes (optional)</Lbl><Inp c={c} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Description..."/></div>
          <Btn c={c} v="pri" onClick={addExp} fw><Plus size={13}/>Add Expense</Btn>
        </div>
      </div>

      {/* Upload */}
      <div style={{borderRadius:14,padding:16,marginBottom:16,border:`2px dashed ${c.outV}`,textAlign:"center",cursor:"pointer"}}
        onClick={()=>fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.csv" style={{display:"none"}} onChange={handleFile}/>
        <Upload size={20} style={{display:"block",margin:"0 auto 8px",color:c.pri}}/>
        <div style={{fontSize:13,fontWeight:600,color:c.txt}}>Upload Bills / Statements</div>
        <div style={{fontSize:11,color:c.out,marginTop:2}}>PDF, images, CSV — referenced in AI Report</div>
      </div>
      {uploads.length>0&&(
        <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:6}}>
          {uploads.slice(0,4).map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,background:c.surfH,borderRadius:10,padding:"10px 14px",border:`1px solid ${c.outV}`}}>
              <FileText size={13} color={c.pri}/><div style={{flex:1}}><div style={{fontSize:12,color:c.txt,fontWeight:500}}>{u.name}</div><div style={{fontSize:9,color:c.out}}>{u.date} · {(u.size/1024).toFixed(1)}KB</div></div>
            </div>
          ))}
        </div>
      )}

      {/* Expense list */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <span style={{fontSize:11,fontWeight:800,color:c.txtS,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',sans-serif"}}>
            Transactions ({filtered.length}) · {disp(totAED)}
          </span>
          <div style={{display:"flex",gap:5}}>
            {["today","month","all"].map(f=>(
              <button key={f} onClick={()=>setFilt(f)} style={{
                padding:"4px 11px",borderRadius:20,border:"none",cursor:"pointer",
                background:filt===f?c.pri:c.surfH,color:filt===f?c.onPri||c.bg:c.txtS,
                fontSize:10,fontWeight:700,fontFamily:"'Space Grotesk',sans-serif",textTransform:"capitalize"
              }}>{f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}</button>
            ))}
          </div>
        </div>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:28,color:c.out,fontSize:13,border:`2px dashed ${c.outV}`,borderRadius:12}}>No expenses recorded yet.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {filtered.slice(0,40).map(exp=>(
              <div key={exp.id} style={{background:c.surfH,borderRadius:11,padding:"11px 14px",border:`1px solid ${c.outV}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2,flexWrap:"wrap"}}>
                    <Badge c={c} col="pri">{exp.cat}</Badge>
                    <span style={{fontSize:10,color:c.out}}>{exp.date}</span>
                  </div>
                  {exp.notes&&<div style={{fontSize:11,color:c.txtS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.notes}</div>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:800,color:c.txt,fontFamily:"'Space Grotesk',sans-serif"}}>{disp(exp.amtAED)}</div>
                    <div style={{fontSize:9,color:c.out}}>{cur==="AED"?`₹${(exp.amtAED*aedToInr).toFixed(0)}`:`AED ${exp.amtAED.toFixed(2)}`}</div>
                  </div>
                  <button onClick={()=>delExp(exp.id)} style={{background:"none",border:"none",cursor:"pointer",color:`${c.err}77`,padding:3}}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE: MONTHLY AI REPORT
══════════════════════════════════════════════════ */
function ReportPage({c,expenses,uploads,cur,rate}) {
  const [report,setReport] = useState(null);
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState("");
  const aedToInr = rate?.AEDtoINR||22.56;
  const disp = (aed) => cur==="AED"?`AED ${aed.toFixed(2)}`:`₹ ${(aed*aedToInr).toFixed(0)}`;

  useEffect(()=>{ DB.get("lifex-report-"+monthKey()).then(r=>{ if(r) setReport(r); }); },[]);

  const generate = async () => {
    setLoading(true); setErr("");
    try {
      const me = expenses.filter(e=>e.date?.startsWith(monthKey()));
      const tot = me.reduce((s,e)=>s+e.amtAED,0);
      const byCat = {}; me.forEach(e=>{ byCat[e.cat]=(byCat[e.cat]||0)+e.amtAED; });
      const data = JSON.stringify({
        reportMonth: monthKey(),
        primaryCurrency: cur,
        exchangeRate: `1 AED = ${aedToInr.toFixed(4)} INR`,
        monthlyTotalAED: tot.toFixed(2),
        monthlyTotalINR: (tot*aedToInr).toFixed(2),
        transactionCount: me.length,
        categoryBreakdown: Object.entries(byCat).map(([c,a])=>({category:c,amountAED:a.toFixed(2),amountINR:(a*aedToInr).toFixed(0),pct:tot?((a/tot)*100).toFixed(1)+"%":"0%"})),
        recentTransactions: me.slice(0,60).map(e=>({date:e.date,category:e.cat,amountAED:e.amtAED.toFixed(2),notes:e.notes||""})),
        uploadedDocuments: uploads.map(u=>u.name),
      });

      const text = await ai(
        `You are a senior personal financial advisor specializing in UAE and India markets. Analyze this financial data and create a comprehensive, highly personalized advisory report.

FINANCIAL DATA:
${data}

Write a detailed report with EXACTLY these sections (use ## headers):

## 🎯 Executive Summary
Brief 2-3 sentence overview. Give a Financial Health Score X/10 with one-line justification. Highlight the single most important financial insight this month.

## 📊 Spending Breakdown Analysis
Analyze each spending category. Flag anything unusual vs typical benchmarks for the UAE. Call out patterns (e.g., if coffee > groceries, that's significant). Be specific with numbers.

## 💡 Savings Opportunities
List 4-6 SPECIFIC, actionable ways to save based on the actual data. Reference real categories and amounts. Not generic advice.

## 🔧 Financial Hacks for This Situation
5 smart tactical moves tailored to this person's actual spending profile. Think like a financial advisor who knows their numbers intimately.

## 📈 Investment & Savings Suggestions
Based on potential surplus and spending patterns, recommend specific investment actions. Consider UAE/India options: Emirates NBD savings, SGB, Nifty ETFs, emergency fund targets, etc.

## ⚡ Payment Priority Matrix
MUST PAY NOW: [items with reasons]
CAN WAIT: [items with reasons]
Base on their actual categories and typical UAE financial obligations.

## 🚀 30-Day Action Plan
3 concrete, numbered action items for next month with specific targets and amounts.

Be direct, specific, and authoritative. Reference actual numbers throughout. This person is serious about financial improvement.`,
        "You are an expert personal financial advisor. Be specific, data-driven, and actionable. Use markdown formatting.", 2000
      );

      const r = {content:text,generatedAt:new Date().toISOString(),month:monthKey()};
      setReport(r);
      DB.set("lifex-report-"+monthKey(),r);
    } catch(e) {
      setErr("Failed to generate report: "+e.message);
    } finally {
      setLoading(false);
    }
  };

  const monthName = MONTHS[new Date().getMonth()]+" "+new Date().getFullYear();
  const me = expenses.filter(e=>e.date?.startsWith(monthKey()));
  const tot = me.reduce((s,e)=>s+e.amtAED,0);

  const renderReport = (text) => {
    const lines = text.split("\n");
    return lines.map((line,i)=>{
      if(line.startsWith("## ")) return <h3 key={i} style={{fontSize:15,fontWeight:800,color:c.pri,fontFamily:"'Space Grotesk',sans-serif",margin:"22px 0 10px",borderBottom:`1px solid ${c.outV}`,paddingBottom:8}}>{line.slice(3)}</h3>;
      if(line.startsWith("### ")) return <h4 key={i} style={{fontSize:13,fontWeight:700,color:c.sec,fontFamily:"'Space Grotesk',sans-serif",margin:"14px 0 6px"}}>{line.slice(4)}</h4>;
      if(line.startsWith("**")&&line.endsWith("**")) return <div key={i} style={{fontSize:13,fontWeight:700,color:c.txt,margin:"8px 0 4px"}}>{line.slice(2,-2)}</div>;
      if(line.startsWith("- ")||line.startsWith("• ")) return <div key={i} style={{fontSize:13,color:c.txtS,margin:"4px 0",paddingLeft:14,borderLeft:`2px solid ${c.outV}`,lineHeight:1.6}}>{line.slice(2)}</div>;
      if(line.match(/^\d+\. /)) return <div key={i} style={{fontSize:13,color:c.txtS,margin:"6px 0",paddingLeft:6,lineHeight:1.6}}>{line}</div>;
      if(line.trim()==="") return <div key={i} style={{height:6}}/>;
      return <p key={i} style={{fontSize:13,color:c.txtS,margin:"4px 0",lineHeight:1.7}}>{line}</p>;
    });
  };

  return (
    <div>
      <style>{`@media print{.no-print{display:none!important;}.print-area{background:white!important;color:#111!important;}}`}</style>
      {/* Header info */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,color:c.pri,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Space Grotesk',sans-serif",marginBottom:4}}>AI Financial Intelligence</div>
        <h2 style={{fontSize:22,fontWeight:800,color:c.txt,fontFamily:"'Space Grotesk',sans-serif",margin:"0 0 4px",letterSpacing:"-0.02em"}}>{monthName} Report</h2>
        <div style={{fontSize:12,color:c.txtS}}>{me.length} transactions · {disp(tot)} total spend</div>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}} className="no-print">
        <Btn c={c} v="pri" onClick={generate} disabled={loading}>
          <Sparkles size={14}/>{loading?"Analyzing...":report?"Regenerate Report":"Generate AI Report"}
        </Btn>
        {report&&<Btn c={c} v="ghost" onClick={()=>window.print()}><Printer size={14}/>Export PDF</Btn>}
      </div>

      {/* Loading */}
      {loading&&(
        <div style={{background:c.surfH,borderRadius:16,padding:48,textAlign:"center",border:`1px solid ${c.pri}33`}}>
          <div style={{fontSize:30,color:c.pri,animation:"spin 2s linear infinite",display:"inline-block"}}>◉</div>
          <div style={{fontSize:14,fontWeight:600,color:c.txt,marginTop:14}}>AI is analyzing your financial data...</div>
          <div style={{fontSize:12,color:c.txtS,marginTop:6}}>Reviewing {me.length} transactions across {new Set(me.map(e=>e.cat)).size} categories</div>
          <div style={{marginTop:16,display:"flex",justifyContent:"center",gap:8}}>
            {["Analyzing spending","Identifying patterns","Generating insights"].map((s,i)=>(
              <div key={i} style={{fontSize:9,fontWeight:700,color:c.out,fontFamily:"'Space Grotesk',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em"}}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {err&&<div style={{background:`${c.err}18`,border:`1px solid ${c.err}44`,borderRadius:12,padding:14,color:c.err,fontSize:13,marginBottom:16}}>{err}</div>}

      {/* Empty */}
      {!report&&!loading&&(
        <div style={{background:c.surfH,borderRadius:16,padding:48,textAlign:"center",border:`2px dashed ${c.outV}`}}>
          <BarChart2 size={40} style={{display:"block",margin:"0 auto 14px",color:c.out}}/>
          <div style={{fontSize:15,fontWeight:700,color:c.txt,marginBottom:6}}>No Report Yet</div>
          <div style={{fontSize:13,color:c.out,maxWidth:280,margin:"0 auto"}}>Add expenses in the Finance section, then generate your personalized AI financial report.</div>
        </div>
      )}

      {/* Report */}
      {report&&!loading&&(
        <div className="print-area" style={{background:c.surf,borderRadius:16,padding:24,border:`1px solid ${c.outV}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${c.outV}`,flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:c.pri,fontFamily:"'Space Grotesk',sans-serif"}}>LifeX · Financial Advisory Report</div>
              <div style={{fontSize:11,color:c.txtS}}>{monthName} · Generated {new Date(report.generatedAt).toLocaleString()}</div>
            </div>
            <div style={{display:"flex",gap:6",flexWrap:"wrap"}}>
              <Badge c={c} col="pri">AI GENERATED</Badge>
              <Badge c={c} col="sec">{cur}</Badge>
            </div>
          </div>
          <div>{renderReport(report.content)}</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════ */
export default function LifeX() {
  const [page,setPage] = useState("dashboard");
  const [theme,setTheme] = useState("dark");
  const c = theme==="dark"?DARK:LIGHT;

  const defaultTasks = {
    morning:[{id:"morning-1",title:"Job Applications — Send/follow-up today",done:false,notes:"",date:todayKey()}],
    evening:[],
    custom:[]
  };
  const [tasks,setTasks] = useState(defaultTasks);
  const [events,setEvents] = useState([]);
  const [wisdom,setWisdom] = useState(null);
  const [savedWisdom,setSavedWisdom] = useState([]);
  const [expenses,setExpenses] = useState([]);
  const [uploads,setUploads] = useState([]);
  const [cur,setCur] = useState("AED");
  const [rate,setRate] = useState({AEDtoINR:22.56,updated:null});
  const [loadEvening,setLoadEvening] = useState(false);
  const [loadWisdom,setLoadWisdom] = useState(false);
  const [loadRate,setLoadRate] = useState(false);
  const [booted,setBooted] = useState(false);

  // Load all stored data
  useEffect(()=>{
    async function init() {
      const [st,se,sw,ssw,sexp,sup,scu,srat,sth] = await Promise.all([
        DB.get("lifex-tasks-"+todayKey()),
        DB.get("lifex-events"),
        DB.get("lifex-wisdom-"+todayKey()),
        DB.get("lifex-saved-wisdom"),
        DB.get("lifex-expenses"),
        DB.get("lifex-uploads"),
        DB.get("lifex-currency"),
        DB.get("lifex-rate"),
        DB.get("lifex-theme"),
      ]);
      if(st) setTasks(st); 
      if(se) setEvents(se);
      if(sw) setWisdom(sw);
      if(ssw) setSavedWisdom(ssw);
      if(sexp) setExpenses(sexp);
      if(sup) setUploads(sup);
      if(scu) setCur(scu);
      if(srat) setRate(srat);
      if(sth) setTheme(sth);

      // Generate AI content if missing
      if(!sw) genWisdom();
      if(!st||!st.evening?.length) genEvening(st||defaultTasks);

      setBooted(true);
    }
    init();
    fetchRate();
  },[]);

  const fetchRate = async () => {
    setLoadRate(true);
    try {
      const res = await fetch("https://api.frankfurter.app/latest?from=AED&to=INR");
      const data = await res.json();
      if(data.rates?.INR) {
        const nr={AEDtoINR:data.rates.INR,updated:new Date().toISOString()};
        setRate(nr); DB.set("lifex-rate",nr);
      }
    } catch(e) { console.log("Using cached rate"); }
    finally { setLoadRate(false); }
  };

  const genWisdom = async () => {
    setLoadWisdom(true);
    try {
      const text = await ai(
        `Generate ONE profound, non-cliché wisdom for today. Pick from: stoic philosophy, universe/cosmos facts, AI & technology breakthroughs, financial intelligence & compounding, emotional intelligence, behavioral psychology, history-defining moments, personal mastery. Must be specific and deep — NOT generic motivational fluff. Return ONLY valid JSON (no backticks): {"quote":"...","attribution":"person or source","category":"...","insight":"one sentence explaining why this matters in practice"}`,
        "You are a wisdom curator. Return only valid JSON, no markdown, no extra text."
      );
      const p = JSON.parse(text.trim());
      setWisdom(p); DB.set("lifex-wisdom-"+todayKey(),p);
    } catch(e) {
      const fb={quote:"The first principle is that you must not fool yourself — and you are the easiest person to fool.",attribution:"Richard Feynman",category:"Science & Wisdom",insight:"Intellectual humility — especially about our own certainty — is the foundation of all genuine progress."};
      setWisdom(fb); DB.set("lifex-wisdom-"+todayKey(),fb);
    } finally { setLoadWisdom(false); }
  };

  const genEvening = async (currentTasks) => {
    setLoadEvening(true);
    try {
      const today = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
      const text = await ai(
        `Today is ${today}. Generate exactly 3 specific AI/technology learning sessions for this evening. Must reference current 2024-2025 developments (specific models, techniques, tools, concepts). Each should be genuinely actionable. Return ONLY valid JSON array (no backticks): [{"title":"specific task title","description":"what you will learn and how to do it","duration":"X min","topic":"Category Name"}]`,
        "You are an AI learning coach with current knowledge. Return only valid JSON array, no backticks."
      );
      const p = JSON.parse(text.trim());
      const et = p.map(t=>({...t,id:uid(),done:false,notes:""}));
      const nt={...(currentTasks||tasks),evening:et};
      setTasks(nt); DB.set("lifex-tasks-"+todayKey(),nt);
    } catch(e) {
      const fb=[
        {id:uid(),title:"Master Advanced Prompt Engineering: Chain-of-Thought & Few-Shot Techniques",description:"Practice structured prompting patterns that significantly improve AI output quality for complex tasks",duration:"35 min",topic:"Prompt Engineering",done:false,notes:""},
        {id:uid(),title:"Study AI Agent Architectures: ReAct, Tool-Use & Multi-Step Reasoning",description:"Understand how modern AI agents break down complex goals and use tools to accomplish them",duration:"40 min",topic:"AI Agents",done:false,notes:""},
        {id:uid(),title:"Deep Dive: RAG Systems — How LLMs Access External Knowledge",description:"Learn how Retrieval-Augmented Generation makes AI answers accurate, current, and grounded in real data",duration:"30 min",topic:"AI Systems",done:false,notes:""},
      ];
      const nt={...(currentTasks||tasks),evening:fb};
      setTasks(nt); DB.set("lifex-tasks-"+todayKey(),nt);
    } finally { setLoadEvening(false); }
  };

  const saveTasks = useCallback((nt) => { setTasks(nt); DB.set("lifex-tasks-"+todayKey(),nt); },[]);
  const saveEvents = useCallback((ne) => { setEvents(ne); DB.set("lifex-events",ne); },[]);
  const saveExpenses = useCallback((ne) => { setExpenses(ne); DB.set("lifex-expenses",ne); },[]);
  const toggleTheme = () => { const t=theme==="dark"?"light":"dark"; setTheme(t); DB.set("lifex-theme",t); };

  const refreshWisdom = () => genWisdom();

  const nav = [
    {key:"dashboard",Icon:Home,label:"Hub"},
    {key:"tasks",Icon:CheckSquare,label:"Tasks"},
    {key:"calendar",Icon:CalendarDays,label:"Calendar"},
    {key:"wisdom",Icon:BookOpen,label:"Wisdom"},
    {key:"finance",Icon:Wallet,label:"Finance"},
    {key:"report",Icon:BarChart2,label:"Report"},
  ];

  const titles = {
    dashboard:"⚡ Command Hub",tasks:"✓ Daily Tasks",calendar:"◈ Calendar",
    wisdom:"✦ Daily Wisdom",finance:"◎ Finance Tracker",report:"◆ Monthly AI Report"
  };

  return (
    <div style={{minHeight:"100vh",background:c.bg,color:c.txt,fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&family=Lora:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${c.outV};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator{filter:${theme==="dark"?"invert(0.7)":"none"};cursor:pointer;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media print{.no-print{display:none!important;}}
        select option{background:${c.surfH};}
        textarea{transition:border-color .2s;}
        textarea:focus{border-color:${c.pri}!important;outline:none;}
      `}</style>

      {/* TOP BAR */}
      <div className="no-print" style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        background:c.nav,backdropFilter:"blur(24px)",
        borderBottom:`1px solid ${c.outV}33`,
        boxShadow:`0 2px 30px ${c.pri}10`,
        height:56,display:"flex",alignItems:"center",
        justifyContent:"space-between",padding:"0 20px"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Terminal size={18} color={c.pri}/>
          <span style={{fontSize:20,fontWeight:800,color:c.pri,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"-0.03em"}}>LifeX</span>
          <span style={{fontSize:9,fontWeight:700,color:c.out,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Space Grotesk',sans-serif",marginLeft:4,display:"inline"}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:c.ter,display:"inline-block",marginRight:4,animation:"pulse 2s infinite",verticalAlign:"middle"}}/>
            LIVE
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {/* Desktop nav links */}
          <div style={{display:"flex",gap:2}}>
            {nav.map(({key,Icon,label})=>(
              <button key={key} onClick={()=>setPage(key)} style={{
                background:page===key?`${c.pri}18`:"transparent",
                border:`1px solid ${page===key?c.pri+"55":"transparent"}`,
                borderRadius:8,padding:"5px 10px",cursor:"pointer",
                color:page===key?c.pri:c.out,fontSize:11,fontWeight:700,
                fontFamily:"'Space Grotesk',sans-serif",display:"flex",alignItems:"center",gap:5,
                transition:"all 0.2s"
              }}>
                <Icon size={13}/><span>{label}</span>
              </button>
            ))}
          </div>
          <div style={{width:1,height:20,background:c.outV,margin:"0 4px"}}/>
          <button onClick={toggleTheme} style={{
            background:c.surfH,border:`1px solid ${c.outV}`,borderRadius:8,
            padding:"5px 8px",cursor:"pointer",color:c.txt,display:"flex",alignItems:"center",gap:4
          }}>
            {theme==="dark"?<Sun size={14}/>:<Moon size={14}/>}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{maxWidth:720,margin:"0 auto",padding:"72px 16px 90px",animation:"fadeIn 0.3s ease"}}>
        {/* Page header */}
        <div className="no-print" style={{marginBottom:18}}>
          <h1 style={{fontSize:20,fontWeight:800,color:c.txt,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"-0.02em"}}>
            {titles[page]}
          </h1>
          <div style={{height:2,width:36,background:c.pri,borderRadius:1,marginTop:5}}/>
        </div>

        {/* Pages */}
        {page==="dashboard"&&<Dashboard c={c} tasks={tasks} wisdom={wisdom} expenses={expenses} rate={rate.AEDtoINR} cur={cur} setPage={setPage}/>}
        {page==="tasks"&&<TasksPage c={c} tasks={tasks} saveTasks={saveTasks} onRegenEvening={()=>genEvening(tasks)} loadEvening={loadEvening}/>}
        {page==="calendar"&&<CalendarPage c={c} events={events} saveEvents={saveEvents}/>}
        {page==="wisdom"&&<WisdomPage c={c} wisdom={wisdom} refreshWisdom={refreshWisdom} loadWisdom={loadWisdom} savedWisdom={savedWisdom} setSavedWisdom={setSavedWisdom}/>}
        {page==="finance"&&<FinancePage c={c} expenses={expenses} saveExpenses={saveExpenses} uploads={uploads} setUploads={setUploads} cur={cur} setCur={setCur} rate={rate} refreshRate={fetchRate} loadRate={loadRate}/>}
        {page==="report"&&<ReportPage c={c} expenses={expenses} uploads={uploads} cur={cur} rate={rate}/>}
      </div>

      {/* BOTTOM NAV */}
      <div className="no-print" style={{
        position:"fixed",bottom:0,left:0,right:0,zIndex:100,
        background:c.nav,backdropFilter:"blur(24px)",
        borderTop:`1px solid ${c.outV}33`,
        boxShadow:`0 -4px 30px ${c.bg}99`,
        padding:"6px 0 10px",
        display:"flex",justifyContent:"space-around",alignItems:"center"
      }}>
        {nav.map(({key,Icon,label})=>(
          <button key={key} onClick={()=>setPage(key)} style={{
            background:"none",border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            color:page===key?c.pri:c.out,padding:"3px 8px",
            transition:"all 0.2s"
          }}>
            <div style={{
              width:34,height:26,borderRadius:8,
              background:page===key?`${c.pri}18`:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all 0.2s",
              boxShadow:page===key?`0 0 12px ${c.pri}30`:"none"
            }}>
              <Icon size={17} strokeWidth={page===key?2.5:1.8}/>
            </div>
            <span style={{fontSize:9,fontWeight:page===key?800:600,fontFamily:"'Space Grotesk',sans-serif",textTransform:"uppercase",letterSpacing:"0.06em"}}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
