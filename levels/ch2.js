/* Chapter 2 — 教則 第5章 第2節「自動車の通行するところ」.
   The consolidated 教則 PDF could not be read past 第4章, so these rules are taken from the
   Road Traffic Act articles that section restates, as cited by driving-school study material.
   Each scenario carries its article in `ref`.

   Lane scenarios (kind "lanes"):
     lanes  left→right, dir "up" = your direction, "down" = oncoming; paint = text on the lane
     lines  marking between lane i and i+1: "dash" (white broken) | "yellow" (yellow solid)
     start  lane the car starts in;  ok = lanes that are correct
     objs   things on the road: {lane, y, type: car | truck | bus | cones | oncoming}
*/
"use strict";
CHAPTERS.push({
 id:"ch2", n:2, jp:"自動車の通行するところ", en:"Where cars may drive", short:"Where to drive",
 src:"教則 第5章 第2節", saveKey:"hyoshiki-dojo-ch2-v1",
 sources:[
  '<a href="https://www.npa.go.jp/bureau/traffic/20241113kyousoku.pdf" target="_blank" rel="noopener">交通の方法に関する教則</a>, 第5章 第2節 (section heading; body not readable in the published PDF)',
  'Rules from 道路交通法 第17条, 第18条, 第20条, 第20条の2, 第26条の2, as summarised by <a href="https://www.kobe-drivers-support.com/doc/department-passable-inpassable.pdf" target="_blank" rel="noopener">Kobe Drivers Support</a> and <a href="https://www.iac-ds.co.jp/oyakudachi01004/" target="_blank" rel="noopener">IAC driving school</a>',
  'Bus lanes: <a href="https://www.keishicho.metro.tokyo.lg.jp/kotsu/mark/hyoshiki.html" target="_blank" rel="noopener">Tokyo Metropolitan Police</a> and Akita Prefectural Police guidance'
 ],
 levels:[
 {id:"keepleft", kind:"lanes", n:"2.1", title:"Keep left of centre", short:"Keep left",
  task:"Drag the car into the half of the road you should use.",
  items:[
   {lanes:[{dir:"up"},{dir:"down"}],lines:["dash"],start:0,objs:[{lane:1,y:70,type:"oncoming"}],
    hud:[["Situation","Ordinary two-way road"],["Centre line","White, broken"]],
    ok:[0],why:"Cars drive to the left of the centre of the road, or of the centre line where one is marked.",ref:"道路交通法 第17条4項"},
   {lanes:[{dir:"up"},{dir:"down"}],lines:["dash"],start:0,objs:[{lane:0,y:150,type:"cones"}],
    hud:[["Situation","Road works block your half"],["Oncoming","None in sight"]],
    ok:[1],why:"When road works leave the left half too narrow to pass, you may move into the right half. Cross over only as far as you need to.",ref:"道路交通法 第17条5項"},
   {lanes:[{dir:"up"},{dir:"down"}],lines:["dash"],start:0,objs:[{lane:0,y:140,type:"truck"}],
    hud:[["You want to","Overtake the slow truck"],["Your half","6 m wide or more"]],
    ok:[0],why:"Crossing the centre line to overtake is allowed only when your half of the road is under 6 m wide. Here it is 6 m or more, so overtake within your own half, or wait.",ref:"道路交通法 第17条5項"},
   {lanes:[{dir:"up"},{dir:"down"}],lines:["dash"],start:0,objs:[{lane:0,y:140,type:"truck"}],
    hud:[["You want to","Overtake the slow truck"],["Your half","Under 6 m"],["View ahead","Clear, no oncoming traffic"]],
    ok:[1],why:"Your half is under 6 m, you can see well ahead and you won't obstruct oncoming traffic, so you may cross into the right half to overtake.",ref:"道路交通法 第17条5項"},
   {lanes:[{dir:"up"},{dir:"down"}],lines:["yellow"],start:0,objs:[{lane:0,y:140,type:"truck"}],
    hud:[["You want to","Overtake the slow truck"],["Your half","Under 6 m"],["Centre line","Yellow, solid"]],
    ok:[0],why:"A yellow centre line bans crossing into the right half to overtake. Stay behind the truck.",ref:"道路交通法 第17条5項 (はみ出し禁止 marking)"},
   {lanes:[{dir:"up"},{dir:"down"}],lines:["yellow"],start:0,objs:[{lane:0,y:150,type:"cones"}],
    hud:[["Situation","Road works block your half"],["Centre line","Yellow, solid"],["Oncoming","None in sight"]],
    ok:[1],why:"The yellow centre line bans crossing over to overtake. Going round an obstruction that leaves your half too narrow is a different case, and you may cross as little as needed. Check this one against your textbook.",ref:"道路交通法 第17条5項"},
   {lanes:[{dir:"up"},{dir:"up"}],lines:["dash"],start:0,sign:"ippo",objs:[],
    hud:[["Situation","One-way street"]],
    ok:[0,1],why:"On a one-way street there is no oncoming traffic, so using the right side is allowed.",ref:"道路交通法 第17条5項"}
  ]},
 {id:"lanechoice", kind:"lanes", n:"2.2", title:"Choosing a lane", short:"Lanes",
  task:"Drag the car into the lane you should drive in.",
  items:[
   {lanes:[{dir:"up"},{dir:"up"}],lines:["dash"],start:0,objs:[],
    hud:[["Road","2 lanes your way"],["You are","Cruising, no one ahead"]],
    ok:[0],why:"With two lanes in your direction, keep the right lane free for overtaking and drive in the left lane.",ref:"道路交通法 第20条1項"},
   {lanes:[{dir:"up"},{dir:"up"}],lines:["dash"],start:0,objs:[{lane:0,y:140,type:"truck"}],
    hud:[["Road","2 lanes your way"],["You want to","Overtake the slow truck"]],
    ok:[1],why:"To overtake, use the lane immediately to the right of the one you are in.",ref:"道路交通法 第20条"},
   {lanes:[{dir:"up"},{dir:"up"},{dir:"up"}],lines:["dash","dash"],start:0,objs:[],
    hud:[["Road","3 lanes your way"],["You are","Cruising"]],
    ok:[0,1],why:"With three or more lanes, keep the rightmost lane free. Slower vehicles keep left and faster ones move right, so either of the other lanes is fine.",ref:"道路交通法 第20条1項"},
   {lanes:[{dir:"up"},{dir:"up"},{dir:"up"}],lines:["dash","dash"],start:0,objs:[{lane:0,y:140,type:"truck"}],
    hud:[["Road","3 lanes your way"],["You want to","Overtake the slow truck"]],
    ok:[1],why:"Overtake in the lane immediately to your right, not two lanes over.",ref:"道路交通法 第20条"},
   {lanes:[{dir:"up"},{dir:"up"},{dir:"up"}],lines:["dash","dash"],start:1,objs:[{lane:1,y:140,type:"car",color:"#e8c86a"}],
    hud:[["Road","3 lanes your way"],["You want to","Overtake the slow car"]],
    ok:[2],why:"You are in the middle lane, so the lane immediately to your right is the rightmost lane. You may use it to overtake.",ref:"道路交通法 第20条"},
   {lanes:[{dir:"up"},{dir:"up"}],lines:["yellow"],start:0,objs:[{lane:0,y:140,type:"truck"}],
    hud:[["Road","2 lanes your way"],["Lane line","Yellow, solid"],["You want to","Overtake the slow truck"]],
    ok:[0],why:"A yellow line between lanes means lane changes are banned. Stay in your lane. Check this one against your textbook.",ref:"道路交通法 第26条の2 3項"}
  ]},
 {id:"buslane", kind:"lanes", n:"2.3", title:"Bus lanes", short:"Bus lanes",
  task:"Drag the car into the lane you may use right now.",
  items:[
   {lanes:[{dir:"up",paint:"バス専用"},{dir:"up"}],lines:["dash"],start:1,objs:[],
    hud:[["Now","Tue 08:00"],["Lane rule","専用 (exclusive) 7–9"],["You are","Going straight on"]],
    ok:[1],why:"An exclusive bus lane is closed to other vehicles while it is in force. At 8:00 the 7–9 rule applies, so keep out.",ref:"道路交通法 第20条"},
   {lanes:[{dir:"up",paint:"バス専用"},{dir:"up"}],lines:["dash"],start:1,objs:[],
    hud:[["Now","Tue 10:00"],["Lane rule","専用 (exclusive) 7–9"],["You are","Going straight on"]],
    ok:[0],why:"At 10:00 the 7–9 restriction is not in force, so normal lane rules apply. With two lanes, drive in the left lane.",ref:"道路交通法 第20条1項"},
   {lanes:[{dir:"up",paint:"バス専用"},{dir:"up"}],lines:["dash"],start:1,objs:[],
    hud:[["Now","Tue 08:00"],["Lane rule","専用 (exclusive) 7–9"],["You are","Turning left at the next junction"]],
    ok:[0],why:"You may enter an exclusive bus lane to turn left at the junction ahead. You need to be on the left to turn left.",ref:"道路交通法 第20条"},
   {lanes:[{dir:"up",paint:"バス優先"},{dir:"up"}],lines:["dash"],start:1,objs:[],
    hud:[["Now","Tue 08:00"],["Lane rule","優先 (priority) 7–9"],["Traffic","Light, no bus nearby"]],
    ok:[0,1],why:"Other vehicles may drive in a bus priority lane. They must give way to route buses.",ref:"道路交通法 第20条の2"},
   {lanes:[{dir:"up",paint:"バス優先"},{dir:"up"}],lines:["dash"],start:0,objs:[{lane:0,y:330,type:"bus"}],
    hud:[["Now","Tue 08:00"],["Lane rule","優先 (priority) 7–9"],["Behind you","A route bus is approaching"]],
    ok:[1],why:"When a route bus comes up behind you in a priority lane, move promptly out of the lane so it can run normally.",ref:"道路交通法 第20条の2"},
   {lanes:[{dir:"up",paint:"バス優先"},{dir:"up"}],lines:["dash"],start:1,objs:[{lane:1,y:150,type:"car",color:"#c7d0d8"},{lane:1,y:80,type:"car",color:"#c7d0d8"}],
    hud:[["Now","Tue 08:00"],["Lane rule","優先 (priority) 7–9"],["Traffic","Heavy, right lane queued"]],
    ok:[1],why:"Don't enter a priority lane when traffic is so heavy that you couldn't get out of the bus's way.",ref:"道路交通法 第20条の2"}
  ]},
 {id:"sidewalk", kind:"kerb", n:"2.4", title:"Crossing the pavement", short:"Pavement",
  items:[
   {dir:"in",peds:false,why:"To reach a car park or other roadside place you may cross the pavement, but stop just before it every time, even with no one on it.",ref:"道路交通法 第17条2項"},
   {dir:"in",peds:true,why:"Stop just before the pavement and don't get in the pedestrian's way.",ref:"道路交通法 第17条2項"},
   {dir:"out",peds:false,why:"Leaving a car park works the same way. Stop just before the pavement, then check before you cross it.",ref:"道路交通法 第17条2項"}
  ]}
 ]
});
