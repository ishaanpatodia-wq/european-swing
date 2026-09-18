(function(){
  let busy=false;
  let lastRun=0;

  async function refreshLiveOnResume(){
    if(document.visibilityState==='hidden'||busy||!TOKEN)return;
    const e=ev();
    if(!e||!revealedNow(e)||e.complete)return;
    const now=Date.now();
    if(now-lastRun<1500)return;
    lastRun=now;
    busy=true;
    try{
      if(typeof window.refreshLiveNow==='function')await window.refreshLiveNow();
      else await refresh();
    }catch(_e){}finally{busy=false}
  }

  window.addEventListener('focus',refreshLiveOnResume);
  window.addEventListener('pageshow',refreshLiveOnResume);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')refreshLiveOnResume();
  });
  setTimeout(refreshLiveOnResume,250);
})();
