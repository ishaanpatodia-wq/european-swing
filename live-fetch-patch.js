(function(){
  const baseFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const raw=typeof input==='string'?input:input?.url;
      if(raw&&raw.includes('/functions/v1/dpwt-live?event=')&&Array.isArray(S?.revealed)&&S.revealed.length){
        const names=[];
        for(const t of S.revealed){
          for(const n of [...(t?.picks||[]),...(t?.extra_player?[t.extra_player]:[])]){
            if(n&&!names.includes(n))names.push(n);
          }
        }
        if(names.length){
          const u=new URL(raw,window.location.href);
          u.searchParams.set('names',names.join('|'));
          if(typeof input==='string')input=u.toString();
          else input=new Request(u.toString(),input);
        }
      }
    }catch(_e){}
    return baseFetch(input,init);
  };
})();
