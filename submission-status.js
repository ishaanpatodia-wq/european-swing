(function(){
  S.teamStatus=[];

  function entryStatus(name){
    const row=(S.teamStatus||[]).find(r=>(r.player||'').toLowerCase()===name.toLowerCase());
    if(!row)return '<span class="submitstate pending">…</span>';
    return row.submitted?'<span class="submitstate submitted">✓ Submitted</span>':'<span class="submitstate pending">Not yet</span>';
  }

  const originalSide=side;
  side=function(){
    const html=originalSide();
    const names=['Ishaan','Nihal','Sarhan'];
    const rows=names.map((u,i)=>`<div class="standing withstatus"><span class="pos">${i+1}</span><span class="name">${u}</span><span class="pts">0</span>${entryStatus(u)}</div>`).join('');
    const start=html.indexOf('<div class="standings">');
    const endMarker='</div></div><div class="card pad" style="margin-top:14px">';
    const end=start>=0?html.indexOf(endMarker,start):-1;
    if(start<0||end<0)return html;
    return html.slice(0,start)+`<div class="standings" id="submissionStandings">${rows}</div>`+html.slice(end+6);
  };

  function paintStatus(){
    const box=document.getElementById('submissionStandings');
    if(!box)return;
    ['Ishaan','Nihal','Sarhan'].forEach((u,i)=>{
      const row=box.children[i];
      if(!row)return;
      const old=row.querySelector('.submitstate');
      if(old)old.outerHTML=entryStatus(u);
    });
  }

  async function refreshSubmissionStatus(){
    if(!TOKEN||revealedNow(ev()))return;
    try{
      S.teamStatus=await rpc('get_submission_status',{p_token:TOKEN,p_event_id:S.event})||[];
      paintStatus();
    }catch(e){}
  }

  const originalRefresh=refresh;
  refresh=async function(){
    await originalRefresh();
    await refreshSubmissionStatus();
  };

  setInterval(refreshSubmissionStatus,30000);
})();
