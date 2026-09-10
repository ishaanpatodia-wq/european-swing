S.standings=[];
S.autoEventChosen=false;

async function loadBackendEvents(){
  if(!TOKEN)return;
  const rows=await rpc('get_events',{p_token:TOKEN})||[];
  for(const row of rows){
    const e=EVENTS.find(x=>x.id===row.id);
    if(!e)continue;
    e.name=row.name||e.name;
    e.r=row.round_no??e.r;
    e.m=Number(row.multiplier??e.m);
    e.chips=!!row.chips_allowed;
    e.reveal=row.reveal_at||null;
    e.cutTarget=row.cut_deadline||null;
    e.pickTarget=row.reveal_at?new Date(new Date(row.reveal_at).getTime()-2*60*60*1000).toISOString():null;
  }

  if(!S.autoEventChosen){
    const upcoming=EVENTS.filter(x=>x.reveal&&new Date(x.reveal).getTime()>Date.now()).sort((a,b)=>new Date(a.reveal)-new Date(b.reveal))[0];
    if(upcoming)S.event=upcoming.id;
    S.autoEventChosen=true;
  }
}

loadRank=async function(){
  if(!TOKEN){S.rank=[];return}
  const rows=await rpc('get_event_rankings',{p_token:TOKEN,p_event_id:S.event})||[];
  S.rank=rows.map(x=>({name:x.name,points:Number(x.points)}));
};

async function loadStandings(){
  if(!TOKEN){S.standings=[];return}
  S.standings=await rpc('get_standings',{p_token:TOKEN})||[];
}

const refreshWithStaticData=refresh;
refresh=async function(){
  if(TOKEN){
    try{await loadBackendEvents()}catch(e){}
  }
  await refreshWithStaticData();
  if(TOKEN){
    try{await loadStandings();render()}catch(e){}
  }
};
