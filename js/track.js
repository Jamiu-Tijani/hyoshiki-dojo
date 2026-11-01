/* Session tracking in localStorage.
   A session is a run of activity with no gap longer than 30 minutes.
   Storage (all JSON, all wrapped in try/catch so private windows still work):
     hd.v2.meta      {schema, current, last}
     hd.v2.sessions  [{id, start, end, answers, correct, firstAnswers, firstCorrect, ms, levels:{"ch1/bans":{a,c}}}]  newest last, capped
     hd.v2.items     {"ch1/bans/<hash>": {n, ok, firstN, firstOk, last, ms, label, lvl}}
   Item keys hash the item's own data, so they stay stable when items are added or reordered. */
"use strict";
const Track=(function(){
  const K={meta:"hd.v2.meta",sessions:"hd.v2.sessions",items:"hd.v2.items"};
  const GAP=30*60*1000, MAX_SESSIONS=200, MAX_ITEM_MS=5*60*1000;
  const get=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
  const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}};
  let meta=get(K.meta,null)||{schema:2,current:null,last:0};
  let sessions=get(K.sessions,[]); if(!Array.isArray(sessions))sessions=[];
  let items=get(K.items,{}); if(!items||typeof items!=="object")items={};
  let t0=0, curKey=null;

  function hash(str){let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return (h>>>0).toString(36);}
  function keyFor(chapterId,levelId,item){return `${chapterId}/${levelId}/${hash(JSON.stringify(item))}`;}

  function session(now){
    let s=sessions.find(x=>x.id===meta.current);
    if(!s||now-meta.last>GAP){
      s={id:now.toString(36),start:now,end:now,answers:0,correct:0,firstAnswers:0,firstCorrect:0,ms:0,levels:{}};
      sessions.push(s);
      if(sessions.length>MAX_SESSIONS)sessions.splice(0,sessions.length-MAX_SESSIONS);
      meta.current=s.id;
    }
    return s;
  }
  function save(){
    if(put(K.sessions,sessions)&&put(K.items,items)&&put(K.meta,meta))return;
    // Out of space: drop the oldest half of the sessions and retry once.
    sessions.splice(0,Math.ceil(sessions.length/2));
    put(K.sessions,sessions);put(K.items,items);put(K.meta,meta);
  }

  return {
    keyFor,
    /* call when a question is shown */
    start(key){curKey=key;t0=Date.now();},
    /* call on every answer; `first` = first attempt at this question in this showing */
    answer({key,chapter,level,ok,first,label}){
      const now=Date.now(), s=session(now);
      const ms=key===curKey&&t0?Math.min(now-t0,MAX_ITEM_MS):0;
      s.end=now;s.answers++;if(ok)s.correct++;s.ms+=ms;
      if(first){s.firstAnswers++;if(ok)s.firstCorrect++;}
      const lk=`${chapter}/${level}`, L=s.levels[lk]=s.levels[lk]||{a:0,c:0};L.a++;if(ok)L.c++;
      const it=items[key]=items[key]||{n:0,ok:0,firstN:0,firstOk:0,last:0,ms:0,label:"",lvl:lk};
      it.n++;if(ok)it.ok++;if(first){it.firstN++;if(ok)it.firstOk++;}
      it.last=now;it.ms+=ms;if(label)it.label=label;it.lvl=lk;
      meta.last=now;
      if(ok)t0=0;
      save();
    },
    current(){const s=sessions.find(x=>x.id===meta.current);return s&&Date.now()-meta.last<=GAP?s:null;},
    sessions(){return sessions.slice();},
    items(){return items;},
    totals(){
      const t={sessions:sessions.length,answers:0,correct:0,firstAnswers:0,firstCorrect:0,ms:0,itemsSeen:Object.keys(items).length};
      for(const s of sessions){t.answers+=s.answers;t.correct+=s.correct;t.firstAnswers+=s.firstAnswers;t.firstCorrect+=s.firstCorrect;t.ms+=s.ms;}
      return t;
    },
    weakest(n=5){
      return Object.entries(items).filter(([,v])=>v.firstN>=1&&v.firstOk<v.firstN)
        .map(([k,v])=>({key:k,...v,rate:v.firstOk/v.firstN}))
        .sort((a,b)=>a.rate-b.rate||b.firstN-a.firstN||b.last-a.last).slice(0,n);
    },
    exportJSON(){return JSON.stringify({exported:new Date().toISOString(),meta,sessions,items},null,1);},
    clear(){sessions=[];items={};meta={schema:2,current:null,last:0};try{localStorage.removeItem(K.sessions);localStorage.removeItem(K.items);localStorage.removeItem(K.meta);}catch(e){}}
  };
})();
