import {FIDUCIAL,PRESETS,curvature,point,history,age,timeAt,HUBBLE_GYR,inflationPoint,crossings} from './physics.mjs';
const $=id=>document.getElementById(id);
const COLORS={teal:'#8f5ab5',purple:'#c76998',gold:'#c89751',gray:'#baa6c5',ink:'#483356'};
let p={...FIDUCIAL}, ip={epsilon:.02,duration:60,logk:25,postw:1/3,post:45};
let selectedA=1, selectedN=0, active='flrw', hdata, baseline=history(FIDUCIAL), baselineTime=HUBBLE_GYR/FIDUCIAL.h;
let playing=null, lastFrame=0, animationId=null, currentAge=null;
const supers=s=>String(s).replace(/[-0123456789]/g,c=>({'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c]));
const pow10=n=>n===0?'1':`10${supers(n)}`;
function fmt(v,d=3){if(!Number.isFinite(v))return '—';if(v===0)return '0';if(Math.abs(v)>=1e5||Math.abs(v)<.001){const [mant,ex]=v.toExponential(2).split('e');return `${mant} × 10${supers(Number(ex))}`;}return v.toLocaleString('en-US',{maximumFractionDigits:d});}
function sciLog(ln){const exponent=Math.floor(ln/Math.LN10),m=Math.exp(ln-exponent*Math.LN10);if(Math.abs(exponent)<4)return fmt(Math.exp(ln),3);return `${m.toFixed(2)} × 10${supers(exponent)}`;}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function niceTicks(lo,hi,target=5){const raw=(hi-lo)/target,base=10**Math.floor(Math.log10(raw||1));const step=base*([1,2,2.5,5,10].find(x=>x*base>=raw)||10);const ticks=[];for(let t=Math.ceil(lo/step)*step;t<=hi+step*1e-5;t+=step)ticks.push(Math.abs(t)<step*1e-6?0:t);return ticks;}
let chartCount=0;
function plot(id,{series,xlabel,ylabel,logx=false,logy=false,xdom,ydom,cursor,reference=[],verticals=[],bands=[],onSelect,large=false,description='',xformat,yformat}){
 const el=$(id),W=Math.max(300,Math.round(el.getBoundingClientRect().width)||490),H=large?330:265,m={l:57,r:17,t:20,b:43},iw=W-m.l-m.r,ih=H-m.t-m.b;
 const tx=x=>logx?Math.log10(x):x,ty=y=>logy?Math.log10(y):y;
 const valids=series.flatMap(s=>s.points).filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&(!logx||x>0)&&(!logy||y>0));
 const xv=valids.map(q=>tx(q[0])),yv=valids.map(q=>ty(q[1]));
 let xd=xdom?.map(tx)||[Math.min(...xv),Math.max(...xv)],yd=ydom?.map(ty)||[Math.min(...yv),Math.max(...yv)];
 if(!Number.isFinite(xd[0])||!Number.isFinite(yd[0])){el.innerHTML='<p>No expanding solution in this range.</p>';return;}
 if(yd[0]===yd[1]){yd[0]-=1;yd[1]+=1;}else if(!ydom){const pad=(yd[1]-yd[0])*.07;yd=[yd[0]-pad,yd[1]+pad];}
 if(xd[0]===xd[1]){xd[0]-=1;xd[1]+=1;}
 const X=x=>m.l+(tx(x)-xd[0])/(xd[1]-xd[0])*iw,Y=y=>m.t+ih-(ty(y)-yd[0])/(yd[1]-yd[0])*ih;
 const expTicks=(d,count=6)=>{const step=Math.max(1,Math.ceil((d[1]-d[0])/count));let a=[];for(let i=Math.ceil(d[0]/step)*step;i<=d[1];i+=step)a.push(i);return a;};
 const xt=logx?expTicks(xd):niceTicks(...xd),yt=logy?expTicks(yd):niceTicks(...yd);
 const clip=`clip-${chartCount++}`;
 let html=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(description||ylabel+' versus '+xlabel)}"><title>${esc(description||ylabel+' versus '+xlabel)}</title><defs><clipPath id="${clip}"><rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/></clipPath></defs>`;
 bands.forEach(b=>{const x=X(b.from),x2=X(b.to);html+=`<rect x="${Math.max(m.l,x)}" y="${m.t}" width="${Math.max(0,Math.min(W-m.r,x2)-Math.max(m.l,x))}" height="${ih}" fill="${b.color}"/><text x="${(x+x2)/2}" y="12" text-anchor="middle" style="font-size:8px;letter-spacing:1.2px">${esc(b.label)}</text>`;});
 xt.forEach(t=>{const v=logx?10**t:t,x=X(v);html+=`<line class="grid" x1="${x}" x2="${x}" y1="${m.t}" y2="${m.t+ih}"/><text class="tick-label" x="${x}" y="${H-m.b+18}" text-anchor="middle">${esc(xformat?xformat(v):logx?pow10(t):fmt(v,2))}</text>`;});
 yt.forEach(t=>{const v=logy?10**t:t,y=Y(v);html+=`<line class="grid" x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}"/><text class="tick-label" x="${m.l-9}" y="${y+3}" text-anchor="end">${esc(yformat?yformat(v):logy?pow10(t):fmt(v,2))}</text>`;});
 html+=`<g clip-path="url(#${clip})">`;
 reference.forEach(r=>{if(r.x!==undefined)html+=`<line class="ref" x1="${X(r.x)}" x2="${X(r.x)}" y1="${m.t}" y2="${m.t+ih}"/>`;if(r.y!==undefined)html+=`<line class="ref" x1="${m.l}" x2="${W-m.r}" y1="${Y(r.y)}" y2="${Y(r.y)}"/>`;});
 series.forEach(s=>{let path='',pen=false;for(const [x,y]of s.points){if(!Number.isFinite(x)||!Number.isFinite(y)||(logx&&x<=0)||(logy&&y<=0)){pen=false;continue;}path+=`${pen?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)} `;pen=true;}html+=`<path d="${path}" fill="none" stroke="${s.color||COLORS.teal}" stroke-width="${s.width||2}" ${s.dash?'stroke-dasharray="5 5"':''} stroke-linejoin="round"/>`;});
 verticals.forEach(v=>{html+=`<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${m.t}" y2="${m.t+ih}" stroke="${v.color||COLORS.purple}" stroke-dasharray="3 4" stroke-width="1"/>`;});
 if(cursor&&Number.isFinite(cursor.x)){const x=X(cursor.x);html+=`<line class="cursor" x1="${x}" x2="${x}" y1="${m.t}" y2="${m.t+ih}"/>`;for(const y of cursor.ys||[])if(Number.isFinite(y)&&(!logy||y>0))html+=`<circle cx="${x}" cy="${Y(y)}" r="4" fill="${COLORS.teal}" stroke="white" stroke-width="2"/>`;}
 html+='</g>';
 verticals.forEach(v=>{const x=X(v.x);if(x>=m.l&&x<=W-m.r)html+=`<text x="${x+4}" y="${m.t+12}" style="fill:${v.color||COLORS.purple};font-size:9px">${esc(v.label)}</text>`;});
 html+=`<text class="axis-label" x="${m.l+iw/2}" y="${H-3}" text-anchor="middle">${esc(xlabel)}</text><text class="axis-label" transform="translate(12 ${m.t+ih/2}) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text></svg>`;
 el.innerHTML=html;
 const choose=e=>{const rect=el.querySelector('svg').getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*W;if(x<m.l||x>W-m.r)return;const t=xd[0]+(x-m.l)/iw*(xd[1]-xd[0]);onSelect?.(logx?10**t:t);};
 el.onpointerdown=e=>{if(e.button===0)choose(e);};el.onpointermove=e=>{if(e.buttons===1)choose(e);};
}
function paired(rangeId,numId,key,obj,callback,transform=x=>x,inverse=x=>x){
 const r=$(rangeId),num=$(numId);
 r.addEventListener('input',()=>{obj()[key]=transform(+r.value);num.value=String(obj()[key]);callback();});
 const validate=()=>{let v=Number(num.value);if(num.value===''||!Number.isFinite(v)){sync();return;}v=Math.max(+num.min,Math.min(+num.max,v));obj()[key]=v;num.value=String(v);r.value=String(inverse(v));callback();};
 num.addEventListener('change',validate);num.addEventListener('keydown',e=>{if(e.key==='Enter'){validate();num.blur();}});
 function sync(){num.value=String(obj()[key]);r.value=String(inverse(obj()[key]));}return sync;
}
const syncs=[];
for(const [id,key]of [['omega-m','m'],['omega-de','de'],['h0','h'],['w','w']])syncs.push(paired(id,`${id}-num`,key,()=>p,()=>{custom();recompute();}));
syncs.push(paired('omega-r','omega-r-num','r',()=>p,()=>{custom();recompute();},v=>10**v,v=>v>0?Math.log10(v):-7));
function custom(){$('preset').value='custom';}
$('preset').addEventListener('change',()=>{p={...PRESETS[$('preset').value],h:p.h};syncs.forEach(f=>f());recompute();});
function reset(){stop();p={...FIDUCIAL};selectedA=1;$('preset').value='lcdm';$('compare').checked=false;syncs.forEach(f=>f());recompute();}
$('reset').onclick=reset;
$('make-flat').onclick=()=>{const de=1-p.m-p.r;if(de<0){$('closure-message').textContent='Reduce matter + radiation to ≤ 1 to set non-negative dark energy.';return;}p.de=de;syncs.forEach(f=>f());custom();recompute();};
$('compare').onchange=renderFLRW;
function recompute(){hdata=history(p);currentAge=age(p);selectedA=Math.min(hdata.amax,Math.max(hdata.amin,selectedA));$('epoch').min=Math.log10(hdata.amin);$('epoch').max=Math.log10(hdata.amax);$('epoch-start-label').textContent=`EARLY BOUND · a = ${fmt(hdata.amin,3)}`;$('epoch-end-label').textContent=`LATE BOUND · a = ${fmt(hdata.amax,3)}`;$('curvature').textContent=fmt(curvature(p),5);$('closure-message').innerHTML='Ω<sub>k,0</sub> = 1 − Ω<sub>m,0</sub> − Ω<sub>r,0</sub> − Ω<sub>de,0</sub>';
 const k=curvature(p);$('geometry').textContent=Math.abs(k)<1e-8?'Spatially flat':k>0?'Open geometry · Ωk > 0':'Closed geometry · Ωk < 0';
 $('model-name').textContent=$('preset').selectedOptions[0].textContent;
 $('age').textContent=currentAge.kind==='finite'?`Age today ${fmt(currentAge.gyr,2)} Gyr`:currentAge.kind==='infinite'?'No finite Big Bang age':'Age from a = 0 undefined on this branch';
 $('q0').textContent=`q₀ = ${fmt(point(1,p).q,3)}`;
 $('warning').hidden=!hdata.limited;$('warning').textContent='E²(a) reaches zero for these parameters. Only the expanding branch connected to today is shown; the time integral near a turning point is truncated. No recollapse or bounce is evolved.';
 renderFLRW();
}
function selectA(a){stop();selectedA=Math.max(hdata.amin,Math.min(hdata.amax,a));renderFLRW();}
$('epoch').oninput=()=>selectA(10**+$('epoch').value);$('today').onclick=()=>selectA(1);
function renderFLRW(){
 const q=point(selectedA,p);if(!q)return;
 $('epoch').value=Math.log10(selectedA);$('epoch-a').textContent=fmt(selectedA,4);$('epoch-z').textContent=`z = ${fmt(1/selectedA-1,3)}`;
 $('epoch-h').innerHTML=`${fmt(q.H,2)} <small>km s⁻¹ Mpc⁻¹</small>`;$('epoch-r').innerHTML=`${fmt(q.R,2)} <small>Mpc</small>`;
 $('epoch-q').innerHTML=`${Math.abs(q.q)<1e-8?'Coasting':q.q<0?'Accelerating':'Decelerating'} <small>q = ${fmt(q.q,3)}</small>`;
 const di=q.f.slice(0,3).indexOf(Math.max(...q.f.slice(0,3)));$('epoch-dominant').innerHTML=`${['Radiation','Matter','Dark energy'][di]} <small>Ω(a) = ${fmt(q.f[di],3)}</small>`;
 if(p.m===0&&p.r===0&&p.de===0)$('epoch-dominant').innerHTML='No material fluids <small>Curvature-driven expansion</small>';
 const compare=$('compare').checked;$('baseline-key').hidden=!compare;
 const data=hdata.points,T=HUBBLE_GYR/p.h,series=(getter)=>[{points:data.map(v=>getter(v,T)),color:COLORS.teal},...(compare?[{points:baseline.points.map(v=>getter(v,baselineTime)),color:COLORS.gray,dash:true,width:1.4}]:[])];
 const tau=timeAt(selectedA,p),adom=[hdata.amin,hdata.amax];
 plot('chart-a',{series:series((v,T)=>[v.tau*T,v.a]),xlabel:'t − t₀ [Gyr]',ylabel:'Scale factor a',cursor:{x:tau*T,ys:[selectedA]},reference:[{x:0},{y:1}],description:'Scale factor versus time relative to today in Gyr',onSelect:t=>{const arr=data;let best=arr[0];for(const v of arr)if(Math.abs(v.tau*T-t)<Math.abs(best.tau*T-t))best=v;selectA(best.a);}});
 plot('chart-h',{series:series(v=>[v.a,v.E]),logx:true,logy:true,xdom:adom,xlabel:'Scale factor a',ylabel:'H(a) / H₀',cursor:{x:selectedA,ys:[q.E]},reference:[{x:1},{y:1}],onSelect:selectA,description:'Hubble rate H over H0 versus scale factor, both logarithmic'});
 plot('chart-r',{series:series(v=>[v.a,v.r]),logx:true,logy:true,xdom:adom,xlabel:'Scale factor a',ylabel:'H₀ / (aH)',cursor:{x:selectedA,ys:[q.r]},reference:[{x:1},{y:1}],onSelect:selectA,description:'Dimensionless comoving Hubble radius versus scale factor, both logarithmic'});
 plot('chart-density',{series:[COLORS.gold,COLORS.teal,COLORS.purple,COLORS.gray].map((color,i)=>({color,dash:i===3,points:data.map(v=>[v.a,Math.abs(v.terms[i])])})),logx:true,logy:true,xdom:adom,xlabel:'Scale factor a',ylabel:'Contribution to E²(a)',cursor:{x:selectedA,ys:[]},reference:[{x:1},{y:1}],onSelect:selectA,description:'Radiation, matter, dark energy and absolute curvature contributions to the squared Hubble rate'});
 const pure=$('preset').value;$('scale-insight').textContent=({radiation:'Radiation: a ∝ t½ and (aH)⁻¹ ∝ a.',matter:'Matter: a ∝ t⅔ and (aH)⁻¹ ∝ a½.',desitter:'de Sitter: a ∝ exp(Ht); H is constant.',milne:'Milne: a ∝ t; the comoving Hubble radius is constant.'})[pure]||'Matter slows expansion; sufficiently negative pressure accelerates it.';
}
const isyncs=[];
for(const key of ['epsilon','duration','logk','post'])isyncs.push(paired(key,`${key}-num`,key,()=>ip,()=>{selectedN=Math.min(selectedN,ip.duration+ip.post);renderInflation();}));
$('postw').onchange=()=>{ip.postw=+$('postw').value;renderInflation();};
$('inflation-reset').onclick=()=>{stop();ip={epsilon:.02,duration:60,logk:25,postw:1/3,post:45};selectedN=0;isyncs.forEach(f=>f());$('postw').value=String(ip.postw);renderInflation();};
function selectN(n){stop();selectedN=Math.max(0,Math.min(ip.duration+ip.post,n));renderInflation();}
$('inflation-epoch').oninput=()=>selectN(+$('inflation-epoch').value);
$('jump-exit').onclick=()=>{const c=crossings(ip);if(c.exit!==null)selectN(c.exit);};
function renderInflation(){
 const end=ip.duration+ip.post,c=crossings(ip),q=inflationPoint(selectedN,ip),inside=q.lnRatio>1e-6,cross=Math.abs(q.lnRatio)<=1e-6;
 $('inflation-epoch').max=end;$('inflation-epoch').value=selectedN;$('inflation-n').textContent=selectedN.toFixed(1);$('inflation-phase').textContent=selectedN<=ip.duration?'Inflation':ip.postw>0?'Radiation era':'Matter era';$('inflation-end-label').textContent=`END OF WINDOW · N = ${end}`;
 $('mode-status').textContent=cross?'At Hubble crossing':inside?'Inside Hubble radius':'Outside Hubble radius';$('mode-ratio').textContent=sciLog(q.lnRatio);
 $('exit-value').textContent=c.exit!==null?`N = ${c.exit.toFixed(2)}`:ip.logk<0?'Outside at start':'No exit during inflation';
 $('entry-value').textContent=c.entry!==null?`N = ${c.entry.toFixed(2)}`:'No re-entry in window';$('jump-exit').disabled=c.exit===null;
 $('crossing-heading').textContent=cross?'The scales meet.':inside?selectedN>ip.duration?(c.exit!==null||ip.logk<0?'The mode is back inside.':'The mode stays inside.'):'The mode is inside.':'The mode is outside.';
 $('crossing-copy').textContent=cross?'At k = aH, the reduced comoving scale 1/k equals the comoving Hubble radius 1/(aH).':inside?'k > aH: the reduced comoving mode scale 1/k is smaller than the comoving Hubble radius.':'k < aH: the reduced comoving mode scale 1/k is larger than the comoving Hubble radius.';
 const ns=Array.from({length:700},(_,i)=>end*i/699);ns.push(ip.duration);ns.sort((a,b)=>a-b);const vals=ns.map(n=>inflationPoint(n,ip));
 const markers=[...(c.exit!==null?[{x:c.exit,label:'exit',color:COLORS.purple}]:[]),...(c.entry!==null?[{x:c.entry,label:'re-entry',color:COLORS.purple}]:[])];
 plot('chart-inflation',{large:true,series:[{points:vals.map(v=>[v.N,v.lnR]),color:COLORS.teal,width:2.5},{points:[[0,-ip.logk],[end,-ip.logk]],color:COLORS.purple,dash:true,width:2}],xlabel:'E-folds N = ln(a / aᵢ)',ylabel:'ln(comoving scale × aᵢHᵢ)',xdom:[0,end],cursor:{x:selectedN,ys:[q.lnR]},verticals:markers,bands:[{from:0,to:ip.duration,color:'#f3eaf9',label:'INFLATION'},{from:ip.duration,to:end,color:'#fbedf4',label:ip.postw>0?'RADIATION ERA':'MATTER ERA'}],reference:[{x:ip.duration}],onSelect:selectN,description:'Log comoving Hubble radius falls during inflation then grows, crossing a fixed mode scale at the marked exit and re-entry'});
 plot('chart-inflation-h',{series:[{points:vals.map(v=>[v.N,v.lnH]),color:COLORS.purple},{points:vals.map(v=>[v.N,v.lnAH]),color:COLORS.teal}],xlabel:'E-folds N',ylabel:'Natural logarithm of ratio',xdom:[0,end],cursor:{x:selectedN,ys:[q.lnH,q.lnAH]},reference:[{x:ip.duration},{y:0}],onSelect:selectN,description:'Natural logarithms of H over initial H and aH over initial aH versus e-folds'});
}
function changeView(view){stop();active=view;for(const v of ['flrw','inflation']){$(`${v}-controls`).hidden=v!==view;$(`${v}-view`).hidden=v!==view;$(`tab-${v}`).classList.toggle('active',v===view);$(`tab-${v}`).setAttribute('aria-selected',String(v===view));$(`tab-${v}`).tabIndex=v===view?0:-1;}if(view==='inflation')renderInflation();else renderFLRW();}
$('tab-flrw').onclick=()=>changeView('flrw');$('tab-inflation').onclick=()=>changeView('inflation');$('try-inflation').onclick=()=>{changeView('inflation');document.querySelector('main').scrollIntoView({block:'start'});};$('back-flrw').onclick=()=>{changeView('flrw');document.querySelector('main').scrollIntoView({block:'start'});};
for(const tab of ['tab-flrw','tab-inflation'])$(tab).addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const v=tab==='tab-flrw'?'inflation':'flrw';changeView(v);$(`tab-${v}`).focus();}});
function stop(){playing=null;lastFrame=0;if(animationId)cancelAnimationFrame(animationId);$('play').textContent='▶';$('play').setAttribute('aria-label','Play cosmic evolution');$('inflation-play').textContent='▶';$('inflation-play').setAttribute('aria-label','Play inflation evolution');}
function play(which){if(playing===which){stop();return;}stop();playing=which;const btn=$(which==='flrw'?'play':'inflation-play');btn.textContent='Ⅱ';btn.setAttribute('aria-label','Pause evolution');if(which==='flrw'&&Math.log10(selectedA)>=+$('epoch').max-.01)selectedA=hdata.amin;if(which==='inflation'&&selectedN>=ip.duration+ip.post-.1)selectedN=0;
 function tick(ts){if(playing!==which)return;if(!lastFrame)lastFrame=ts;if(ts-lastFrame<65){animationId=requestAnimationFrame(tick);return;}const dt=Math.min(ts-lastFrame,200)/1000;lastFrame=ts;if(which==='flrw'){const l=Math.log10(selectedA)+dt*(+$('epoch').max-+$('epoch').min)/24;selectedA=10**Math.min(l,+$('epoch').max);renderFLRW();if(l>=+$('epoch').max){stop();return;}}else{selectedN=Math.min(ip.duration+ip.post,selectedN+dt*(ip.duration+ip.post)/24);renderInflation();if(selectedN>=ip.duration+ip.post){stop();return;}}animationId=requestAnimationFrame(tick);}animationId=requestAnimationFrame(tick);
}
$('play').onclick=()=>play('flrw');$('inflation-play').onclick=()=>play('inflation');document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('method-open').onclick=()=>$('method-dialog').showModal();$('method-close').onclick=()=>$('method-dialog').close();$('method-dialog').addEventListener('click',e=>{if(e.target===$('method-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('export').onclick=()=>{const rows=['# FLRW cosmology explorer; expanding branch connected to a=1',`# Omega_m0=${p.m};Omega_r0=${p.r};Omega_de0=${p.de};Omega_k0=${curvature(p)};w=${p.w};H0_km_s_Mpc=${p.h}`,'a,z,H_over_H0,H_km_s_Mpc,t_minus_t0_Gyr,comoving_Hubble_radius_Mpc,q,Omega_r_a,Omega_m_a,Omega_de_a,Omega_k_a',...hdata.points.map(v=>[v.a,1/v.a-1,v.E,v.H,v.tau*HUBBLE_GYR/p.h,v.R,v.q,...v.f].join(','))];const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='cosmology-flrw-curves.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
// Deliberate local-only state: no analytics, network requests or account data.
let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>active==='flrw'?renderFLRW():renderInflation());});
syncs.forEach(f=>f());isyncs.forEach(f=>f());recompute();
