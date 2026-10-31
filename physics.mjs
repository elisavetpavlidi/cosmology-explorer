/** Dimensionless FLRW and constant-epsilon inflation, c=1 unless converted. */
export const C = 299792.458; // km s^-1
export const HUBBLE_GYR = 977.79222168; // (Mpc / km) seconds converted to Gyr
export const FIDUCIAL = Object.freeze({m:0.315,r:0.000092,de:0.684908,w:-1,h:67.4});
export const PRESETS = {
 lcdm:{...FIDUCIAL}, radiation:{m:0,r:1,de:0,w:-1,h:67.4},
 matter:{m:1,r:0,de:0,w:-1,h:67.4}, desitter:{m:0,r:0,de:1,w:-1,h:67.4},
 milne:{m:0,r:0,de:0,w:-1,h:67.4}
};
export const curvature=p=>{const k=1-p.m-p.r-p.de;return Math.abs(k)<1e-12?0:k;};
export function terms(a,p){return [p.r/a**4,p.m/a**3,p.de*a**(-3*(1+p.w)),curvature(p)/a**2];}
export const e2=(a,p)=>terms(a,p).reduce((s,v)=>s+v,0);
export function point(a,p){
 const t=terms(a,p), s=t.reduce((a,b)=>a+b,0);
 if(!(s>0))return null;
 const E=Math.sqrt(s),q=(2*t[0]+t[1]+(1+3*p.w)*t[2])/(2*s);
 return {a,E,H:E*p.h,R:C/(a*E*p.h),r:1/(a*E),q,f:t.map(v=>v/s),terms:t};
}
export function simpson(f,l,r){const m=(l+r)/2;return (r-l)*(f(l)+4*f(m)+f(r))/6;}
export function history(p,amin=1e-6,amax=3,n=1500){
 const lo=Math.log(amin),hi=Math.log(amax);
 const us=Array.from({length:n+1},(_,i)=>lo+(hi-lo)*i/n);
 if(lo<0&&hi>0)us.push(0);
 us.sort((a,b)=>a-b);
 const raw=us.map(u=>point(Math.exp(u),p));
 const ref=us.findIndex(u=>u===0);let left=ref,right=ref;
 while(left>0&&raw[left-1]&&e2(Math.exp((us[left]+us[left-1])/2),p)>0)left--;
 while(right<us.length-1&&raw[right+1]&&e2(Math.exp((us[right]+us[right+1])/2),p)>0)right++;
 const f=u=>1/Math.sqrt(e2(Math.exp(u),p));
 raw[ref].tau=0;
 for(let i=ref+1;i<=right;i++)raw[i].tau=raw[i-1].tau+simpson(f,us[i-1],us[i]);
 for(let i=ref-1;i>=left;i--)raw[i].tau=raw[i+1].tau-simpson(f,us[i],us[i+1]);
 return {points:raw.slice(left,right+1),limited:left>0||right<us.length-1,amin:Math.exp(us[left]),amax:Math.exp(us[right])};
}
export function age(p,n=6000){
 const lo=Math.log(1e-12),du=-lo/n,f=u=>1/Math.sqrt(e2(Math.exp(u),p));
 let sum=0;
 for(let i=0;i<n;i++){
  const l=lo+i*du,r=l+du;
  if([l,(l+r)/2,r].some(u=>!(e2(Math.exp(u),p)>0)))return {kind:'branch'};
  sum+=simpson(f,l,r);
 }
 // The largest surviving power controls the a -> 0 limit.
 const powers=[[p.r,4],[p.m,3],[p.de,3*(1+p.w)],[curvature(p),2]].filter(([c])=>Math.abs(c)>1e-14);
 const max=Math.max(...powers.map(x=>x[1]));
 if(max<=1e-12)return {kind:'infinite'};
 const lead=powers.filter(x=>Math.abs(x[1]-max)<1e-12).reduce((s,x)=>s+x[0],0);
 if(!(lead>0))return {kind:'branch'};
 const tail=2/(max*Math.sqrt(lead))*Math.exp(max*lo/2);
 return {kind:'finite',tau:sum+tail,gyr:(sum+tail)*HUBBLE_GYR/p.h};
}
export function timeAt(a,p){return simpsonIntegrate(u=>1/Math.sqrt(e2(Math.exp(u),p)),0,Math.log(a));}
function simpsonIntegrate(f,l,r){const n=400,du=(r-l)/n;let s=0;for(let i=0;i<n;i++)s+=simpson(f,l+i*du,l+(i+1)*du);return s;}
/** N=ln(a/a_i). Instantaneous switch to a constant-w decelerating era. */
export function inflationPoint(N,p){
 const post=N>p.duration, A=post?(3*(1+p.postw)/2):p.epsilon;
 const lnH=post?-p.epsilon*p.duration-A*(N-p.duration):-p.epsilon*N;
 const lnAH=N+lnH;
 return {N,lnH,lnAH,lnR:-lnAH,lnRatio:p.logk-lnAH,epsilon:A};
}
export function crossings(p){
 const b=1-p.epsilon, exit=p.logk/b, endAH=b*p.duration;
 const slope=(1+3*p.postw)/2,entry=p.duration+(endAH-p.logk)/slope;
 return {exit:exit>=0&&exit<=p.duration?exit:null,entry:entry>=p.duration&&entry<=p.duration+p.post?entry:null};
}
