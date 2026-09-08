const root=document.getElementById('app');
const cfg=window.EURO_CONFIG||{};
const EVENTS=[
{id:'irish-open',name:'Irish Open',r:1,m:1,chips:true,pickTarget:'2026-09-09T22:00:00+05:30',reveal:'2026-09-10T00:00:00+05:30',cutTarget:'2026-09-11T00:00:00+05:30'},
{id:'bmw-pga',name:'BMW PGA Championship',r:2,m:1,chips:true},
{id:'french-open',name:'French Open',r:3,m:1,chips:true},
{id:'alfred-dunhill',name:'Alfred Dunhill Links',r:4,m:1,chips:true},
{id:'open-de-espana',name:'Open de España',r:5,m:1,chips:true},
{id:'india',name:'India',r:6,m:1,chips:true},
{id:'korea',name:'Korea',r:7,m:1,chips:true},
{id:'abu-dhabi',name:'Abu Dhabi',r:8,m:1.5,chips:false},
{id:'dpwt-championship',name:'DP World Tour Championship',r:9,m:2,chips:false}
];
const SC=[['1st',30],['2nd',20],['3rd',15],['4th–5th',10],['6th–10th',7],['11th–25th',5],['Made cut',1],['Missed cut',-3]];
let AUTH=null;
try{AUTH=JSON.parse(localStorage.getItem('euro_auth')||'null')}catch{}
let TOKEN=AUTH?.token||'';
let S={event:'irish-open',rank:[],roster:[],chip:null,double:null,extra:null,status:null,revealed:null,user:AUTH?.name||null,filter:0,showRules:false,loading:true,error:null,loginName:null,loginError:null,loginBusy:false,loginSetup:false,accountOpen:false,accountError:null,accountBusy:false};
const ev=()=>EVENTS.find(x=>x.id===S.event);
const rosterCost=()=>S.roster.reduce((a,b)=>a+b.points,0);
const totalCost=()=>rosterCost()+(S.chip==='AND'&&S.extra?S.extra.points:0);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=x=>x?new Date(x).toLocaleString('en-IN',{weekday:'short',hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'})+' IST':'TBC';
const now=()=>Date.now();
const revealedNow=e=>!!(e.reveal&&now()>=new Date(e.reveal).getTime());
async function rpc(fn,args){const r=await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:cfg.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify(args)});const txt=await r.text();if(!r.ok){let msg=txt;try{msg=JSON.parse(txt).message||txt}catch{}throw new Error(msg)}return txt?JSON.parse(txt):null}
async function loadRank(){if(S.event!=='irish-open'){S.rank=[];return}S.rank=await(await fetch('irish-open-rankings.json',{cache:'no-store'})).json()}
async function refresh(){S.loading=true;S.error=null;S.revealed=null;render();try{await loadRank();if(!TOKEN){S.loading=false;render();return}S.status=await rpc('get_my_status',{p_token:TOKEN,p_event_id:S.event});S.user=S.status?.player||null;if(revealedNow(ev())){try{S.revealed=await rpc('get_revealed_entries',{p_token:TOKEN,p_event_id:S.event})}catch(e){S.revealed=[]}}}catch(e){S.error=e.message||String(e)}S.loading=false;render()}
function toggle(name){const p=S.rank.find(x=>x.name===name);if(!p)return;const i=S.roster.findIndex(x=>x.name===name);if(i>=0){S.roster.splice(i,1);normalizeExtra();render();return}if(S.roster.length>=5)return;if(totalCost()+p.points>12)return alert('12-point budget exceeded.');S.roster.push(p);normalizeExtra();render()}
function normalizeExtra(){if(S.chip!=='AND')S.extra=null;else if(S.extra&&(S.roster.some(p=>p.name===S.extra.name)||rosterCost()+S.extra.points>12))S.extra=null}
function chooseChip(c){if(!ev().chips)return alert('Chips are not available in Abu Dhabi or Dubai.');S.chip=S.chip===c?null:c;S.double=null;S.extra=null;render()}
async function submit(){if(S.roster.length!==5)return alert('Pick exactly 5 players.');if(totalCost()>12)return alert('Maximum 12 points.');if(S.chip==='DOUBLE'&&!S.double)return alert('Choose the player to double.');if(S.chip==='AND'&&!S.extra)return alert('Choose the 6th player.');if(revealedNow(ev()))return alert('Teams have already been revealed.');try{const res=await rpc('submit_picks',{p_token:TOKEN,p_event_id:S.event,p_picks:S.roster.map(p=>p.name),p_chip:S.chip,p_extra_player:S.extra?.name||null,p_double_player:S.double||null});S.roster=[];S.chip=null;S.double=null;S.extra=null;await refresh();if(res?.late)alert('Submitted — a little after the Wednesday target, but accepted.')}catch(e){alert(e.message)}}
function editEntry(){if(!S.status?.submitted||revealedNow(ev()))return;S.roster=(S.status.picks||[]).map(n=>S.rank.find(p=>p.name===n)).filter(Boolean);S.chip=S.status.chip||null;S.double=S.status.double_player||null;S.extra=S.status.extra_player?S.rank.find(p=>p.name===S.status.extra_player)||null:null;render()}
async function exerciseCut(name){if(!name)return;if(!confirm(`Cut ${name}?`))return;try{const res=await rpc('exercise_cut',{p_token:TOKEN,p_event_id:S.event,p_golfer:name});await refresh();if(res?.late)alert('CUT recorded. It was after the Friday target, but accepted.')}catch(e){alert(e.message)}}
async function completeAuth(res){TOKEN=res.token;AUTH={token:res.token,name:res.player};localStorage.setItem('euro_auth',JSON.stringify(AUTH));S.user=res.player;S.loginName=null;S.loginError=null;S.loginSetup=false;S.loginBusy=false;await refresh()}
async function selectLoginName(name){S.loginName=name;S.loginError=null;S.loginBusy=true;render();try{const res=await rpc('pin_status',{p_name:name});S.loginSetup=!res?.pin_set;S.loginBusy=false;render()}catch(e){S.loginBusy=false;S.loginError='Could not check profile. Try again.';render()}}
async function login(name,pin){if(!name||!/^[0-9]{4}$/.test(pin||'')){S.loginError='Enter a 4-digit PIN.';render();return}S.loginBusy=true;S.loginError=null;render();try{const res=await rpc('login_with_pin',{p_name:name,p_pin:pin});if(res?.ok){await completeAuth(res);return}if(res?.error==='not_set'){S.loginSetup=true;S.loginBusy=false;S.loginError='First visit — choose your own 4-digit PIN.';render();return}if(res?.error==='rate_limited'){S.loginBusy=false;S.loginError='Too many attempts. Try again in a few minutes.';render();return}S.loginBusy=false;S.loginError='Wrong PIN. Try again.';render()}catch(e){S.loginBusy=false;S.loginError='Could not sign in. Try again.';render()}}
async function setFirstPin(name,pin){if(!name||!/^[0-9]{4}$/.test(pin||'')){S.loginError='Choose a 4-digit PIN.';render();return}S.loginBusy=true;S.loginError=null;render();try{const res=await rpc('set_first_pin',{p_name:name,p_pin:pin});if(res?.ok){await completeAuth(res);return}if(res?.error==='already_set'){S.loginSetup=false;S.loginBusy=false;S.loginError='A PIN is already set. Enter it to continue.';render();return}S.loginBusy=false;S.loginError='Could not set PIN. Try again.';render()}catch(e){S.loginBusy=false;S.loginError='Could not set PIN. Try again.';render()}}
async function changePin(currentPin,newPin){if(!/^[0-9]{4}$/.test(currentPin||'')||!/^[0-9]{4}$/.test(newPin||'')){S.accountError='Both PINs must be 4 digits.';render();return}S.accountBusy=true;S.accountError=null;render();try{const res=await rpc('change_pin',{p_token:TOKEN,p_current_pin:currentPin,p_new_pin:newPin});if(res?.ok){S.accountBusy=false;S.accountOpen=false;S.accountError=null;render();alert('PIN changed.');return}const msg={wrong_current:'Current PIN is incorrect.',same:'Choose a different new PIN.',format:'PINs must be 4 digits.',invalid_session:'Session expired. Switch user and sign in again.'}[res?.error]||'Could not change PIN.';S.accountBusy=false;S.accountError=msg;render()}catch(e){S.accountBusy=false;S.accountError='Could not change PIN.';render()}}
function logout(){localStorage.removeItem('euro_auth');AUTH=null;TOKEN='';S.user=null;S.status=null;S.revealed=null;S.roster=[];S.chip=null;S.double=null;S.extra=null;S.loginName=null;S.loginSetup=false;S.accountOpen=false;S.accountError=null;S.error=null;render()}
