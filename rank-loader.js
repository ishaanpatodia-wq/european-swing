loadRank=async function(){
  if(S.event!=='irish-open'){S.rank=[];return}
  const r=await fetch(`${cfg.supabaseUrl}/rest/v1/rankings?event_id=eq.irish-open&select=golfer,rating&order=rating.desc,golfer.asc`,{headers:{apikey:cfg.supabaseAnonKey}});
  if(!r.ok)throw new Error('Could not load Irish Open rankings.');
  const d=await r.json();
  S.rank=d.map(x=>({name:x.golfer,points:x.rating}));
};
