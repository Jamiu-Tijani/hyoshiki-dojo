/* Shared helpers, sign artwork, signal heads and road scenes. */
"use strict";
const $ = (s,el=document)=>el.querySelector(s);
const NS="http://www.w3.org/2000/svg";
/* Chapter registry: each levels/chN.js pushes one chapter object. */
const CHAPTERS=[];
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- signs (100x100 viewBox, real-world colours, theme-independent) ---------- */
const RED="#c8102e", BLUE="#1f4fa0", YEL="#f2c200", BLK="#1d1d1d", GRN="#1b7a45", WHT="#ffffff";
const diamond = `<polygon points="50,3 97,50 50,97 3,50" fill="${YEL}" stroke="${BLK}" stroke-width="4" stroke-linejoin="round"/>`;
const blueSq = `<rect x="5" y="5" width="90" height="90" rx="7" fill="${BLUE}" stroke="${WHT}" stroke-width="2"/>`;
const ring = (fill)=>`<circle cx="50" cy="50" r="44" fill="${fill}" stroke="${RED}" stroke-width="10"/>`;
const SIGNS = {
  shinnyu:  {jp:"進入禁止", en:"No entry (for vehicles, from this side)", cat:"kisei",
    svg:`<circle cx="50" cy="50" r="46" fill="${RED}" stroke="${WHT}" stroke-width="3"/><rect x="17" y="42" width="66" height="16" fill="${WHT}"/>`},
  tsukodome:{jp:"車両通行止め", en:"Closed to vehicles (both directions)", cat:"kisei", svg:ring(WHT)},
  speed40:  {jp:"最高速度 40", en:"Maximum speed 40 km/h", cat:"kisei",
    svg:ring(WHT)+`<text x="50" y="64" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="40" fill="${BLUE}">40</text>`},
  tomare:   {jp:"一時停止（止まれ）", en:"Stop", cat:"kisei",
    svg:`<polygon points="6,10 94,10 50,92" fill="${RED}" stroke="${WHT}" stroke-width="4" stroke-linejoin="round"/><text x="50" y="40" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="18" fill="${WHT}">止まれ</text>`},
  chusha_kinshi:{jp:"駐車禁止", en:"No parking", cat:"kisei",
    svg:ring(BLUE)+`<line x1="24" y1="24" x2="76" y2="76" stroke="${RED}" stroke-width="10"/>`},
  ippo:     {jp:"一方通行", en:"One way", cat:"kisei",
    svg:`<rect x="3" y="27" width="94" height="46" rx="4" fill="${BLUE}" stroke="${WHT}" stroke-width="2"/><polygon points="12,41 66,41 66,33 90,50 66,67 66,59 12,59" fill="${WHT}"/><text x="40" y="55" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11" fill="${BLUE}">一方通行</text>`},
  odan:     {jp:"横断歩道", en:"Pedestrian crossing", cat:"shiji",
    svg:blueSq+`<polygon points="50,14 89,82 11,82" fill="${WHT}"/><circle cx="52" cy="38" r="5" fill="${BLK}"/><path d="M51 44 L48 60 M48 60 L42 71 M48 60 L56 71 M50 48 L41 54 M50 48 L59 53" stroke="${BLK}" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="24" y="74" width="52" height="4" fill="${BLK}"/>`},
  chusha_ka:{jp:"駐車可", en:"Parking allowed", cat:"shiji",
    svg:blueSq+`<text x="50" y="74" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="64" fill="${WHT}">P</text>`},
  teishisen:{jp:"停止線", en:"Stop line", cat:"shiji",
    svg:blueSq+`<text x="50" y="44" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="20" fill="${WHT}">停止線</text><rect x="16" y="58" width="68" height="9" fill="${WHT}"/>`},
  fumikiri: {jp:"踏切あり", en:"Railway crossing ahead", cat:"keikai",
    svg:diamond+`<rect x="28" y="44" width="36" height="16" fill="${BLK}"/><rect x="56" y="34" width="14" height="26" fill="${BLK}"/><rect x="33" y="34" width="6" height="10" fill="${BLK}"/><circle cx="36" cy="63" r="5" fill="${BLK}"/><circle cx="50" cy="63" r="5" fill="${BLK}"/><circle cx="63" cy="63" r="5" fill="${BLK}"/>`},
  koji:     {jp:"道路工事中", en:"Road works", cat:"keikai",
    svg:diamond+`<circle cx="42" cy="32" r="6" fill="${BLK}"/><path d="M42 39 L44 56 L36 70 M44 56 L52 70 M43 44 L58 50" stroke="${BLK}" stroke-width="5" stroke-linecap="round" fill="none"/><line x1="58" y1="50" x2="64" y2="68" stroke="${BLK}" stroke-width="4"/><polygon points="58,72 74,72 66,62" fill="${BLK}"/>`},
  hoko:     {jp:"方面と距離", en:"Destinations and distances", cat:"annai",
    svg:`<rect x="3" y="14" width="94" height="72" rx="6" fill="${BLUE}" stroke="${WHT}" stroke-width="2"/><text x="12" y="42" font-family="sans-serif" font-weight="700" font-size="16" fill="${WHT}">↑ 新宿 3km</text><text x="12" y="70" font-family="sans-serif" font-weight="700" font-size="16" fill="${WHT}">→ 渋谷 5km</text>`},
  kosoku:   {jp:"入口の予告", en:"Expressway entrance ahead", cat:"annai",
    svg:`<rect x="3" y="14" width="94" height="72" rx="6" fill="${GRN}" stroke="${WHT}" stroke-width="2"/><text x="50" y="44" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="17" fill="${WHT}">首都高</text><text x="50" y="70" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="17" fill="${WHT}">入口 1km</text>`}
};
const signSVG = (k,size)=>`<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${SIGNS[k].jp}">${SIGNS[k].svg}</svg>`;
const plateSVG = (text,w=90)=>`<svg viewBox="0 0 ${w} 34" width="${w}" height="34" role="img" aria-label="補助標識 ${text}"><rect x="1" y="1" width="${w-2}" height="32" rx="3" fill="${WHT}" stroke="${BLK}" stroke-width="2"/><text x="${w/2}" y="23" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="17" fill="${BLK}">${text}</text></svg>`;
const leftOkPlate = `<svg viewBox="0 0 60 44" width="60" height="44" role="img" aria-label="白地に青の左向き矢印の標示板"><rect x="1" y="1" width="58" height="42" rx="4" fill="${WHT}" stroke="#888" stroke-width="2"/><polygon points="10,22 26,10 26,17 50,17 50,27 26,27 26,34" fill="${BLUE}"/></svg>`;

/* ---------- signal head (Japanese horizontal: 青 | 黄 | 赤) ---------- */
function signalSVG(state, arrows=[]){
  const on = {g:state==="green", y:state==="yellow"||state==="fy", r:state==="red"||state==="fr"};
  const cls = {y:state==="fy"?"blink":"", r:state==="fr"?"blink":""};
  const lamp=(cx,col,lit,c="")=>`<circle class="${c}" cx="${cx}" cy="20" r="12" fill="${lit?col:"#3a3f44"}"/>`;
  let s=`<svg viewBox="0 0 120 ${arrows.length?70:40}" width="132" height="${arrows.length?77:44}" role="img" aria-label="signal">`+
    `<rect x="2" y="2" width="116" height="36" rx="8" fill="#22272b"/>`+
    lamp(24,"#11b5a4",on.g)+lamp(60,"#f3b700",on.y,cls.y)+lamp(96,"#e3262b",on.r,cls.r);
  if(arrows.length){
    s+=`<rect x="2" y="40" width="116" height="28" rx="6" fill="#22272b"/>`;
    const pos={left:24,straight:60,right:96};
    for(const a of ["left","straight","right"]){
      const lit=arrows.includes(a), cx=pos[a];
      s+=`<circle cx="${cx}" cy="54" r="11" fill="#3a3f44"/>`;
      if(lit){const rot={left:180,straight:-90,right:0}[a];
        s+=`<g transform="translate(${cx} 54) rotate(${rot})"><polygon points="-7,-3 2,-3 2,-7 8,0 2,7 2,3 -7,3" fill="#2be0a0"/></g>`;}
    }
  }
  return s+`</svg>`;
}
const signalWords={green:"青 (green)",yellow:"黄 (yellow)",red:"赤 (red)",fy:"黄の点滅 (flashing yellow)",fr:"赤の点滅 (flashing red)"};

/* ---------- scene drawing ---------- */
const ROAD="#3c4248", LINE="#f2f2ee";
function el(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
function carG(parent,x,y,rot=0){
  const g=el("g",{transform:`translate(${x} ${y}) rotate(${rot})`},parent);
  el("rect",{x:-15,y:-25,width:30,height:50,rx:7,fill:"#f4f7fa",stroke:"#11161a","stroke-width":2},g);
  el("rect",{x:-11,y:-16,width:22,height:11,rx:3,fill:"#5c7a99"},g);
  el("rect",{x:-11,y:12,width:22,height:7,rx:2,fill:"#5c7a99"},g);
  el("rect",{x:-13,y:-24,width:6,height:3,fill:"#ffd76a"},g);el("rect",{x:7,y:-24,width:6,height:3,fill:"#ffd76a"},g);
  return g;
}
function pedestrian(parent,x,y){
  const g=el("g",{transform:`translate(${x} ${y})`},parent);
  el("circle",{cx:0,cy:-12,r:5,fill:"#ff8a3d",stroke:"#11161a","stroke-width":1.5},g);
  el("path",{d:"M0 -7 L0 6 M0 6 L-5 14 M0 6 L5 14 M0 -3 L-6 2 M0 -3 L6 2",stroke:"#ff8a3d","stroke-width":3.5,"stroke-linecap":"round",fill:"none"},g);
  el("path",{d:"M9 -16 L24 -16 M20 -20 L24 -16 L20 -12",stroke:"#ff8a3d","stroke-width":2.5,fill:"none","stroke-linecap":"round"},g);
  return g;
}
/* Intersection geometry (viewBox 360): box x120–240, y60–180. Left-hand traffic.
   Northbound lane x120–180 · westbound lane y120–180 · eastbound lane y60–120. */
const G={box:{x0:120,x1:240,y0:60,y1:180}, cwS:{y0:188,y1:212}, stopY:222, start:{x:150,y:318}};
function drawCrossing(svg,{stopLine=true,cross=true,westCross=false,peds=false}={}){
  svg.innerHTML="";
  el("rect",{x:0,y:0,width:360,height:360,fill:"var(--field)"},svg);
  el("rect",{x:120,y:0,width:120,height:360,fill:ROAD},svg);
  el("rect",{x:0,y:60,width:360,height:120,fill:ROAD},svg);
  // centre lines (white, broken where they meet the box)
  el("line",{x1:180,y1:180,x2:180,y2:360,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},svg);
  el("line",{x1:180,y1:0,x2:180,y2:60,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},svg);
  el("line",{x1:0,y1:120,x2:120,y2:120,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},svg);
  el("line",{x1:240,y1:120,x2:360,y2:120,stroke:LINE,"stroke-width":3,"stroke-dasharray":"16 10"},svg);
  if(cross){for(let i=0;i<8;i++)el("rect",{x:124+i*15,y:G.cwS.y0,width:8,height:24,fill:LINE},svg);}
  if(westCross){for(let i=0;i<8;i++)el("rect",{x:92,y:64+i*15,width:22,height:8,fill:LINE},svg);}
  if(stopLine)el("rect",{x:120,y:G.stopY,width:60,height:5,fill:LINE},svg);
  if(peds)pedestrian(svg,146,203);
  // compass label
  const t=el("text",{x:350,y:350,"text-anchor":"end","font-size":11,fill:"#e8ece9","font-family":"sans-serif"},svg);t.textContent="Japan drives on the left";
}

/* ---------- extra road users and objects (Chapter 2+) ---------- */
function vehicleG(parent,x,y,{rot=0,kind="car",color="#f4f7fa"}={}){
  const g=el("g",{transform:`translate(${x} ${y}) rotate(${rot})`},parent);
  if(kind==="bus"){
    el("rect",{x:-17,y:-42,width:34,height:84,rx:6,fill:"#2f8f5b",stroke:"#11161a","stroke-width":2},g);
    el("rect",{x:-13,y:-38,width:26,height:10,rx:2,fill:"#cfe6ff"},g);
    for(let i=0;i<4;i++)el("rect",{x:-14,y:-22+i*15,width:28,height:5,fill:"#bfe3cc"},g);
  }else if(kind==="truck"){
    el("rect",{x:-17,y:-44,width:34,height:62,rx:3,fill:"#d9dde2",stroke:"#11161a","stroke-width":2},g);
    el("rect",{x:-16,y:20,width:32,height:22,rx:5,fill:"#3d6fb6",stroke:"#11161a","stroke-width":2},g);
  }else{
    el("rect",{x:-15,y:-25,width:30,height:50,rx:7,fill:color,stroke:"#11161a","stroke-width":2},g);
    el("rect",{x:-11,y:-16,width:22,height:11,rx:3,fill:"#5c7a99"},g);
    el("rect",{x:-11,y:12,width:22,height:7,rx:2,fill:"#5c7a99"},g);
  }
  return g;
}
function conesG(parent,x,y,w){
  const g=el("g",{},parent);
  el("rect",{x:x-w/2+4,y:y-34,width:w-8,height:68,rx:3,fill:"rgba(242,194,0,.18)",stroke:"#f2c200","stroke-width":2,"stroke-dasharray":"8 6"},g);
  for(const dy of [-26,0,26]){
    for(const dx of [-w/2+14,w/2-14]){
      el("polygon",{points:`${x+dx},${y+dy-9} ${x+dx-7},${y+dy+8} ${x+dx+7},${y+dy+8}`,fill:"#ff7a1a",stroke:"#11161a","stroke-width":1},g);
      el("rect",{x:x+dx-4,y:y+dy-1,width:8,height:3,fill:"#fff"},g);
    }
  }
  const t=el("text",{x,y:y+5,"text-anchor":"middle","font-size":11,"font-weight":700,fill:"#f2c200","font-family":"sans-serif"},g);t.textContent="工事中";
  return g;
}
