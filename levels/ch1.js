/* Chapter 1 — 教則 第1章 第2節「信号、標識・標示に従うこと」.
   Each scenario carries the clause it is drawn from in `ref`. */
"use strict";
/* ---------- level definitions ---------- */
const CAT={kisei:["規制標識","Regulatory"],shiji:["指示標識","Instruction"],keikai:["警戒標識","Warning"],annai:["案内標識","Guide"]};
const CAT_WHY={
  kisei:"Regulatory signs ban or require a specific way of driving, such as closing a road to vehicles or setting a maximum speed.",
  shiji:"Instruction signs show what you may do or where something is, such as where parking is allowed or where a crosswalk is.",
  keikai:"Warning signs tell you in advance about a hazard or something to watch for, such as a railway crossing or road works.",
  annai:"Guide signs show place names, directions and distances."
};
const CAT_SRC={kisei:"2(2)",shiji:"2(3)",keikai:"2(4)",annai:"2(5)"};

CHAPTERS.push({
 id:"ch1", n:1, jp:"信号、標識・標示に従うこと", en:"Follow signals, signs and markings", short:"Signals & signs",
 src:"教則 第1章 第2節", saveKey:"hyoshiki-dojo-ch1-v1",
 sources:[
  '<a href="https://www.npa.go.jp/bureau/traffic/20241113kyousoku.pdf" target="_blank" rel="noopener">交通の方法に関する教則</a> (National Police Agency, consolidated to the 4 Sep 2024 amendment), 第1章 第2節',
  'Signal meanings: 道路交通法施行令 第2条 (paraphrased, not quoted)',
  'Sign and marking meanings (1.5–1.7): 道路交通法 and the sign standard, as taught in driving-school material; flagged items say so'
 ],
 levels:[
 {id:"sort", n:"1.1", title:"Four kinds of main sign", short:"Kinds",
  items:["shinnyu","odan","fumikiri","hoko","speed40","chusha_ka","koji","tomare","teishisen","kosoku","chusha_kinshi","ippo","jokou","keiteki","hokosha","chuteisha_kinshi","shitei_s","shingo"]},
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
   {goal:"right",sig:"green",ok:["right"],why:"Steady green lets cars go straight, turn left or turn right. When turning right you still give way to oncoming traffic going straight or turning left.",ref:"施行令 第2条; 道路交通法 第37条"},
   {goal:"straight",sig:"red",cross:"red",ok:["stop"],why:"The cross street's signal is red too. A red light to the side doesn't mean yours is green: all directions can be red at once. Read the signal facing you.",ref:"1(2)"},
   {goal:"straight",sig:"yellow",ok:["stop"],why:"A steady yellow means do not pass the stop position. The only exception is when you are already so close that you cannot stop safely. You are well back from the line, so you stop.",ref:"施行令 第2条"}
  ]},
 {id:"stoppos", n:"1.4", title:"Where to stop", short:"Stop line",
  items:[
   {stopLine:true,cross:true,frontMin:G.stopY+5,why:"With a stop line marked, the stop position is just before the stop line.",ref:"3(2), 施行令 第2条"},
   {stopLine:false,cross:true,frontMin:G.cwS.y1,why:"With no stop line, the stop position is just before the crosswalk.",ref:"施行令 第2条"},
   {stopLine:false,cross:false,frontMin:G.box.y1,why:"With no stop line and no crosswalk, the stop position is just before the intersection.",ref:"施行令 第2条"}
  ]},
 {id:"bans", kind:"bans", n:"1.5", title:"What does it ban?", short:"Bans",
  items:[
   {sign:"shinnyu",at:"ahead",moves:["straight","left","right"],banned:["straight"],why:"車両進入禁止: vehicles may not enter the road from the side where the sign stands. Turning into the cross street is fine.",ref:"2(2)"},
   {sign:"tsukodome",at:"ahead",moves:["straight","left","right"],banned:["straight"],why:"車両通行止め closes the road ahead to all vehicles, in both directions.",ref:"2(2)"},
   {sign:"ogata",at:"ahead",moves:["straight","left","right"],banned:[],car:"普通乗用車",why:"This sign closes the road to large freight vehicles. You are in an ordinary passenger car, so nothing here is banned for you. Confirm with nothing selected.",ref:"2(2)"},
   {sign:"hokosha",at:"ahead",moves:["straight","left","right"],banned:["straight"],why:"歩行者専用: the road ahead is for pedestrians. Cars may not drive in it unless they hold a police permit.",ref:"道路交通法 第8条, 第9条"},
   {sign:"jitensha_hokosha",at:"ahead",moves:["straight","left","right"],banned:["straight"],why:"自転車及び歩行者専用: only bicycles and pedestrians may use the road ahead. Cars may not.",ref:"2(2)"},
   {sign:"shitei_s",at:"approach",moves:["straight","left","right"],banned:["left","right"],why:"指定方向外進行禁止: you may only go in the direction of the arrow. Straight on only, so no left or right turn.",ref:"2(2)"},
   {sign:"shitei_l",at:"approach",moves:["straight","left","right"],banned:["straight","right"],why:"The only arrow points left, so turning left is the only move allowed.",ref:"2(2)"},
   {sign:"shitei_sl",at:"approach",moves:["straight","left","right"],banned:["right"],why:"Straight on and left are allowed. Turning right is not.",ref:"2(2)"},
   {sign:"tenkai",at:"approach",moves:["straight","left","right","uturn"],banned:["uturn"],why:"転回禁止 bans U-turns. Ordinary turns are not affected.",ref:"2(2)"},
   {sign:"ippo",at:"cross",moves:["left","right"],banned:["right"],why:"The one-way arrow on the cross street points left. Turning right would put you against the flow.",ref:"2(2)"},
   {sign:"chusha_kinshi",at:"approach",moves:["park","stop","straight"],banned:["park"],why:"駐車禁止 bans parking. A brief stop, such as dropping someone off or loading for up to 5 minutes, is still allowed.",ref:"2(2); 道路交通法 第2条 (駐車・停車)"},
   {sign:"chuteisha_kinshi",at:"approach",moves:["park","stop","straight"],banned:["park","stop"],why:"駐停車禁止 bans both parking and stopping, however briefly.",ref:"2(2)"},
   {sign:null,edge:"yellow",moves:["park","stop","straight"],banned:["park","stop"],why:"A solid yellow line along the road edge is a 規制標示 meaning no stopping or parking (駐停車禁止).",ref:"3(1)–(2)"},
   {sign:null,edge:"yellowdash",moves:["park","stop","straight"],banned:["park"],why:"A broken yellow line along the road edge means no parking (駐車禁止). Brief stops are allowed.",ref:"3(1)–(2)"},
   {sign:null,laneArrows:"straightleft",moves:["straight","left","right"],banned:["right"],why:"Arrows painted in your lane (進行方向別通行区分) say where traffic in that lane may go. Straight and left only, so no right turn from this lane.",ref:"3(1)–(2)"}
  ]},
 {id:"approach", kind:"approach", n:"1.6", title:"How to approach", short:"Approach",
  items:[
   {sign:"tomare",stopLine:true,cross:true,min:0,max:0,horn:false,why:"一時停止: stop just before the stop line every time, even if no one is coming, then go on.",ref:"2(2); 道路交通法 第43条"},
   {sign:"jokou",min:5,max:10,horn:false,why:"徐行 means a speed at which you can stop at once (道路交通法 第2条). Driving schools teach this as roughly 10 km/h or less. You don't have to stop.",ref:"道路交通法 第2条"},
   {sign:"speed40",min:5,max:40,horn:false,why:"最高速度 sets a maximum. Anything up to 40 km/h is legal here; you don't have to drive at 40.",ref:"2(2)"},
   {sign:"keiteki",curve:true,min:5,max:40,horn:true,limit:40,why:"警笛鳴らせ: you must sound your horn here, typically before a blind bend.",ref:"2(2); 道路交通法 第54条"},
   {sign:"odan",crosswalk:true,peds:true,min:0,max:0,horn:false,why:"A pedestrian is waiting to cross. Stop just before the crosswalk and let them cross. Don't use the horn to hurry them.",ref:"道路交通法 第38条, 第54条"},
   {sign:"speed40",peds:false,min:5,max:40,horn:false,why:"There is nothing to warn anyone about, so the horn must stay silent. Use it only where a sign requires it or to avoid danger.",ref:"道路交通法 第54条"}
  ]},
 {id:"tf", kind:"tf", n:"1.7", title:"〇× check", short:"〇×",
  items:[
   {q:"「進入禁止」の標識は、歩行者の通行も禁止している。",en:"The 'No entry' sign also bans pedestrians.",a:false,why:"It applies to vehicles. Pedestrians may still walk in.",ref:"2(2)"},
   {q:"横の信号が赤なら、前方の信号は必ず青である。",en:"If the side signal is red, the one facing you must be green.",a:false,why:"All directions can be red at once, and some signals change at different times (時差式). Read the signal facing you.",ref:"1(2)"},
   {q:"黄色の灯火の信号では、停止位置で安全に停止できない場合を除き、停止位置から先へ進んではならない。",en:"On steady yellow you may not pass the stop position unless you cannot stop there safely.",a:true,why:"That is the rule. Yellow is not 'go carefully'.",ref:"施行令 第2条"},
   {q:"赤色の灯火の点滅では、車は停止位置で一時停止しなければならない。",en:"On flashing red, vehicles must stop at the stop position.",a:true,why:"Stop, check, then go on.",ref:"施行令 第2条"},
   {q:"黄色の灯火の点滅では、車は必ず一時停止しなければならない。",en:"On flashing yellow, vehicles must always stop.",a:false,why:"Flashing yellow means proceed while watching other traffic. Stopping is not required.",ref:"施行令 第2条"},
   {q:"補助標識は本標識の意味を補足するもので、通常は本標識の下に付けられる。",en:"Supplementary plates add to a main sign and usually sit below it.",a:true,why:"They show the reason, times, days or vehicle types the main sign applies to.",ref:"2(6)"},
   {q:"警戒標識は、特定の交通方法を禁止したり指定したりする標識である。",en:"Warning signs ban or require specific ways of driving.",a:false,why:"That describes regulatory signs (規制標識). Warning signs give advance notice of hazards.",ref:"2(2), 2(4)"},
   {q:"標示には、規制標示と指示標示の2種類がある。",en:"Road markings come in two kinds: regulatory and instruction.",a:true,why:"規制標示 ban or require; 指示標示 show what you may do or where things are.",ref:"3(1)"},
   {q:"ひし形（◇）の標示は、前方に横断歩道又は自転車横断帯があることを示している。",en:"A diamond (◇) marking means a crosswalk or bicycle crossing ahead.",a:true,why:"It is an instruction marking. Be ready to stop for anyone crossing.",ref:"3(2), 付表3"},
   {q:"「駐車禁止」の場所でも、5分以内の荷物の積卸しのための停止はできる。",en:"Where parking is banned, you may still stop to load or unload for up to 5 minutes.",a:true,why:"Loading for up to 5 minutes counts as stopping (停車), not parking (駐車).",ref:"道路交通法 第2条"},
   {q:"「駐停車禁止」の場所でも、人の乗り降りのための短い停止はできる。",en:"Where stopping and parking are banned, you may still stop briefly to let someone in or out.",a:false,why:"駐停車禁止 bans stopping as well as parking, including brief stops for passengers.",ref:"2(2)"},
   {q:"白地に青の左向きの矢印の標示板があるときは、前方の信号が赤でも、周りの交通に注意して左折できる。",en:"With a white board showing a blue left arrow, you may turn left on red, watching other traffic.",a:true,why:"But you must not obstruct pedestrians or cyclists crossing on their green.",ref:"1(4)"},
   {q:"青の矢印の信号で右折できるのは自動車などで、自転車はその矢印に従って進むことはできない。",en:"A green right arrow lets cars turn right, but not bicycles.",a:true,why:"The 教則 says bicycles and similar may not proceed on the green right arrow.",ref:"教則 第3章 第3節"},
   {q:"停止禁止部分の標示がある場所では、前方が混雑してその中で止まるおそれがあるときは、その中に入ってはならない。",en:"Don't enter a 'no stopping zone' marking if traffic ahead might leave you stopped inside it.",a:true,why:"Wait before the zone until there is room to clear it.",ref:"道路交通法 第50条"},
   {q:"歩行者用の信号の青の点滅は、黄信号と同じ意味である。",en:"A flashing green pedestrian signal means the same as yellow.",a:true,why:"Don't start crossing; finish crossing quickly if already on it.",ref:"教則 第2章 第3節"},
   {q:"「警笛鳴らせ」の標識がある場所では、警笛を鳴らさなければならない。",en:"Where the 'Sound horn' sign stands, you must sound your horn.",a:true,why:"It is one of the few places the horn is required.",ref:"道路交通法 第54条"},
   {q:"最高速度40キロメートル毎時の標識がある道路では、40キロメートル毎時で走らなければならない。",en:"On a road signed 40 km/h maximum, you must drive at 40 km/h.",a:false,why:"It is a maximum. Lower speeds are legal.",ref:"2(2)"},
   {q:"一時停止の標識がある交差点で、交差する道路に車がいなければ、止まらずに通過してよい。",en:"At a stop sign, you may roll through if no cross traffic is coming.",a:false,why:"You must stop every time, even with no one coming.",ref:"道路交通法 第43条"}
  ]}
]
});
