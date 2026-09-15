(function(){
  const PUBLIC_KEY='BP-KogkbtCvOT-mW8QRx8-Gslj95Pv-nMkIgJ1MHKDnHkddFLGbA1IlQLse72JeYNTuDHS9cT-Yokp3ZJ-ZHGes';
  const FN='app-notify';

  function keyBytes(base64String){
    const padding='='.repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(base64);
    return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
  }

  async function registerPush(){
    if(!('serviceWorker' in navigator)||!('PushManager' in window)||!TOKEN)return false;
    const reg=await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub){
      sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(PUBLIC_KEY)});
    }
    const r=await fetch(`${cfg.supabaseUrl}/functions/v1/${FN}`,{
      method:'POST',
      headers:{'content-type':'application/json',apikey:cfg.supabaseAnonKey},
      body:JSON.stringify({action:'subscribe',token:TOKEN,subscription:sub.toJSON()})
    });
    if(!r.ok)throw new Error('notification subscription failed');
    localStorage.setItem('euro_push_enabled','1');
    return true;
  }

  function removePrompt(){document.getElementById('notifyPrompt')?.remove()}

  function promptHtml(){
    return `<div id="notifyPrompt" class="card pad" style="margin-bottom:14px"><div class="titlebar"><h3>Notifications</h3><span class="label">2 alerts only</span></div><div class="notice">Rankings ready + 1 hour before the Thursday deadline.</div><button class="ghost rulesbtn" id="enableNotify">Enable notifications</button></div>`;
  }

  function paintPrompt(){
    if(!TOKEN||!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window)){removePrompt();return}
    if(Notification.permission==='denied'){removePrompt();return}
    if(localStorage.getItem('euro_push_enabled')==='1'){removePrompt();return}
    if(document.getElementById('notifyPrompt'))return;
    const main=document.querySelector('main.shell');
    if(!main)return;
    main.insertAdjacentHTML('afterbegin',promptHtml());
    document.getElementById('enableNotify')?.addEventListener('click',async()=>{
      const btn=document.getElementById('enableNotify');
      if(btn){btn.disabled=true;btn.textContent='Enabling…'}
      try{
        const permission=await Notification.requestPermission();
        if(permission==='granted'&&await registerPush())removePrompt();
        else removePrompt();
      }catch(_e){if(btn){btn.disabled=false;btn.textContent='Enable notifications'}}
    });
  }

  async function syncExisting(){
    try{
      if(TOKEN&&Notification.permission==='granted'){
        await registerPush();
        removePrompt();
      }
    }catch(_e){}
  }

  const baseRender=render;
  render=function(){baseRender();setTimeout(()=>{paintPrompt();syncExisting()},0)};
  setTimeout(()=>{paintPrompt();syncExisting()},300);
})();
