(function(){
  const baseSide=side;

  side=function(){
    let html=baseSide();

    // Submission status is useful only once the current event is open for picks.
    // Keep the overall standings clean before rankings exist and after an event is over/revealed.
    if(!S.rank.length||ev()?.complete||revealedNow(ev())){
      html=html.replace(/<span class="submitstate (?:pending|submitted)">.*?<\/span>/g,'');
    }

    // Completed events should no longer advertise chips/points multipliers.
    for(const e of EVENTS){
      if(!e.complete)continue;
      const oldLabel=e.m!==1?`${e.m}× points`:(e.chips?'Chips available':'No chips');
      html=html.replace(
        `<b>${e.name}</b><small>${oldLabel}</small>`,
        `<b>${e.name}</b><small>Complete</small>`
      );
    }

    return html;
  };
})();
