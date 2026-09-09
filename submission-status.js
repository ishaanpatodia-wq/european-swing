(function(){
  S.teamStatus=[];

  function statusRows(){
    const rows=S.teamStatus||[];
    if(!rows.length)return '<div class="notice">Checking submission status…</div>';
    return `<div class="standings">${rows.map(r=>`<div class="standing"><span class="name">${esc(r.player)}</span><span class="pts">${r.submitted?'✓ Submitted':'Not yet'}</span></div>`).join('')}</div><small>Only submission status is shown. Picks stay hidden until reveal.</small>`;
  }

  function statusCard(){
    if(!TOKEN||revealedNow(ev()))return '';
    return `<div class="card pad" style="margin-bottom:14px"><div class="titlebar"><h3>Submission status</h3><span class="label">Live</span></div><div id="submissionStatus">${statusRows()}</div></div>`;
  }

  async function refreshSubmissionStatus(){
    if(!TOKEN||revealedNow(ev()))return;
    try{
      S.teamStatus=await rpc('get_submission_status',{p_token:TOKEN,p_event_id:S.event})||[];
      const el=document.getElementById('submissionStatus');
      if(el)el.innerHTML=statusRows();
    }catch(e){}
  }

  const originalSide=side;
  side=function(){return statusCard()+originalSide()};

  const originalRefresh=refresh;
  refresh=async function(){
    await originalRefresh();
    await refreshSubmissionStatus();
  };

  setInterval(refreshSubmissionStatus,30000);
})();
