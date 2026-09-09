(function(){
  function enforceMinimumPicks(){
    const btn=document.getElementById('submit');
    if(!btn||typeof S==='undefined')return;
    const missing=Math.max(0,5-S.roster.length);
    const missingAnd=S.chip==='AND'&&!S.extra;
    btn.disabled=missing>0||missingAnd;
    btn.textContent=missing>0?`Pick ${missing} more to submit`:'Submit picks';
  }
  const observer=new MutationObserver(enforceMinimumPicks);
  observer.observe(document.getElementById('app'),{childList:true,subtree:true});
  enforceMinimumPicks();
})();
