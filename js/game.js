/* Game state, chapter switching, level runners and boot. */
"use strict";
/* ---------- chapter + persistence ---------- */
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
};
let chi=0, saved={};
function chap(){return CHAPTERS[chi];}
function lvls(){return chap().levels;}
function lv(){return lvls()[cur];}
function loadChapter(i){
  chi=Math.max(0,Math.min(CHAPTERS.length-1,i));
  saved=store.get(chap().saveKey,{})||{};
  store.set("hyoshiki-dojo-chapter",chap().id);
  const C=chap();
  $("#chapter-line").innerHTML=`Chapter ${C.n} · <b>${C.jp}</b> · ${C.en}`;
  $("#sources").innerHTML=C.sources.map(s=>`<li>${s}</li>`).join("");
  renderChapters();
  cur=0;startLevel();
}
function save(){store.set(chap().saveKey,saved);}

/* ---------- state ---------- */
let cur=0, idx=0, firstTry=true, keepFirst=false, answered=false, order=[];
function prog(l){return saved[lvls()[l].id]||{};}
function record(ok){
  const id=lv().id, p=saved[id]=saved[id]||{};
  if(!(idx in p)) p[idx]=ok&&firstTry;
  else if(ok&&firstTry) p[idx]=true;
  save(); renderTabs();
}

function renderChapters(){
  const n=$("#chapters");n.innerHTML="";
  CHAPTERS.forEach((C,i)=>{
    const b=document.createElement("button");
    b.className="chap";b.id="chap-"+C.id;b.setAttribute("aria-pressed",i===chi);
    b.innerHTML=`<span class="cn">Ch ${C.n}</span><span>${C.short}</span>`;
    b.onclick=()=>{if(i!==chi){try{history.replaceState(null,"","#"+C.id);}catch(e){}loadChapter(i);}};
    n.appendChild(b);
  });
}
function renderTabs(){
  const t=$("#tabs");t.innerHTML="";
  t.style.gridTemplateColumns=`repeat(${lvls().length},1fr)`;
  lvls().forEach((L,i)=>{
    const p=prog(i), right=Object.values(p).filter(Boolean).length;
    const b=document.createElement("button");
    b.className="tab";b.setAttribute("role","tab");b.id="tab-"+L.id;b.setAttribute("aria-selected",i===cur);
    b.innerHTML=`<span class="n">${L.n}</span><span>${L.short}</span><span class="p">${right}/${L.items.length}</span>`;
    b.onclick=()=>{cur=i;startLevel();};
    t.appendChild(b);
  });
}

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function startLevel(){idx=0;const L=lv();order=L.id==="sort"?shuffle(L.items.map((_,i)=>i)):L.items.map((_,i)=>i);renderTabs();renderScenario();}

function shell(prompt,hint){
  const L=lv();
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
function refText(ref){return /^(施行令|道路交通法)/.test(ref)?ref:chap().src+" "+ref;}
function feedback(ok,why,ref,{retry=true}={}){
  answered=ok;
  $("#fb").innerHTML=`<div class="feedback ${ok?"ok":"bad"}"><span class="verdict">${ok?"Correct":"Not quite"}</span><span>${why}</span><span class="src">${refText(ref)}</span></div>`;
  record(ok);
  const c=$("#ctrl");c.innerHTML="";
  if(!ok&&retry){const r=document.createElement("button");r.className="btn";r.id="retry";r.textContent="Try again";r.onclick=()=>{firstTry=false;keepFirst=true;renderScenario();};c.appendChild(r);}
  const n=document.createElement("button");n.className="btn primary";n.id="next";n.textContent=idx<lv().items.length-1?"Next":"Finish";n.onclick=next;c.appendChild(n);
  if(!ok)firstTry=false;
}
function next(){if(idx<lv().items.length-1){idx++;renderScenario();}else finish();}
function finish(){
  const L=lv(),p=prog(cur),right=Object.values(p).filter(Boolean).length;
  const lastLevel=cur>=lvls().length-1, nextChap=CHAPTERS[chi+1];
  const nextBtn=!lastLevel?`<button class="btn primary" id="nextlvl">Next: ${lvls()[cur+1].n} ${lvls()[cur+1].title}</button>`
    :nextChap?`<button class="btn primary" id="nextchap">Next: Chapter ${nextChap.n}</button>`:"";
  $("#card").innerHTML=`<div class="done-banner"><div class="lvl-head" style="justify-content:center"><h2>${L.n} ${L.title}</h2></div>
    <div class="big">${right} / ${L.items.length}</div><div class="hint">Right on the first try</div>
    <div class="row" style="justify-content:center"><button class="btn" id="again">Play again</button>${nextBtn}</div></div>`;
  $("#again").onclick=()=>{saved[L.id]={};save();startLevel();};
  const nl=$("#nextlvl");if(nl)nl.onclick=()=>{cur++;startLevel();};
  const nc=$("#nextchap");if(nc)nc.onclick=()=>{try{history.replaceState(null,"","#"+nextChap.id);}catch(e){}loadChapter(chi+1);};
}

/* pointer → svg coords */
function svgPt(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
function hudHTML(rows,extra=""){
  return `<div class="hud">${extra}${rows.map(([l,v])=>`<div class="item"><span class="lbl">${l}</span><span class="hv">${v}</span></div>`).join("")}</div>`;
}

/* ======================= Chapter 1 ======================= */
/* ---------- 1.1 sort ---------- */
function renderSort(){
  const k=lv().items[order[idx]], S=SIGNS[k];
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
  const s=lv().items[idx];
  const body=shell(`You are driving a <span class="goal">${s.car||"普通乗用車"}</span>. Drag the car to where you may legally go: <b>straight on</b> past the sign, or <b>turn right</b> instead.`,"Tap a highlighted area if dragging is awkward.");
  body.innerHTML=`<div class="hud"><div class="item"><span class="lbl">Now</span><span class="clock">${s.day} ${s.time}</span></div>
     <div class="item"><span class="lbl">Sign ahead</span><div style="display:flex;align-items:center;gap:8px">${signSVG(s.sign,48)}${s.plate?plateSVG(s.plate,s.plate.length>3?96:70):`<span class="hint">no plate</span>`}</div></div></div>
     <svg class="field" id="f" viewBox="0 0 360 360" aria-label="road scene"></svg>`;
  const f=$("#f");
  el("rect",{x:0,y:0,width:360,height:360,fill:"var(--field)"},f);
  el("rect",{x:140,y:150,width:80,height:210,fill:ROAD},f);
  el("rect",{x:150,y:0,width:60,height:150,fill:ROAD},f);
  el("rect",{x:220,y:150,width:140,height:80,fill:ROAD},f);
  el("line",{x1:180,y1:230,x2:180,y2:360,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},f);
  el("line",{x1:220,y1:190,x2:360,y2:190,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},f);
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
function renderSignal(){
  const s=lv().items[idx];
  const body=shell(`You want to <span class="goal">${GOALW[s.goal]}</span>. Draw what you may do now: start your finger on the car and drag a path. To stop, end the path at the stop line.`);
  body.innerHTML=`<div class="hud"><div class="item"><span class="lbl">Signal</span>${signalSVG(s.sig,s.arrows||[])}</div>
     <div class="item"><span class="lbl">State</span><span class="hv">${signalWords[s.sig]}${s.arrows?" + green right arrow":""}</span></div>
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
  const segs=[];let total=0;
  for(let i=1;i<line.length;i++){const d=Math.hypot(line[i].x-line[i-1].x,line[i].y-line[i-1].y);segs.push(d);total+=d;}
  if(total<1)return;
  const place=(dist)=>{let i=0;while(i<segs.length-1&&dist>segs[i]){dist-=segs[i];i++;}
    const a=line[i],b=line[i+1],r=Math.min(1,dist/segs[i]||0),x=a.x+(b.x-a.x)*r,y=a.y+(b.y-a.y)*r,ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+90;
    car.setAttribute("transform",`translate(${x} ${y}) rotate(${ang})`);};
  if(reduceMotion){place(total);return;}
  const dur=Math.min(1800,total*6),t0=performance.now();
  const step=t=>{const k=Math.min(1,(t-t0)/dur);place(total*k);if(k<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

/* ---------- 1.4 stop position ---------- */
function renderStop(){
  const s=lv().items[idx];
  const body=shell(`The signal ahead is <span class="goal">赤 (red)</span>. Drag the car forward and stop it at the correct stop position.`,"Or tap the road where the front of the car should stop.");
  body.innerHTML=`<div class="hud"><div class="item"><span class="lbl">Signal</span>${signalSVG("red")}</div>
    <div class="item"><span class="lbl">Markings</span><span class="hv">${s.stopLine?"Stop line + crosswalk":s.cross?"Crosswalk only":"No stop line, no crosswalk"}</span></div></div>
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

/* ======================= Chapter 2 ======================= */
/* ---------- lanes: drag the car into a lane ---------- */
const RX0=30, RW=300;
function laneGeom(n){const w=RW/n;return{w,cx:i=>RX0+w*i+w/2};}
function laneName(s,i){
  const L=s.lanes[i], ups=s.lanes.filter(l=>l.dir==="up").length;
  if(L.dir==="down")return "Oncoming half";
  if(L.paint)return L.paint.replace("バス","Bus lane ")+"";
  if(s.lanes.some(l=>l.dir==="down"))return "Your half";
  if(ups===2)return i===0?"Left lane":"Right lane";
  return ["Left lane","Middle lane","Right lane"][i]||`Lane ${i+1}`;
}
function renderLanes(){
  const s=lv().items[idx], n=s.lanes.length, g=laneGeom(n);
  const body=shell(lv().task,"Or tap a lane, or use the buttons.");
  const signChip=s.sign?`<div class="item"><span class="lbl">Sign</span>${signSVG(s.sign,44)}</div>`:"";
  body.innerHTML=hudHTML(s.hud,signChip)+
    `<svg class="field" id="f" viewBox="0 0 360 360" aria-label="road seen from above"></svg>
     <div class="alt"><span>Choose:</span>${s.lanes.map((_,i)=>`<button data-l="${i}">${laneName(s,i).replace("Bus lane 専用","Bus lane (専用)").replace("Bus lane 優先","Bus lane (優先)")}</button>`).join("")}</div>`;
  const f=$("#f");
  el("rect",{x:0,y:0,width:360,height:360,fill:"var(--field)"},f);
  el("rect",{x:RX0,y:0,width:RW,height:360,fill:ROAD},f);
  // edge lines (車道外側線)
  el("line",{x1:RX0+4,y1:0,x2:RX0+4,y2:360,stroke:LINE,"stroke-width":2},f);
  el("line",{x1:RX0+RW-4,y1:0,x2:RX0+RW-4,y2:360,stroke:LINE,"stroke-width":2},f);
  s.lanes.forEach((L,i)=>{
    const x0=RX0+g.w*i;
    if(L.paint){
      el("rect",{x:x0+6,y:0,width:g.w-12,height:360,fill:"rgba(200,60,40,.16)"},f);
      for(const y of [70,250]){const t=el("text",{x:x0+g.w/2,y,"text-anchor":"middle","font-size":16,"font-weight":700,fill:"#f2f2ee","font-family":"sans-serif","letter-spacing":"1"},f);t.textContent=L.paint;}
    }
    // direction chevrons
    const cy=L.paint?160:180, up=L.dir==="up";
    el("path",{d:up?`M${x0+g.w/2-9} ${cy+6} L${x0+g.w/2} ${cy-6} L${x0+g.w/2+9} ${cy+6}`:`M${x0+g.w/2-9} ${cy-6} L${x0+g.w/2} ${cy+6} L${x0+g.w/2+9} ${cy-6}`,stroke:"rgba(242,242,238,.45)","stroke-width":3,fill:"none"},f);
    const tb=el("rect",{x:x0+g.w/2-46,y:4,width:92,height:17,rx:8,fill:"rgba(20,24,27,.72)"},f);
    const t=el("text",{x:x0+g.w/2,y:16,"text-anchor":"middle","font-size":11,fill:"#e8ece9","font-family":"sans-serif"},f);t.textContent=laneName(s,i);
  });
  s.lines.forEach((m,i)=>{
    const x=RX0+g.w*(i+1);
    if(m==="yellow"){el("line",{x1:x,y1:0,x2:x,y2:340,stroke:"#f2c200","stroke-width":5},f);}
    else el("line",{x1:x,y1:0,x2:x,y2:340,stroke:LINE,"stroke-width":3,"stroke-dasharray":"18 12"},f);
  });
  (s.objs||[]).forEach(o=>{
    const x=g.cx(o.lane);
    if(o.type==="cones")conesG(f,x,o.y,g.w);
    else if(o.type==="oncoming")vehicleG(f,x,o.y,{rot:180,color:"#c7d0d8"});
    else vehicleG(f,x,o.y,{kind:o.type,color:o.color||"#e8c86a"});
  });
  const behind=(s.objs||[]).some(o=>o.type==="bus"&&o.y>250);
  const home={x:g.cx(s.start),y:behind?225:290};
  const car=carG(f,home.x,home.y);let pos={...home},drag=false;
  const laneAt=x=>{const i=Math.floor((x-RX0)/g.w);return i>=0&&i<n?i:null;};
  const place=i=>{
    if(answered)return;
    const ty=(s.objs||[]).some(o=>o.lane===i&&o.y>200&&o.y<300&&o.type!=="bus")?300:(i===s.start?290:240);
    pos={x:g.cx(i),y:behind?200:ty};
    car.setAttribute("transform",`translate(${pos.x} ${pos.y})`);
    const ok=s.ok.includes(i);
    let why=s.why;
    if(!ok&&s.lanes[i].dir==="down")why="That is the oncoming half of the road. "+why;
    feedback(ok,why,s.ref);
  };
  f.addEventListener("pointerdown",e=>{if(answered)return;const p=svgPt(f,e);
    if(Math.hypot(p.x-pos.x,p.y-pos.y)<40){drag=true;f.setPointerCapture(e.pointerId);}
    else{const i=laneAt(p.x);if(i!=null)place(i);}});
  f.addEventListener("pointermove",e=>{if(!drag)return;const p=svgPt(f,e);pos={x:Math.max(RX0+14,Math.min(RX0+RW-14,p.x)),y:Math.max(40,Math.min(320,p.y))};car.setAttribute("transform",`translate(${pos.x} ${pos.y})`);});
  f.addEventListener("pointerup",e=>{if(!drag)return;drag=false;
    if(Math.hypot(pos.x-home.x,pos.y-home.y)<12){car.setAttribute("transform",`translate(${home.x} ${home.y})`);pos={...home};return;}
    const i=laneAt(pos.x);if(i!=null)place(i);});
  body.querySelectorAll(".alt button").forEach(b=>b.onclick=()=>place(+b.dataset.l));
}

/* ---------- kerb: stop before crossing the pavement ---------- */
/* Layout (viewBox 360): car park y 0–120, pavement y 120–170, road y 170–360. Driveway x 140–220. */
const K={park:120,walk0:120,walk1:170};
function renderKerb(){
  const s=lv().items[idx], into=s.dir==="in";
  const body=shell(into
    ?`You are turning into a <span class="goal">car park</span> across the pavement. Drag the car and stop it where you must stop.`
    :`You are leaving a <span class="goal">car park</span> across the pavement. Drag the car and stop it where you must stop.`,
    "Or tap the driveway where the front of the car should stop.");
  body.innerHTML=hudHTML([["Pavement",s.peds?"A pedestrian is walking along it":"Empty"],["Road","Separate pavement and roadway"]])+
    `<svg class="field" id="f" viewBox="0 0 360 360" aria-label="driveway across a pavement"></svg>
     <div class="row"><button class="btn primary" id="confirm">Stop here</button></div>`;
  const f=$("#f");
  el("rect",{x:0,y:0,width:360,height:360,fill:"var(--field)"},f);
  el("rect",{x:20,y:10,width:320,height:K.park-10,rx:6,fill:"#5a6168"},f);
  for(let i=0;i<5;i++)el("line",{x1:40+i*60,y1:16,x2:40+i*60,y2:70,stroke:LINE,"stroke-width":2},f);
  const pt=el("text",{x:330,y:100,"text-anchor":"end","font-size":12,"font-weight":700,fill:"#f2f2ee","font-family":"sans-serif"},f);pt.textContent="P 駐車場";
  el("rect",{x:0,y:K.walk0,width:360,height:K.walk1-K.walk0,fill:"#a9a39a"},f);
  for(let x=0;x<360;x+=24)el("line",{x1:x,y1:K.walk0,x2:x,y2:K.walk1,stroke:"#968f86","stroke-width":1},f);
  el("rect",{x:140,y:K.walk0,width:80,height:K.walk1-K.walk0,fill:"#b8b2a8"},f);
  const wt=el("text",{x:20,y:K.walk0+30,"font-size":11,"font-weight":700,fill:"#3a3530","font-family":"sans-serif"},f);wt.textContent="歩道";
  el("rect",{x:0,y:K.walk1,width:360,height:360-K.walk1,fill:ROAD},f);
  el("rect",{x:0,y:K.walk1,width:360,height:4,fill:"#d6d0c6"},f);
  el("line",{x1:0,y1:270,x2:360,y2:270,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},f);
  if(s.peds)pedestrian(f,250,K.walk0+28);
  const x=180, rot=into?0:180;
  let cy=into?300:60; const car=carG(f,x,cy);car.setAttribute("transform",`translate(${x} ${cy}) rotate(${rot})`);
  const front=()=>into?cy-25:cy+25;
  const set=y=>{cy=Math.max(40,Math.min(320,y));car.setAttribute("transform",`translate(${x} ${cy}) rotate(${rot})`);};
  let drag=false,off=0;
  f.addEventListener("pointerdown",e=>{if(answered)return;const p=svgPt(f,e);
    if(Math.abs(p.x-x)<40&&Math.abs(p.y-cy)<40){drag=true;off=p.y-cy;f.setPointerCapture(e.pointerId);}
    else if(p.x>=130&&p.x<=230)set(into?p.y+25:p.y-25);});
  f.addEventListener("pointermove",e=>{if(drag)set(svgPt(f,e).y-off);});
  f.addEventListener("pointerup",()=>{drag=false;});
  $("#confirm").onclick=()=>{
    if(answered)return;
    const fr=front(); let ok,why=s.why;
    if(into){ // stopping edge is the road-side kerb (walk1); front must be just below it
      ok=fr>=K.walk1&&fr<=K.walk1+26;
      if(fr<K.walk1)why=(fr<K.walk0?"You drove across the pavement without stopping. ":"The front of the car is on the pavement. ")+why;
      else if(!ok)why="You stopped well back from the pavement. Pull up to just before it. "+why;
    }else{
      ok=fr<=K.walk0&&fr>=K.walk0-26;
      if(fr>K.walk0)why=(fr>K.walk1?"You drove across the pavement without stopping. ":"The front of the car is on the pavement. ")+why;
      else if(!ok)why="You stopped well back from the pavement. Pull up to just before it. "+why;
    }
    feedback(ok,why,s.ref);
  };
}

function renderScenario(){
  const L=lv(), k=L.kind||L.id;
  ({sort:renderSort,plate:renderPlate,signal:renderSignal,stoppos:renderStop,lanes:renderLanes,kerb:renderKerb})[k]();
}

/* ---------- boot ---------- */
(function boot(){
  const fromHash=(location.hash||"").slice(1), last=store.get("hyoshiki-dojo-chapter","ch1");
  let i=CHAPTERS.findIndex(c=>c.id===fromHash);
  if(i<0)i=CHAPTERS.findIndex(c=>c.id===last);
  loadChapter(i<0?0:i);
  window.addEventListener("hashchange",()=>{
    const j=CHAPTERS.findIndex(c=>c.id===location.hash.slice(1));
    if(j>=0&&j!==chi)loadChapter(j);
  });
})();
