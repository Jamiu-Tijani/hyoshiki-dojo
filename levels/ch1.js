/* Chapter 1 — 教則 第1章 第2節「信号、標識・標示に従うこと」.
   Each scenario carries the clause it is drawn from in `ref`. */
"use strict";
/* ---------- level definitions ---------- */
const SRC="教則 第1章 第2節";
const CAT={kisei:["規制標識","Regulatory"],shiji:["指示標識","Instruction"],keikai:["警戒標識","Warning"],annai:["案内標識","Guide"]};
const CAT_WHY={
  kisei:"Regulatory signs ban or require a specific way of driving, such as closing a road to vehicles or setting a maximum speed.",
  shiji:"Instruction signs show what you may do or where something is, such as where parking is allowed or where a crosswalk is.",
  keikai:"Warning signs tell you in advance about a hazard or something to watch for, such as a railway crossing or road works.",
  annai:"Guide signs show place names, directions and distances."
};
const CAT_SRC={kisei:"2(2)",shiji:"2(3)",keikai:"2(4)",annai:"2(5)"};

const LEVELS=[
 {id:"sort", n:"1.1", title:"Four kinds of main sign", short:"Kinds",
  items:["shinnyu","odan","fumikiri","hoko","speed40","chusha_ka","koji","tomare","teishisen","kosoku","chusha_kinshi","ippo"]},
 {id:"plate", n:"1.2", title:"Supplementary plates", short:"Plates",
  items:[
   {sign:"shinnyu",plate:"7-9",day:"Tue",time:"08:15",ok:"east",why:"The plate limits the ban to 7:00–9:00. At 8:15 the ban applies, so you may not enter.",ref:"2(6)"},
   {sign:"shinnyu",plate:"7-9",day:"Tue",time:"10:30",ok:"north",why:"The plate limits the ban to 7:00–9:00. At 10:30 the ban is not in force, so you may enter.",ref:"2(6)"},
   {sign:"shinnyu",plate:"日・休日",day:"Sun",time:"11:00",ok:"east",why:"日・休日 means the ban applies on Sundays and public holidays. Today is Sunday, so you may not enter.",ref:"2(6)"},
   {sign:"shinnyu",plate:"日・休日",day:"Sat",time:"11:00",ok:"north",why:"日・休日 covers Sundays and public holidays only. Saturday is not included, so you may enter.",ref:"2(6)"},
   {sign:"tsukodome",plate:"大貨",day:"Wed",time:"14:00",car:"普通乗用車",ok:"north",why:"大貨 is the abbreviation for large freight vehicles. The closure applies only to them. Your ordinary passenger car may go through.",ref:"2(6), 付表4"},
   {sign:"tsukodome",plate:null,day:"Wed",time:"14:00",ok:"east",why:"With no plate, 車両通行止め closes the road to all vehicles in both directions.",ref:"2(2)"}
  ]},
 {id:"signal", n:"1.3", title:"Reading the signal", short:"Signals",
  items:[
   {goal:"left",sig:"red",plate:true,ok:["left"],why:"A white board with a blue left arrow means vehicles may turn left even on red or yellow, watching other traffic.",ref:"1(4)"},
   {goal:"left",sig:"red",plate:true,peds:true,ok:["stop"],why:"The left-turn board lets you turn on red, but you must not obstruct pedestrians crossing on their green. Cross traffic has green, so the pedestrian on the crosswalk in front of you is crossing legally. You wait at the stop line.",ref:"1(4)"},
   {goal:"right",sig:"red",arrows:["right"],ok:["right"],why:"A green right arrow lets cars proceed to the right even while the main light is red.",ref:"施行令 第2条; 教則 第3章 第3節"},
   {goal:"straight",sig:"red",arrows:["right"],ok:["stop"],why:"The green arrow only allows movement in the arrow's direction. Straight ahead is still red, so you stop at the stop line.",ref:"施行令 第2条"},
   {goal:"straight",sig:"fr",ok:["stopgo"],why:"Flashing red means vehicles must stop at the stop position, then may go on. Hold your finger at the stop line for a moment, then continue.",ref:"施行令 第2条"},
   {goal:"straight",sig:"fy",ok:["straight","stopgo"],why:"Flashing yellow means you may proceed while watching other traffic. Stopping is not required.",ref:"施行令 第2条"},
   {goal:"straight",sig:"yellow",ok:["stop"],why:"A steady yellow means do not pass the stop position. The only exception is when you are already so close that you cannot stop safely. You are well back from the line, so you stop.",ref:"施行令 第2条"}
  ]},
 {id:"stoppos", n:"1.4", title:"Where to stop", short:"Stop line",
  items:[
   {stopLine:true,cross:true,frontMin:G.stopY+5,why:"With a stop line marked, the stop position is just before the stop line.",ref:"3(2), 施行令 第2条"},
   {stopLine:false,cross:true,frontMin:G.cwS.y1,why:"With no stop line, the stop position is just before the crosswalk.",ref:"施行令 第2条"},
   {stopLine:false,cross:false,frontMin:G.box.y1,why:"With no stop line and no crosswalk, the stop position is just before the intersection.",ref:"施行令 第2条"}
  ]}
];
