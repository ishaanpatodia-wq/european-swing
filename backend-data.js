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
    e.complete=!!row.completed;
    e.reveal=row.reveal_at||null;
    e.cutTarget=row.cut_deadline||null;
    e.pickTarget=row.pick_deadline||null;
  }

  if(!S.autoEventChosen){
    const current=EVENTS.filter(x=>!x.complete).sort((a,b)=>a.r-b.r)[0];
    if(current){
      S.event=current.id;
      try{localStorage.setItem('euro_current_event',current.id)}catch{}
    }
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
