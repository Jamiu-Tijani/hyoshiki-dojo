/* Bonus chapter — 標識の漢字 (road-sign kanji).
   All vocabulary lives in kb/vocab/sign-kanji.json; this file only turns it into levels.
   Kinds: "match" (drag the prompt to one of four answers; `field` picks which answer)
          "build" (tap tiles in order to write the word; `decoys` are lookalikes). */
"use strict";
(function(){
  const V=KB.vocab["sign-kanji"];
  const word=w=>V.words.find(x=>x.w===w);
  CHAPTERS.push({
    id:"bonus", n:"B", tag:"Bonus", jp:"標識の漢字", en:"Road-sign kanji", short:"Kanji",
    src:"Bonus", saveKey:"hyoshiki-dojo-bonus-v1", rules:false,
    intro:"Vocabulary practice. These levels test reading, not traffic rules, so answers carry no rule citation.",
    sources:[
      'Wording as printed on Japanese road signs and supplementary plates. Readings are standard dictionary readings. Status: '+V.status+' (see kb/vocab/sign-kanji.json).',
      'Listen uses your browser\'s Japanese voice, if it has one.'
    ],
    levels:[
      {id:"kanji", kind:"match", field:"meaning", n:"B.1", title:"Key kanji", short:"Kanji",
       prompt:"What does this kanji mean on a sign? Drag it to a meaning, or tap one.",
       items:V.kanji.map(k=>({show:k.k,read:k.read,a:k.en,note:`As in <b>${k.example}</b>.`}))},
      {id:"words", kind:"match", field:"meaning", n:"B.2", title:"Sign words", short:"Words",
       prompt:"What does this sign say? Drag it to a meaning, or tap one.",
       items:V.words.map(w=>({show:w.w,read:w.read,a:w.en}))},
      {id:"readings", kind:"match", field:"reading", n:"B.3", title:"Readings", short:"Readings",
       prompt:"How is this read? Drag it to a reading, or tap one.",
       items:V.readingDrill.map(word).map(w=>({show:w.w,read:w.read,a:w.read,mean:w.en}))},
      {id:"build", kind:"build", n:"B.4", title:"Build the word", short:"Build",
       items:V.build.map(b=>{const w=word(b.w);return {word:b.w,tiles:b.tiles,decoys:b.decoys,mean:w.en,read:w.read};})},
      {id:"plates", kind:"match", field:"meaning", plate:true, n:"B.5", title:"Plate phrases", short:"Plates",
       prompt:"What does this supplementary plate mean? Drag it to a meaning, or tap one.",
       items:V.plates.map(p=>({show:p.text,read:p.read,a:p.en}))}
    ]
  });
})();
