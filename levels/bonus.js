/* Bonus chapter — 標識の漢字 (road-sign kanji).
   Vocabulary is the wording used on Japanese road signs and supplementary plates.
   Kinds: "match" (drag the prompt to one of four answers; `field` picks which answer)
          "build" (tap tiles in order to write the word; `decoys` are lookalikes). */
"use strict";
(function(){
  /* [kanji, reading, meaning, example word] */
  const K=[
    ["止","と(まる)・し","stop","止まれ"],
    ["禁","きん","forbid","禁止"],
    ["車","しゃ・くるま","vehicle, car","駐車"],
    ["駐","ちゅう","stay (park)","駐車"],
    ["停","てい","halt, stop briefly","停車"],
    ["通","つう・とお(る)","pass through","通行"],
    ["行","こう・い(く)","go","一方通行"],
    ["進","しん","advance","進入"],
    ["入","にゅう・い(る)","enter","進入禁止"],
    ["速","そく","speed, fast","速度"],
    ["歩","ほ・ある(く)","walk","歩道"],
    ["道","どう・みち","road","道路"],
    ["線","せん","line","停止線"],
    ["優","ゆう","priority, superior","優先"],
    ["専","せん","exclusive","専用"],
    ["徐","じょ","slowly","徐行"],
    ["除","じょ・のぞ(く)","remove, except","除く"],
    ["転","てん","turn over, roll","転回"],
    ["追","つい・お(う)","chase","追越し"],
    ["横","おう・よこ","sideways, across","横断"],
    ["注","ちゅう","attention, pour","注意"]
  ];
  /* [word, reading, meaning] */
  const W=[
    ["止まれ","とまれ","Stop"],
    ["徐行","じょこう","Go slowly"],
    ["一時停止","いちじていし","Stop, then go on"],
    ["進入禁止","しんにゅうきんし","No entry"],
    ["車両通行止め","しゃりょうつうこうどめ","Closed to vehicles"],
    ["駐車禁止","ちゅうしゃきんし","No parking"],
    ["駐停車禁止","ちゅうていしゃきんし","No stopping or parking"],
    ["駐車可","ちゅうしゃか","Parking allowed"],
    ["一方通行","いっぽうつうこう","One way"],
    ["転回禁止","てんかいきんし","No U-turn"],
    ["追越し禁止","おいこしきんし","No overtaking"],
    ["最高速度","さいこうそくど","Maximum speed"],
    ["最低速度","さいていそくど","Minimum speed"],
    ["警笛鳴らせ","けいてきならせ","Sound your horn"],
    ["歩行者専用","ほこうしゃせんよう","Pedestrians only"],
    ["横断歩道","おうだんほどう","Pedestrian crossing"],
    ["停止線","ていしせん","Stop line"],
    ["優先道路","ゆうせんどうろ","Priority road"],
    ["踏切","ふみきり","Railway crossing"],
    ["工事中","こうじちゅう","Road works"],
    ["幅員減少","ふくいんげんしょう","Road narrows"],
    ["安全地帯","あんぜんちたい","Safety zone"]
  ];
  const R=["徐行","一時停止","進入禁止","駐停車禁止","一方通行","転回禁止","追越し禁止","最高速度","警笛鳴らせ","歩行者専用","横断歩道","優先道路","踏切","幅員減少","安全地帯","車両通行止め"]
    .map(w=>W.find(x=>x[0]===w));
  /* [plate text, meaning, reading] */
  const P=[
    ["日・休日を除く","Except Sundays and public holidays","にち・きゅうじつをのぞく"],
    ["8-20","From 8:00 to 20:00",""],
    ["ここから","The rule starts here",""],
    ["ここまで","The rule ends here",""],
    ["区域内","Applies throughout this zone","くいきない"],
    ["二輪を除く","Except two-wheelers","にりんをのぞく"],
    ["大型等","Large vehicles and similar","おおがたとう"],
    ["前方優先道路","Priority road ahead","ぜんぽうゆうせんどうろ"],
    ["通学路","School route","つうがくろ"],
    ["自転車を除く","Except bicycles","じてんしゃをのぞく"]
  ];
  /* [word, tiles in order, decoys, meaning, reading] */
  const B=[
    ["徐行",["徐","行"],["除","街"],"Go slowly","じょこう"],
    ["止まれ",["止","まれ"],["上","るな"],"Stop","とまれ"],
    ["駐車禁止",["駐","車","禁","止"],["注","林"],"No parking","ちゅうしゃきんし"],
    ["駐停車禁止",["駐","停","車","禁","止"],["亭","注"],"No stopping or parking","ちゅうていしゃきんし"],
    ["進入禁止",["進","入","禁","止"],["人","近"],"No entry","しんにゅうきんし"],
    ["一方通行",["一","方","通","行"],["万","道"],"One way","いっぽうつうこう"],
    ["最高速度",["最","高","速","度"],["連","席"],"Maximum speed","さいこうそくど"],
    ["歩行者専用",["歩","行","者","専","用"],["博","走"],"Pedestrians only","ほこうしゃせんよう"],
    ["横断歩道",["横","断","歩","道"],["構","通"],"Pedestrian crossing","おうだんほどう"],
    ["優先道路",["優","先","道","路"],["憂","洗"],"Priority road","ゆうせんどうろ"]
  ];
  CHAPTERS.push({
    id:"bonus", n:"B", tag:"Bonus", jp:"標識の漢字", en:"Road-sign kanji", short:"Kanji",
    src:"Bonus", saveKey:"hyoshiki-dojo-bonus-v1",
    intro:"Vocabulary practice. These levels test reading, not traffic rules, so answers carry no rule citation.",
    sources:[
      'Wording as printed on Japanese road signs and supplementary plates (標識令 designs). Readings are standard dictionary readings.',
      'Listen uses your browser\'s Japanese voice, if it has one.'
    ],
    levels:[
      {id:"kanji", kind:"match", field:"meaning", n:"B.1", title:"Key kanji", short:"Kanji",
       prompt:"What does this kanji mean on a sign? Drag it to a meaning, or tap one.",
       items:K.map(([k,r,m,ex])=>({show:k,read:r,a:m,note:`As in <b>${ex}</b>.`}))},
      {id:"words", kind:"match", field:"meaning", n:"B.2", title:"Sign words", short:"Words",
       prompt:"What does this sign say? Drag it to a meaning, or tap one.",
       items:W.map(([w,r,m])=>({show:w,read:r,a:m}))},
      {id:"readings", kind:"match", field:"reading", n:"B.3", title:"Readings", short:"Readings",
       prompt:"How is this read? Drag it to a reading, or tap one.",
       items:R.map(([w,r,m])=>({show:w,read:r,a:r,mean:m}))},
      {id:"build", kind:"build", n:"B.4", title:"Build the word", short:"Build",
       items:B.map(([w,t,d,m,r])=>({word:w,tiles:t,decoys:d,mean:m,read:r}))},
      {id:"plates", kind:"match", field:"meaning", plate:true, n:"B.5", title:"Plate phrases", short:"Plates",
       prompt:"What does this supplementary plate mean? Drag it to a meaning, or tap one.",
       items:P.map(([t,m,r])=>({show:t,read:r,a:m}))}
    ]
  });
})();
