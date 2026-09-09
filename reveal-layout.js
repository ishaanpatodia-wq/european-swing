function revealHtml(){
  const rows=S.revealed||[];
  const by=Object.fromEntries(rows.map(x=>[(x.player_name||'').toLowerCase(),x]));
  const valueOf=name=>S.rank.find(x=>x.name===name)?.points||0;

  return `<div class="reveal">${['ishaan','nihal','sarhan'].map(u=>{
    const t=by[u];
    if(!t)return `<div class="team"><h3>${u}</h3><div class="notice">No submission</div></div>`;

    const all=[...(t.picks||[]),...(t.extra_player?[t.extra_player]:[])]
      .sort((a,b)=>valueOf(b)-valueOf(a)||a.localeCompare(b));

    return `<div class="team"><h3>${u}</h3><ol>${all.map(n=>{
      const p=S.rank.find(x=>x.name===n);
      return `<li>${esc(n)} <b>${p?.points??''}</b>${t.extra_player===n?' <span class="tag">AND</span>':''}${t.double_player===n?' <span class="tag">2×</span>':''}${t.cut_player===n?' <span class="tag">CUT</span>':''}</li>`;
    }).join('')}</ol></div>`;
  }).join('')}</div>`;
}
