function pickPanel(){
  const e=ev();
  if(S.loading)return `<div class="card pad"><div class="notice">Loading…</div></div>`;
  if(!TOKEN)return `<div class="card pad"><div class="notice">Choose your name to enter the league.</div></div>`;
  if(S.error)return `<div class="card pad"><h2>Link problem</h2><div class="notice">${esc(S.error)}</div></div>`;
  if(!S.rank.length)return `<div class="card pad"><div class="titlebar"><h2>${e.name}</h2></div><div class="notice">Ranking list will appear here when the field is ready.</div></div>`;
  if(revealedNow(e))return `<div class="card pad"><div class="titlebar"><h2>Teams</h2><span class="label">Revealed</span></div>${revealHtml()}</div>`;
  if(S.status?.submitted&&!S.roster.length)return `<div class="card pad"><div class="titlebar"><h2>Your entry</h2><span class="label">${esc(S.user)}</span></div>${ownLocked()}</div>`;

  const limit=activeBudget();
  const remain=limit-rosterCost();
  const andAvail=S.rank.filter(p=>!S.roster.some(r=>r.name===p.name)&&p.points<=remain);
  const andUnavailable=!e.chips||!!S.status?.and_used_elsewhere;
  const doubleUnavailable=!e.chips||!!S.status?.double_used_elsewhere;

  return `<div class="card pad"><div class="summary"><div class="stat"><span>Picks</span><strong>${S.roster.length+(S.chip==='AND'&&S.extra?1:0)} / ${S.chip==='AND'?6:5}</strong></div><div class="stat ok"><span>Budget</span><strong>${totalCost()} / ${limit}</strong></div><div class="stat"><span>Chip</span><strong>${S.chip||'—'}</strong></div></div><div class="searchrow"><input class="search" id="search" placeholder="Search player"></div><div class="filters">${[0,5,4,3,2,1].map(x=>`<button class="filter ${S.filter===x?'active':''}" data-f="${x}">${x?x+' pt'+(x>1?'s':''):'All'}</button>`).join('')}</div><div class="players">${playersHtml()}</div></div><div class="card pad" style="margin-top:14px"><div class="titlebar"><h2>Your team</h2><span class="label">${limit-totalCost()} pts left</span></div><div class="roster">${rosterHtml()}</div><div class="chiprow"><button class="chip ${S.chip==='AND'?'on':''}" data-chip="AND" ${andUnavailable&&S.chip!=='AND'?'disabled':''}><b>AND</b><span>${S.status?.and_used_elsewhere?'Used · 1× season':'6th pick · 15 pts · 1× season'}</span></button><button class="chip ${S.chip==='DOUBLE'?'on':''}" data-chip="DOUBLE" ${doubleUnavailable&&S.chip!=='DOUBLE'?'disabled':''}><b>DOUBLE</b><span>${S.status?.double_used_elsewhere?'Used · 1× season':'2× one player'}</span></button><button class="chip" disabled><b>CUT</b><span>After R1</span></button></div>${S.chip==='AND'?`<div class="andpick"><select id="extra" class="select"><option value="">6th player · max ${remain} pts</option>${andAvail.map(p=>`<option value="${esc(p.name)}" ${S.extra?.name===p.name?'selected':''}>${esc(p.name)} · ${p.points}</option>`).join('')}</select></div>`:''}${S.chip==='DOUBLE'?`<div class="doublepick"><select id="double" class="select"><option value="">Player to double</option>${S.roster.map(p=>`<option ${S.double===p.name?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`:''}<button class="action" id="submit" ${S.roster.length!==5||(S.chip==='AND'&&!S.extra)?'disabled':''}>Submit picks</button></div>`;
}
