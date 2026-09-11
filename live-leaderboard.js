(function(){
  const LIVE_REFRESH_MS=60000;
  const LIVE_FN='dpwt-live';

  S.liveLeaderboard=S.liveLeaderboard||{eventId:null,players:[],updatedAt:null,loading:false,error:null};

  const norm=s=>String(s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

  function livePlayer(name){
    const target=norm(name);
    const rows=S.liveLeaderboard?.players||[];
    let hit=rows.find(p=>norm(p.name)===target);
    if(hit)return hit;
    const bits=target.split(' ').filter(Boolean);
    const first=bits[0]||'';
    const last=bits[bits.length-1]||'';
    const candidates=rows.filter(p=>{
      const b=norm(p.name).split(' ').filter(Boolean);
      return b.length&&b[b.length-1]===last&&(!first||b[0]?.[0]===first[0]);
    });
    return candidates.length===1?candidates[0]:null;
  }

  function belowProjectedCut(p){
    if(!p)return false;
    const cut=Number(S.liveLeaderboard?.projectedCutScore);
    const score=Number(p.scoreNumber);
    return Number.isFinite(cut)&&Number.isFinite(score)&&score>cut;
  }

  function projectedPoints(p){
    if(!p)return null;
    if(p.cut||belowProjectedCut(p))return -3;
    let pos=Number(p.positionNumber);
    if(!Number.isFinite(pos)||pos<=0){
      const m=String(p.position||'').match(/\d+/);
      pos=m?Number(m[0]):NaN;
    }
    if(!Number.isFinite(pos))return null;
    if(pos===1)return 30;
    if(pos===2)return 20;
    if(pos===3)return 15;
    if(pos<=5)return 10;
    if(pos<=10)return 7;
    if(pos<=25)return 5;
    return 1;
  }

  const same=(a,b)=>norm(a)===norm(b);
  const fmtPts=n=>Number.isFinite(n)?String(Number.isInteger(n)?n:Number(n.toFixed(1))):'—';

  function teamModel(t){
    const names=[...(t?.picks||[]),...(t?.extra_player?[t.extra_player]:[])];
    const multiplier=Number(ev()?.m||1);
    const rows=names.map(name=>{
      const live=livePlayer(name);
      let base=projectedPoints(live);
      const isCut=same(t?.cut_player,name);
      const isDouble=same(t?.double_player,name);
      const isAnd=same(t?.extra_player,name);
      let effective=base;
      if(isCut)effective=0;
      else if(isDouble&&Number.isFinite(effective))effective*=2;
      if(Number.isFinite(effective))effective*=multiplier;
      return {name,live,base,effective,isCut,isDouble,isAnd,projectedOut:belowProjectedCut(live)};
    }).sort((a,b)=>{
      const ap=Number.isFinite(a.effective)?a.effective:-999;
      const bp=Number.isFinite(b.effective)?b.effective:-999;
      if(bp!==ap)return bp-ap;
      const apos=Number(a.live?.positionNumber)||9999;
      const bpos=Number(b.live?.positionNumber)||9999;
      return apos-bpos||a.name.localeCompare(b.name);
    });
    const complete=rows.length>0&&rows.every(r=>Number.isFinite(r.effective));
    const total=complete?rows.reduce((s,r)=>s+r.effective,0):null;
    return {player:t?.player_name||'',rows,total,complete};
  }

  function tags(r){
    const out=[];
    if(r.isAnd)out.push('<span class="tag">AND</span>');
    if(r.isDouble)out.push('<span class="tag">2×</span>');
    if(r.isCut)out.push('<span class="tag">CUT</span>');
    return out.length?` <span class="live-tags">${out.join('')}</span>`:'';
  }

  function teamTable(model){
    return `<section class="live-team">
      <div class="live-team-head"><h3>${esc(model.player)}</h3><span>${model.total===null?'—':fmtPts(model.total)} LIVE PTS</span></div>
      <div class="live-table-wrap"><table class="live-table team-table">
        <thead><tr><th>Player</th><th>Score</th><th>Pos</th><th>Live pts</th></tr></thead>
        <tbody>${model.rows.map(r=>`<tr>
          <td><span class="live-player-name">${esc(r.name)}</span>${tags(r)}</td>
          <td>${esc(r.live?.score||'—')}</td>
          <td>${esc(r.live?.position||'—')}</td>
          <td class="live-points">${fmtPts(r.effective)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </section>`;
  }

  function liveMarkup(){
    const entries=S.revealed||[];
    const models=entries.map(teamModel);
    const ordered=models.slice().sort((a,b)=>{
      if(a.total===null&&b.total===null)return a.player.localeCompare(b.player);
      if(a.total===null)return 1;
      if(b.total===null)return -1;
      return b.total-a.total||a.player.localeCompare(b.player);
    });
    const when=S.liveLeaderboard?.updatedAt?new Date(S.liveLeaderboard.updatedAt).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'}):null;
    const cut=S.liveLeaderboard?.projectedCut;
    const cutText=cut&&cut!=='—'?` · cut estimate ${cut}`:'';
    const status=S.liveLeaderboard?.loading?'Updating live scores…':S.liveLeaderboard?.error?'Live feed temporarily unavailable':`Live / projected points${cutText}${when?' · updated '+when+' IST':''}`;
    return `<div class="live-board">
      <div class="live-status"><span class="live-dot"></span><span>${esc(status)}</span></div>
      <section class="live-league">
        <div class="live-league-title">Live League</div>
        <table class="live-table league-table"><thead><tr><th>Rank</th><th>Player</th><th>Live pts</th></tr></thead>
        <tbody>${ordered.map((m,i)=>`<tr><td>${i+1}</td><td>${esc(m.player)}</td><td class="live-points">${m.total===null?'—':fmtPts(m.total)}</td></tr>`).join('')}</tbody></table>
      </section>
      <div class="live-teams">${models.map(teamTable).join('')}</div>
      <div class="live-note">Players below the live cut estimate are shown as -3. Final league scores are only locked after the event finishes.</div>
    </div>`;
  }

  revealHtml=function(){
    return `<div id="liveReveal">${liveMarkup()}</div>`;
  };

  function paintLive(){
    const box=document.getElementById('liveReveal');
    if(box)box.innerHTML=liveMarkup();
  }

  async function loadLive(force=false){
    if(!TOKEN||!revealedNow(ev()))return;
    if(!force&&S.liveLeaderboard.loading)return;
    if(S.liveLeaderboard.eventId!==S.event){
      S.liveLeaderboard={eventId:S.event,players:[],updatedAt:null,loading:true,error:null};
    }else{
      S.liveLeaderboard.loading=true;
      S.liveLeaderboard.error=null;
    }
    paintLive();
    try{
      const r=await fetch(`${cfg.supabaseUrl}/functions/v1/${LIVE_FN}?event=${encodeURIComponent(S.event)}`,{
        cache:'no-store',
        headers:{apikey:cfg.supabaseAnonKey}
      });
      if(!r.ok)throw new Error(`Live feed ${r.status}`);
      const data=await r.json();
      S.liveLeaderboard={
        eventId:S.event,
        players:Array.isArray(data.players)?data.players:[],
        updatedAt:data.updatedAt||new Date().toISOString(),
        round:data.round||null,
        eventName:data.eventName||null,
        projectedCutScore:data.projectedCutScore,
        projectedCut:data.projectedCut||null,
        projectedCutMethod:data.projectedCutMethod||null,
        loading:false,
        error:data.error||null
      };
    }catch(e){
      S.liveLeaderboard.loading=false;
      S.liveLeaderboard.error='unavailable';
    }
    paintLive();
  }

  const baseRefresh=refresh;
  refresh=async function(){
    await baseRefresh();
    if(TOKEN&&revealedNow(ev()))loadLive(true);
  };

  setInterval(()=>{
    if(TOKEN&&revealedNow(ev()))loadLive();
  },LIVE_REFRESH_MS);

  if(TOKEN&&revealedNow(ev())){
    render();
    loadLive(true);
  }
})();
