(function(){
  S.historyByEvent=S.historyByEvent||{};
  const previousRevealHtml=revealHtml;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ø/g,'o').replace(/æ/g,'ae').replace(/å/g,'a').replace(/ł/g,'l').replace(/ð/g,'d').replace(/þ/g,'th').replace(/[^a-z0-9]+/g,' ').trim();
  const same=(a,b)=>norm(a)===norm(b);
  const fmtPts=n=>Number.isFinite(Number(n))?String(Number.isInteger(Number(n))?Number(n):Number(Number(n).toFixed(1))):'—';

  function baseFinalPoints(r){
    if(!r)return null;
    if(!r.made_cut)return -3;
    const pos=Number(r.finish_position);
    if(!Number.isFinite(pos)||pos<=0)return 1;
    if(pos===1)return 30;
    if(pos===2)return 20;
    if(pos===3)return 15;
    if(pos<=5)return 10;
    if(pos<=10)return 7;
    if(pos<=25)return 5;
    return 1;
  }

  function finishLabel(r){
    if(!r)return '—';
    if(!r.made_cut)return Number.isFinite(Number(r.finish_position))?'MC':'MC/WD';
    const pos=Number(r.finish_position);
    return Number.isFinite(pos)&&pos>0?String(pos):'Made cut';
  }

  function historicalMarkup(){
    const e=ev();
    const h=S.historyByEvent?.[S.event];
    if(!h||h.loading)return `<div class="live-board"><div class="live-status"><span>Loading final results…</span></div></div>`;
    if(h.error)return `<div class="live-board"><div class="live-status"><span>Final results unavailable</span></div></div>`;

    const results=new Map((h.results||[]).map(r=>[norm(r.name),r]));
    const finalTotals=new Map((h.team_scores||[]).map(x=>[norm(x.player_name),Number(x.points)]));
    const rankMeta=new Map((S.rank||[]).map((p,i)=>[norm(p.name),{points:Number(p.points)||0,index:i}]));
    const entries=S.revealed||[];

    const teamModels=entries.map(t=>{
      const names=[...(t.picks||[]),...(t.extra_player?[t.extra_player]:[])];
      const rows=names.map(name=>{
        const result=results.get(norm(name))||null;
        let pts=baseFinalPoints(result);
        const isCut=same(t.cut_player,name);
        const isDouble=same(t.double_player,name);
        const isAnd=same(t.extra_player,name);
        if(isCut)pts=0;
        else if(isDouble&&Number.isFinite(pts))pts*=2;
        if(Number.isFinite(pts))pts*=Number(e?.m||1);
        const meta=rankMeta.get(norm(name))||{points:-1,index:9999};
        return {name,result,pts,isCut,isDouble,isAnd,meta};
      }).sort((a,b)=>b.meta.points-a.meta.points||a.meta.index-b.meta.index||a.name.localeCompare(b.name));
      const authoritative=finalTotals.get(norm(t.player_name));
      const computed=rows.every(r=>Number.isFinite(r.pts))?rows.reduce((s,r)=>s+r.pts,0):null;
      return {player:t.player_name||'',rows,total:Number.isFinite(authoritative)?authoritative:computed};
    });

    const standings=teamModels.slice().sort((a,b)=>(Number(b.total)||0)-(Number(a.total)||0)||a.player.localeCompare(b.player));
    const tags=r=>[
      r.isAnd?'<span class="tag">AND</span>':'',
      r.isDouble?'<span class="tag">2×</span>':'',
      r.isCut?'<span class="tag">CUT</span>':''
    ].filter(Boolean).join(' ');

    const teamTable=m=>`<section class="live-team"><div class="live-team-head"><h3>${esc(m.player)}</h3><span>${fmtPts(m.total)} pts</span></div><div class="live-table-wrap"><table class="live-table team-table"><thead><tr><th>Player</th><th>Finish</th><th>Pts</th></tr></thead><tbody>${m.rows.map(r=>`<tr><td><span class="live-player-name">${esc(r.name)}</span>${tags(r)?` <span class="live-tags">${tags(r)}</span>`:''}</td><td>${esc(finishLabel(r.result))}</td><td class="live-points">${fmtPts(r.pts)}</td></tr>`).join('')}</tbody></table></div></section>`;

    return `<div class="live-board"><div class="live-status"><span>Final results · historical</span></div><section class="live-league"><div class="live-league-title">Final standings</div><table class="live-table league-table"><thead><tr><th>Rank</th><th>Player</th><th>Pts</th></tr></thead><tbody>${standings.map((m,i)=>`<tr><td>${i+1}</td><td>${esc(m.player)}</td><td class="live-points">${fmtPts(m.total)}</td></tr>`).join('')}</tbody></table></section><div class="live-teams">${teamModels.map(teamTable).join('')}</div></div>`;
  }

  revealHtml=function(){
    if(ev()?.complete)return historicalMarkup();
    return previousRevealHtml();
  };

  async function loadHistorical(force=false){
    const e=ev();
    const eventId=S.event;
    if(!TOKEN||!e?.complete||!revealedNow(e))return;
    const existing=S.historyByEvent[eventId];
    if(existing?.loaded&&!force)return;
    S.historyByEvent[eventId]={...(existing||{}),loading:true,error:null};
    render();
    try{
      const data=await rpc('get_event_history',{p_token:TOKEN,p_event_id:eventId});
      if(S.event!==eventId)return;
      S.historyByEvent[eventId]={...(data||{}),loaded:true,loading:false,error:null};
    }catch(err){
      if(S.event!==eventId)return;
      S.historyByEvent[eventId]={loaded:false,loading:false,error:String(err?.message||err||'unavailable')};
    }
    render();
  }

  window.refreshHistoricalNow=()=>loadHistorical(true);
  const previousRefresh=refresh;
  refresh=async function(){
    await previousRefresh();
    if(ev()?.complete)await loadHistorical();
  };

  if(ev()?.complete)loadHistorical();
})();
