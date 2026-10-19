/* Game state, level runners and boot. */
"use strict";
/* ---------- persistence ---------- */
const KEY="hyoshiki-dojo-ch1-v1";
let saved={};
try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){saved={};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(e){}}

/* ---------- state ---------- */
let cur=0, idx=0, firstTry=true, keepFirst=false, answered=false, order=[];
function prog(l){return saved[LEVELS[l].id]||{};}
function record(ok){
  const p=saved[LEVELS[cur].id]=saved[LEVELS[cur].id]||{};
  if(!(idx in p)) p[idx]=ok&&firstTry;
  else if(ok&&firstTry) p[idx]=true;
  save(); renderTabs();
}

function renderTabs(){
  const t=$("#tabs");t.innerHTML="";
  LEVELS.forEach((L,i)=>{
    const p=prog(i), right=Object.values(p).filter(Boolean).length;
    const b=document.createElement("button");
    b.className="tab";b.setAttribute("role","tab");b.id="tab-"+L.id;b.setAttribute("aria-selected",i===cur);
    b.innerHTML=`<span class="n">${L.n}</span><span>${L.short}</span><span class="p">${right}/${L.items.length}</span>`;
    b.onclick=()=>{cur=i;startLevel();};
    t.appendChild(b);
  });
}

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function startLevel(){idx=0;order=LEVELS[cur].id==="sort"?shuffle(LEVELS[cur].items.map((_,i)=>i)):LEVELS[cur].items.map((_,i)=>i);renderTabs();renderScenario();}

function shell(prompt,hint){
  const L=LEVELS[cur];
  $("#card").innerHTML=`
   <div class="lvl-head"><h2>${L.n} ${L.title}</h2><span class="count">${idx+1} of ${L.items.length}</span></div>
   <p class="prompt">${prompt}</p>
   <div id="body" style="display:flex;flex-direction:column;gap:12px"></div>
   ${hint?`<p class="hint">${hint}</p>`:""}
   <div id="fb"></div>
   <div class="row" id="ctrl"></div>`;
  if(!keepFirst)firstTry=true;
  keepFirst=false;answered=false;
  return $("#body");
}
function feedback(ok,why,ref,{retry=true}={}){
  answered=ok;
  $("#fb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}"><span class="verdict">${ok?"Correct":"Not quite"}</span><span>${why}</span><span class="src">${ref.startsWith("施行令")?"":SRC+" "}${ref}</span></div>`;
  record(ok);
  const c=$("#ctrl");c.innerHTML="";
  if(!ok&&retry){const r=document.createElement("button");r.className="btn";r.id="retry";r.textContent="Try again";r.onclick=()=>{firstTry=false;keepFirst=true;renderScenario();};c.appendChild(r);}
  const n=document.createElement("button");n.className="btn primary";n.id="next";n.textContent=idx<LEVELS[cur].items.length-1?"Next":"Finish";n.onclick=next;c.appendChild(n);
  if(!ok)firstTry=false;
}
function next(){if(idx<LEVELS[cur].items.length-1){idx++;renderScenario();}else finish();}
function finish(){
  const L=LEVELS[cur],p=prog(cur),right=Object.values(p).filter(Boolean).length;
  $("#card").innerHTML=`<div class="done-banner"><div class="lvl-head" style="justify-content:center"><h2>${L.n} ${L.title}</h2></div>
    <div class="big">${right} / ${L.items.length}</div><div class="hint">Right on the first try</div>
    <div class="row" style="justify-content:center"><button class="btn" id="again">Play again</button>${cur<LEVELS.length-1?`<button class="btn primary" id="nextlvl">Next: ${LEVELS[cur+1].n} ${LEVELS[cur+1].title}</button>`:""}</div></div>`;
  $("#again").onclick=()=>{saved[L.id]={};save();startLevel();};
  const nl=$("#nextlvl");if(nl)nl.onclick=()=>{cur++;startLevel();};
}

/* pointer → svg coords */
function svgPt(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}

/* ---------- 1.1 sort ---------- */
function renderSort(){
  const k=LEVELS[0].items[order[idx]], S=SIGNS[k];
  const body=shell("Which kind of main sign (本標識) is this? Drag it into a box, or tap a box.");
  body.innerHTML=`<div class="stage" id="stage"><div class="sign-card" id="sc">${signSVG(k,120)}</div></div>
   <div class="bins" id="bins">${Object.keys(CAT).map(c=>`<button class="bin" id="bin-${c}" data-cat="${c}"><span class="jp">${CAT[c][0]}</span><span class="en">${CAT[c][1]}</span></button>`).join("")}</div>`;
  const judge=(c)=>{
    if(answered)return;
    const ok=c===S.cat;
    feedback(ok,`<b>${S.jp}</b> · ${S.en}. ${ok?"":`It is a <b>${CAT[S.cat][0]}</b> (${CAT[S.cat][1].toLowerCase()} sign). `}${CAT_WHY[S.cat]}`,CAT_SRC[S.cat],{retry:false});
    $("#sc").style.visibility=ok?"hidden":"visible";
  };
  body.querySelectorAll(".bin").forEach(b=>b.onclick=()=>judge(b.dataset.cat));
  const sc=$("#sc");let drag=null;
  sc.addEventListener("pointerdown",e=>{if(answered)return;sc.setPointerCapture(e.pointerId);const r=sc.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top};sc.classList.add("dragging");move(e);});
  const move=e=>{if(!drag)return;sc.style.left=(e.clientX-drag.dx)+"px";sc.style.top=(e.clientY-drag.dy)+"px";
    body.querySelectorAll(".bin").forEach(b=>{const r=b.getBoundingClientRect();b.classList.toggle("hot",e.clientX>r.left&&e.clientX<r.right&&e.clientY>r.top&&e.clientY<r.bottom);});};
  sc.addEventListener("pointermove",move);
  sc.addEventListener("pointerup",e=>{if(!drag)return;drag=null;sc.classList.remove("dragging");sc.style.left=sc.style.top="";
    const hot=body.querySelector(".bin.hot");body.querySelectorAll(".bin").forEach(b=>b.classList.remove("hot"));if(hot)judge(hot.dataset.cat);});
}

/* ---------- 1.2 plates ---------- */
function renderPlate(){
  const s=LEVELS[1].items[idx];
  const body=shell(`You are driving a <span class="goal">${s.car||"普通乗用車"}</span>. Drag the car to where you may legally go: <b>straight on</b> past the sign, or <b>turn right</b> instead.`,"Tap a highlighted area if dragging is awkward.");
  body.innerHTML=`<div class="hud"><div class="item"><span class="lbl">Now</span><span class="clock">${s.day} ${s.time}</span></div>
     <div class="item"><span class="lbl">Sign ahead</span><div style="display:flex;align-items:center;gap:8px">${signSVG(s.sign,48)}${s.plate?plateSVG(s.plate,s.plate.length>3?96:70):`<span class="hint">no plate</span>`}</div></div></div>
     <svg class="field" id="f" viewBox="0 0 360 360" aria-label="road scene"></svg>`;
  const f=$("#f");
  el("rect",{x:0,y:0,width:360,height:360,fill:"var(--field)"},f);
  el("rect",{x:140,y:150,width:80,height:210,fill:ROAD},f);   // approach
  el("rect",{x:150,y:0,width:60,height:150,fill:ROAD},f);     // restricted street
  el("rect",{x:220,y:150,width:140,height:80,fill:ROAD},f);   // detour east
  el("line",{x1:180,y1:230,x2:180,y2:360,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},f);
  el("line",{x1:220,y1:190,x2:360,y2:190,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},f);
  // sign on the left at the entrance
  el("line",{x1:126,y1:150,x2:126,y2:112,stroke:"#9aa0a6","stroke-width":3},f);
  const sg=el("g",{transform:"translate(104 68) scale(.44)"},f);sg.innerHTML=SIGNS[s.sign].svg;
  if(s.plate){const pg=el("g",{transform:"translate(106 116)"},f);pg.innerHTML=`<rect width="40" height="15" rx="2" fill="#fff" stroke="#1d1d1d"/><text x="20" y="11.5" text-anchor="middle" font-size="9" font-weight="700" font-family="sans-serif" fill="#1d1d1d">${s.plate}</text>`;}
  const zones={north:{x:150,y:6,w:60,h:104,label:"Enter"},east:{x:250,y:152,w:104,h:38,label:"Turn right"}};
  for(const z in zones){const Z=zones[z];
    el("rect",{id:"z-"+z,x:Z.x,y:Z.y,width:Z.w,height:Z.h,rx:6,fill:"rgba(91,143,224,.18)",stroke:"#8fb4ff","stroke-width":2,"stroke-dasharray":"6 5"},f);
    const t=el("text",{x:Z.x+Z.w/2,y:Z.y+Z.h/2+4,"text-anchor":"middle","font-size":12,"font-weight":700,fill:"#dce7ff","font-family":"sans-serif"},f);t.textContent=Z.label;}
  const home={x:160,y:315};let car=carG(f,home.x,home.y);let pos={...home},drag=false;
  const place=(z)=>{if(answered)return;const Z=zones[z];pos={x:Z.x+Z.w/2,y:Z.y+Z.h/2};car.setAttribute("transform",`translate(${pos.x} ${pos.y}) rotate(${z==="east"?90:0})`);
    const ok=z===s.ok;feedback(ok,s.why,s.ref);};
  const hit=(p)=>{for(const z in zones){const Z=zones[z];if(p.x>=Z.x&&p.x<=Z.x+Z.w&&p.y>=Z.y&&p.y<=Z.y+Z.h)return z;}return null;};
  f.addEventListener("pointerdown",e=>{if(answered)return;const p=svgPt(f,e);
    if(Math.hypot(p.x-pos.x,p.y-pos.y)<40){drag=true;f.setPointerCapture(e.pointerId);}else{const z=hit(p);if(z)place(z);}});
  f.addEventListener("pointermove",e=>{if(!drag)return;const p=svgPt(f,e);pos=p;car.setAttribute("transform",`translate(${p.x} ${p.y})`);});
  f.addEventListener("pointerup",e=>{if(!drag)return;drag=false;const z=hit(svgPt(f,e));if(z)place(z);else{pos={...home};car.setAttribute("transform",`translate(${home.x} ${home.y})`);}});
}

/* ---------- 1.3 signals: draw a path ---------- */
const GOALW={left:"turn left",right:"turn right",straight:"go straight"};
function classify(pts){
  const end=pts[pts.length-1];
  const inStop=p=>p.x>=114&&p.x<=186&&p.y>=200&&p.y<=272;
  let dwell=0,run=0;
  for(let i=1;i<pts.length;i++){if(inStop(pts[i])&&inStop(pts[i-1])){run+=pts[i].t-pts[i-1].t;dwell=Math.max(dwell,run);}else run=0;}
  if(inStop(end))return{kind:"stop"};
  let kind=null,lane=true;
  if(end.x<112){kind="left";lane=end.y>=116&&end.y<=186;}
  else if(end.x>248){kind="right";lane=end.y>=54&&end.y<=124;}
  else if(end.y<58){kind="straight";lane=end.x>=114&&end.x<=186;}
  if(!kind)return{kind:"unclear"};
  if(kind==="straight"&&dwell>=450)kind="stopgo";
  return{kind,lane};
}
function renderSignal(retry){
  const s=LEVELS[2].items[idx];
  const body=shell(`You want to <span class="goal">${GOALW[s.goal]}</span>. Draw what you may do now: start your finger on the car and drag a path. To stop, end the path at the stop line.`);
  body.innerHTML=`<div class="hud"><div class="item"><span class="lbl">Signal</span>${signalSVG(s.sig,s.arrows||[])}</div>
     <div class="item"><span class="lbl">State</span><span style="font-family:var(--display);font-weight:700">${signalWords[s.sig]}${s.arrows?" + green right arrow":""}</span></div>
     ${s.plate?`<div class="item"><span class="lbl">Board</span>${leftOkPlate}</div>`:""}
     ${s.peds?`<div class="item"><span class="lbl">Crosswalk</span><span class="hint">Pedestrian in front of you, crossing on their green</span></div>`:""}</div>
     <svg class="field" id="f" viewBox="0 0 360 360" aria-label="intersection"></svg>
     <div class="alt"><span>Or choose:</span>${["left","straight","right","stop"].map(k=>`<button data-k="${k}">${k==="stop"?"Stop at line":GOALW[k].replace(/^\w/,c=>c.toUpperCase())}</button>`).join("")}<button data-k="stopgo">Stop, then straight</button></div>`;
  const f=$("#f");
  drawCrossing(f,{stopLine:true,cross:true,westCross:true,peds:!!s.peds});
  const pathEl=el("polyline",{points:"",fill:"none",stroke:"#8fb4ff","stroke-width":5,"stroke-linecap":"round","stroke-linejoin":"round","stroke-dasharray":"2 9"},f);
  const car=carG(f,G.start.x,G.start.y);
  let pts=null;
  const judge=(res,line)=>{
    if(answered)return;
    let ok=s.ok.includes(res.kind),why=s.why;
    if(res.kind==="unclear"){$("#fb").innerHTML=`<div class="feedback bad"><span class="verdict">Path unclear</span><span>End the path in an exit road, or at the stop line to stop.</span></div>`;pathEl.setAttribute("points","");return;}
    if(ok&&res.lane===false){ok=false;why=`You ended in the lane for oncoming traffic. In Japan you keep left, so after the turn you join the left-hand lane. `+why;}
    else if(!ok&&res.kind==="straight"&&s.ok.includes("stopgo"))why="You went straight without stopping. "+why;
    else if(!ok&&res.kind==="stop"&&s.ok.includes("stopgo"))why="Stopping is right, but you may then continue. "+why;
    feedback(ok,why,s.ref);
    if(ok&&line)animate(car,line);
  };
  f.addEventListener("pointerdown",e=>{if(answered)return;const p=svgPt(f,e);
    if(Math.hypot(p.x-G.start.x,p.y-G.start.y)>45){$("#fb").innerHTML=`<div class="feedback bad"><span class="verdict">Start on the car</span><span>Put your finger on the car first, then drag.</span></div>`;return;}
    $("#fb").innerHTML="";pts=[{x:G.start.x,y:G.start.y-25,t:e.timeStamp}];f.setPointerCapture(e.pointerId);});
  f.addEventListener("pointermove",e=>{if(!pts)return;const p=svgPt(f,e),l=pts[pts.length-1];
    if(Math.hypot(p.x-l.x,p.y-l.y)>3)pts.push({x:p.x,y:p.y,t:e.timeStamp});
    pathEl.setAttribute("points",pts.map(q=>q.x.toFixed(1)+","+q.y.toFixed(1)).join(" "));});
  f.addEventListener("pointerup",e=>{if(!pts)return;const p=pts;pts=null;
    p.push({x:p[p.length-1].x,y:p[p.length-1].y,t:e.timeStamp});
    if(p.length<4){pathEl.setAttribute("points","");return;}
    judge(classify(p),p.filter((q,i)=>i===0||q.x!==p[i-1].x||q.y!==p[i-1].y));});
  body.querySelectorAll(".alt button").forEach(b=>b.onclick=()=>{
    const k=b.dataset.k,lane={left:[[150,240],[150,160],[60,150]],right:[[150,240],[160,120],[300,90]],straight:[[150,240],[150,20]],stopgo:[[150,240],[150,20]],stop:[[150,246]]}[k];
    const line=[{x:G.start.x,y:G.start.y-25}].concat(lane.map(([x,y])=>({x,y})));
    pathEl.setAttribute("points",line.map(q=>q.x+","+q.y).join(" "));
    judge({kind:k,lane:true},line);});
}
function animate(car,line){
  // car centre follows the path, offset so the bumper rides the line
  const segs=[];let total=0;
  for(let i=1;i<line.length;i++){const d=Math.hypot(line[i].x-line[i-1].x,line[i].y-line[i-1].y);segs.push(d);total+=d;}
  if(total<1)return;
  const place=(dist)=>{let i=0;while(i<segs.length-1&&dist>segs[i]){dist-=segs[i];i++;}
    const a=line[i],b=line[i+1],r=Math.min(1,dist/segs[i]||0),x=a.x+(b.x-a.x)*r,y=a.y+(b.y-a.y)*r,ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90;
    car.setAttribute("transform",`translate(${x} ${y+0}) rotate(${ang})`);};
  if(reduceMotion){place(total);return;}
  const dur=Math.min(1800,total*6),t0=performance.now();
  const step=t=>{const k=Math.min(1,(t-t0)/dur);place(total*k);if(k<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

/* ---------- 1.4 stop position ---------- */
function renderStop(){
  const s=LEVELS[3].items[idx];
  const body=shell(`The signal ahead is <span class="goal">赤 (red)</span>. Drag the car forward and stop it at the correct stop position.`,"Or tap the road where the front of the car should stop.");
  body.innerHTML=`<div class="hud"><div class="item"><span class="lbl">Signal</span>${signalSVG("red")}</div>
    <div class="item"><span class="lbl">Markings</span><span style="font-family:var(--display);font-weight:700">${s.stopLine?"Stop line + crosswalk":s.cross?"Crosswalk only":"No stop line, no crosswalk"}</span></div></div>
    <svg class="field" id="f" viewBox="0 0 360 360" aria-label="approach to intersection"></svg>
    <div class="row"><button class="btn primary" id="confirm">Stop here</button></div>`;
  const f=$("#f");drawCrossing(f,{stopLine:s.stopLine,cross:s.cross});
  const x=G.start.x;let cy=G.start.y;const car=carG(f,x,cy);let drag=false,off=0;
  const set=(y)=>{cy=Math.max(150,Math.min(330,y));car.setAttribute("transform",`translate(${x} ${cy})`);};
  f.addEventListener("pointerdown",e=>{if(answered)return;const p=svgPt(f,e);
    if(Math.abs(p.x-x)<40&&Math.abs(p.y-cy)<40){drag=true;off=p.y-cy;f.setPointerCapture(e.pointerId);}else if(p.x>=110&&p.x<=190)set(p.y+25);});
  f.addEventListener("pointermove",e=>{if(drag)set(svgPt(f,e).y-off);});
  f.addEventListener("pointerup",()=>{drag=false;});
  $("#confirm").onclick=()=>{
    if(answered)return;
    const front=cy-25, lo=s.frontMin, hi=s.frontMin+28;
    let ok=front>=lo&&front<=hi,why=s.why;
    if(front<lo){
      if(front<G.box.y1)why="The front of the car is inside the intersection. "+why;
      else if(s.cross&&front<G.cwS.y1)why="The front of the car is on the crosswalk. "+why;
      else why="You went past the stop position. "+why;
    }else if(front>hi)why="You stopped well short. Pull up to just before the stop position. "+why;
    feedback(ok,why,s.ref);
  };
}

function renderScenario(){
  const id=LEVELS[cur].id;
  ({sort:renderSort,plate:renderPlate,signal:renderSignal,stoppos:renderStop})[id]();
}

renderTabs();startLevel();
