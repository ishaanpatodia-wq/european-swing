function activeBudget(){return S.chip==='AND'?15:12}

function restoreDraft(){
  const k=draftKey();
  if(!k||!S.rank.length)return;
  let d=null;
  try{d=JSON.parse(localStorage.getItem(k)||'null')}catch{}
  if(!d)return;

  let chip=(d.chip==='AND'||d.chip==='DOUBLE')?d.chip:null;
  if(chip==='AND'&&S.status?.and_used_elsewhere)chip=null;
  if(chip==='DOUBLE'&&S.status?.double_used_elsewhere)chip=null;
  S.chip=chip;
  S.roster=[];
  S.double=null;
  S.extra=null;

  for(const name of d.picks||[]){
    const p=S.rank.find(x=>x.name===name);
    if(p&&S.roster.length<5&&!S.roster.some(x=>x.name===p.name)&&rosterCost()+p.points<=activeBudget())S.roster.push(p);
  }

  if(S.chip==='DOUBLE'&&d.double&&S.roster.some(p=>p.name===d.double))S.double=d.double;
  if(S.chip==='AND'&&d.extra){
    const p=S.rank.find(x=>x.name===d.extra);
    if(p&&!S.roster.some(x=>x.name===p.name)&&rosterCost()+p.points<=15)S.extra=p;
  }
}

function toggle(name){
  const p=S.rank.find(x=>x.name===name);
  if(!p)return;
  const i=S.roster.findIndex(x=>x.name===name);
  if(i>=0){S.roster.splice(i,1);normalizeExtra();saveDraft();render();return}
  if(S.roster.length>=5)return;
  const limit=activeBudget();
  if(totalCost()+p.points>limit)return alert(`${limit}-point budget exceeded.`);
  S.roster.push(p);
  normalizeExtra();
  saveDraft();
  render();
}

function normalizeExtra(){
  if(S.chip!=='AND')S.extra=null;
  else if(S.extra&&(S.roster.some(p=>p.name===S.extra.name)||rosterCost()+S.extra.points>15))S.extra=null;
}

function chooseChip(c){
  if(!ev().chips)return alert('Chips are not available in Abu Dhabi or the DP World Tour Championship.');
  if(c==='AND'&&S.chip!=='AND'&&S.status?.and_used_elsewhere)return alert('AND has already been used this season.');
  if(c==='DOUBLE'&&S.chip!=='DOUBLE'&&S.status?.double_used_elsewhere)return alert('DOUBLE has already been used this season.');

  const next=S.chip===c?null:c;
  if(S.chip==='AND'&&next!=='AND'&&rosterCost()>12)return alert('Reduce your five base picks to 12 points before removing AND.');

  S.chip=next;
  S.double=null;
  S.extra=null;
  saveDraft();
  render();
}

async function submit(){
  if(S.roster.length!==5)return alert('Pick exactly 5 players.');
  const limit=activeBudget();
  if(totalCost()>limit)return alert(`Maximum ${limit} points.`);
  if(S.chip==='DOUBLE'&&!S.double)return alert('Choose the player to double.');
  if(S.chip==='AND'&&!S.extra)return alert('Choose the 6th player.');
  if(revealedNow(ev()))return alert('Teams have already been revealed.');
  try{
    const res=await rpc('submit_picks',{
      p_token:TOKEN,
      p_event_id:S.event,
      p_picks:S.roster.map(p=>p.name),
      p_chip:S.chip,
      p_extra_player:S.extra?.name||null,
      p_double_player:S.double||null
    });
    clearDraft();
    S.roster=[];S.chip=null;S.double=null;S.extra=null;
    await refresh();
    if(res?.late)alert('Submitted — a little after the Wednesday target, but accepted.');
  }catch(e){alert(e.message)}
}

function playersHtml(){
  const limit=activeBudget();
  return filtered().map(p=>{
    const sel=S.roster.some(x=>x.name===p.name);
    const blocked=!sel&&(S.roster.length>=5||totalCost()+p.points>limit);
    return `<button class="player ${sel?'sel':''} ${blocked?'disabled':''}" data-p="${esc(p.name)}" ${blocked?'disabled':''}><span>${esc(p.name)}</span><span class="rating r${p.points}">${p.points}</span></button>`;
  }).join('');
}

function pickPanel(){
  const e=ev();
  if(S.loading)return `<div class="card pad"><div class="notice">Loading…</div></div>`;
  if(!TOKEN)return `<div class="card pad"><div class="notice">Choose your name to enter the league.</div></div>`;
  if(S.error)return `<div class="card pad"><h2>Link problem</h2><div class="notice">${esc(S.error)}</div></div>`;
  if(e.id!=='irish-open')return `<div class="card pad"><div class="titlebar"><h2>${e.name}</h2></div><div class="notice">Ranking list will appear here when the field is ready.</div></div>`;
  if(revealedNow(e))return `<div class="card pad"><div class="titlebar"><h2>Teams</h2><span class="label">Revealed</span></div>${revealHtml()}</div>`;
  if(S.status?.submitted&&!S.roster.length)return `<div class="card pad"><div class="titlebar"><h2>Your entry</h2><span class="label">${esc(S.user)}</span></div>${ownLocked()}</div>`;

  const limit=activeBudget();
  const remain=limit-rosterCost();
  const andAvail=S.rank.filter(p=>!S.roster.some(r=>r.name===p.name)&&p.points<=remain);
  const andUnavailable=!e.chips||!!S.status?.and_used_elsewhere;
  const doubleUnavailable=!e.chips||!!S.status?.double_used_elsewhere;

  return `<div class="card pad"><div class="summary"><div class="stat"><span>Picks</span><strong>${S.roster.length+(S.chip==='AND'&&S.extra?1:0)} / ${S.chip==='AND'?6:5}</strong></div><div class="stat ok"><span>Budget</span><strong>${totalCost()} / ${limit}</strong></div><div class="stat"><span>Chip</span><strong>${S.chip||'—'}</strong></div></div><div class="searchrow"><input class="search" id="search" placeholder="Search player"></div><div class="filters">${[0,5,4,3,2,1].map(x=>`<button class="filter ${S.filter===x?'active':''}" data-f="${x}">${x?x+' pt'+(x>1?'s':''):'All'}</button>`).join('')}</div><div class="players">${playersHtml()}</div></div><div class="card pad" style="margin-top:14px"><div class="titlebar"><h2>Your team</h2><span class="label">${limit-totalCost()} pts left</span></div><div class="roster">${rosterHtml()}</div><div class="chiprow"><button class="chip ${S.chip==='AND'?'on':''}" data-chip="AND" ${andUnavailable&&S.chip!=='AND'?'disabled':''}><b>AND</b><span>${S.status?.and_used_elsewhere?'Used · 1× season':'6th pick · 15 pts · 1× season'}</span></button><button class="chip ${S.chip==='DOUBLE'?'on':''}" data-chip="DOUBLE" ${doubleUnavailable&&S.chip!=='DOUBLE'?'disabled':''}><b>DOUBLE</b><span>${S.status?.double_used_elsewhere?'Used · 1× season':'2× one player'}</span></button><button class="chip" disabled><b>CUT</b><span>After R1</span></button></div>${S.chip==='AND'?`<div class="andpick"><select id="extra" class="select"><option value="">6th player · max ${remain} pts</option>${andAvail.map(p=>`<option value="${esc(p.name)}" ${S.extra?.name===p.name?'selected':''}>${esc(p.name)} · ${p.points}</option>`).join('')}</select></div>`:''}${S.chip==='DOUBLE'?`<div class="doublepick"><select id="double" class="select"><option value="">Player to double</option>${S.roster.map(p=>`<option ${S.double===p.name?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`:''}<button class="action" id="submit" ${S.roster.length!==5||(S.chip==='AND'&&!S.extra)?'disabled':''}>Submit picks</button></div>`;
}

function rulesModal(){
  if(!S.showRules)return'';
  return `<div class="modal"><div class="modalin"><button class="close" id="closeRules">×</button><div class="label">European Swing</div><h2>Rules</h2><div class="rulelist"><div class="ruleline"><b>Weekly team</b><span>5 players · 12 points</span></div><div class="ruleline"><b>Picks target</b><span>Wednesday · 10pm IST</span></div><div class="ruleline"><b>Reveal</b><span>Thursday · 12am IST</span></div><div class="ruleline"><b>AND</b><span>6th player · 15-point total budget · 1× season</span></div><div class="ruleline"><b>DOUBLE</b><span>Double one player's score · 1× season</span></div><div class="ruleline"><b>CUT</b><span>After R1 · Friday 12am IST target · 1× season</span></div><div class="ruleline"><b>Chip limit</b><span>1 per event · none in Abu Dhabi/DP World Tour Championship</span></div><div class="ruleline"><b>Abu Dhabi</b><span>1.5× points</span></div><div class="ruleline"><b>Dubai</b><span>2× points</span></div></div><h3 style="margin:18px 0 8px">Scoring</h3><div class="scoregrid">${SC.map(s=>`<div class="score"><span>${s[0]}</span><b>${s[1]>0?'+':''}${s[1]}</b></div>`).join('')}</div></div></div>`;
}
