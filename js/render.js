/* Shared helpers, sign artwork, signal heads and road scenes. */
"use strict";
const $ = (s,el=document)=>el.querySelector(s);
const NS="http://www.w3.org/2000/svg";
/* Chapter registry: each levels/chN.js pushes one chapter object. */
const CHAPTERS=[];
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- signs (100x100 viewBox, real-world colours, theme-independent) ---------- */
const RED="#c8102e", BLUE="#1f4fa0", YEL="#f2c200", BLK="#1d1d1d", GRN="#1b7a45", WHT="#ffffff";
/* Sign images are the official designs, taken from Wikimedia Commons (public domain) by CI
   into assets/signs/. kb/signs.json records each file's Commons page and licence. Nothing here is drawn by us. */
const SIGNS = {
  shinnyu:{jp:"進入禁止", en:"No entry (for vehicles, from this side)", cat:"kisei"},
  tsukodome:{jp:"車両通行止め", en:"Closed to vehicles (both directions)", cat:"kisei"},
  speed40:{jp:"最高速度 40", en:"Maximum speed 40 km/h", cat:"kisei"},
  tomare:{jp:"一時停止（止まれ）", en:"Stop", cat:"kisei"},
  chusha_kinshi:{jp:"駐車禁止", en:"No parking", cat:"kisei"},
  ippo:{jp:"一方通行", en:"One way", cat:"kisei"},
  odan:{jp:"横断歩道", en:"Pedestrian crossing", cat:"shiji"},
  chusha_ka:{jp:"駐車可", en:"Parking allowed", cat:"shiji"},
  teishisen:{jp:"停止線", en:"Stop line", cat:"shiji"},
  fumikiri:{jp:"踏切あり", en:"Railway crossing ahead", cat:"keikai"},
  koji:{jp:"道路工事中", en:"Road works", cat:"keikai"},
  hoko:{jp:"方面と距離", en:"Destinations and distances", cat:"annai"},
  kosoku:{jp:"入口の予告", en:"Expressway entrance ahead", cat:"annai"},
  shitei_s:{jp:"指定方向外進行禁止（直進のみ）", en:"Straight ahead only", cat:"kisei"},
  shitei_l:{jp:"指定方向外進行禁止（左折のみ）", en:"Left turn only", cat:"kisei"},
  shitei_sl:{jp:"指定方向外進行禁止（直進・左折）", en:"Straight ahead or left only", cat:"kisei"},
  tenkai:{jp:"転回禁止", en:"No U-turn", cat:"kisei"},
  chuteisha_kinshi:{jp:"駐停車禁止", en:"No stopping or parking", cat:"kisei"},
  hokosha:{jp:"歩行者専用", en:"Pedestrians only", cat:"kisei"},
  jitensha_hokosha:{jp:"自転車及び歩行者専用", en:"Bicycles and pedestrians only", cat:"kisei"},
  ogata:{jp:"大型貨物自動車等通行止め", en:"No large freight vehicles", cat:"kisei"},
  jokou:{jp:"徐行", en:"Slow down (go slowly)", cat:"kisei"},
  keiteki:{jp:"警笛鳴らせ", en:"Sound your horn", cat:"kisei"},
  shingo:{jp:"信号機あり", en:"Traffic signal ahead", cat:"keikai"},
};
for (const k in SIGNS) SIGNS[k].src = `assets/signs/${k}.svg`;
const signSVG = (k,size)=>`<img class="signimg" src="${SIGNS[k].src}" width="${size}" height="${size}" alt="${SIGNS[k].jp}" draggable="false">`;
/* the same image inside an SVG scene */
function signImage(parent,k,x,y,size){return el("image",{href:SIGNS[k].src,x,y,width:size,height:size,preserveAspectRatio:"xMidYMid meet"},parent);}
const plateSVG = (text,w=90)=>`<svg viewBox="0 0 ${w} 34" width="${w}" height="34" role="img" aria-label="補助標識 ${text}"><rect x="1" y="1" width="${w-2}" height="32" rx="3" fill="${WHT}" stroke="${BLK}" stroke-width="2"/><text x="${w/2}" y="23" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="17" fill="${BLK}">${text}</text></svg>`;

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
