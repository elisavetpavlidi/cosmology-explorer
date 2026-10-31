import assert from 'node:assert/strict';
import {FIDUCIAL,PRESETS,curvature,e2,point,history,age,timeAt,inflationPoint,crossings,HUBBLE_GYR} from './physics.mjs';
let checks=0;
function near(actual,expected,tolerance,message){assert.ok(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} != ${expected}`);checks++;}
function ok(value,message){assert.ok(value,message);checks++;}
for(const [name,p]of Object.entries(PRESETS)){
 near(e2(1,p),1,1e-12,`${name} closure at today`);
 near(point(1,p).H,p.h,1e-10,`${name} H(today)`);
 near(point(1,p).f.reduce((a,b)=>a+b,0),1,1e-12,`${name} fractional closure`);
 const hs=history(p);ok(hs.points.every(v=>Number.isFinite(v.E)&&Number.isFinite(v.tau)),`${name} finite history`);
 ok(hs.points.every((v,i,a)=>!i||v.tau>a[i-1].tau),`${name} time monotonic`);
}
near(age(PRESETS.radiation).tau,.5,1e-9,'Radiation age');near(age(PRESETS.matter).tau,2/3,1e-9,'Matter age');near(age(PRESETS.milne).tau,1,1e-9,'Milne age');ok(age(PRESETS.desitter).kind==='infinite','de Sitter infinite past');
for(const a of [.001,.1,.5,2,3]){
 near(point(a,PRESETS.radiation).E,a**-2,1e-8,'Radiation H(a)');
 near(point(a,PRESETS.matter).E,a**-1.5,1e-8,'Matter H(a)');
 near(point(a,PRESETS.radiation).r,a,1e-12,'Radiation comoving Hubble radius');
 near(point(a,PRESETS.matter).r,Math.sqrt(a),1e-12,'Matter comoving Hubble radius');
 near(timeAt(a,PRESETS.matter),2/3*(a**1.5-1),1e-8,'Matter time integral');
 near(timeAt(a,PRESETS.radiation),.5*(a*a-1),1e-8,'Radiation time integral');
 near(timeAt(a,PRESETS.desitter),Math.log(a),1e-10,'de Sitter time integral');
 near(point(a,PRESETS.milne).q,0,1e-12,'Milne coasting');
}
const ml={...FIDUCIAL,r:0,de:.685};const analytic=2/(3*Math.sqrt(ml.de))*Math.asinh(Math.sqrt(ml.de/ml.m));near(age(ml).tau,analytic,1e-9,'Flat matter Lambda analytic age');
near(age(FIDUCIAL).gyr,13.7917,.005,'Fiducial plausible age');near(point(1,FIDUCIAL).q,-.527316,1e-6,'Fiducial acceleration');
const hi=history(FIDUCIAL);for(const v of hi.points.filter((_,i)=>i%100===0))near(v.tau,timeAt(v.a,FIDUCIAL),1e-8,'History integration versus independent grid');
const bad={m:0,r:0,de:1.5,w:-1,h:67.4};ok(history(bad).limited,'Bounce branch is clipped');ok(age(bad).kind==='branch','Disconnected past does not yield Big Bang age');ok(history(bad).points.every(v=>v.a>Math.sqrt(1/3)),'Only today-connected expanding branch');
const ip={epsilon:.02,duration:60,logk:25,postw:1/3,post:45};const c=crossings(ip);near(c.exit,25/.98,1e-12,'Analytic exit');near(c.entry,93.8,1e-12,'Analytic re-entry');
near(inflationPoint(c.exit,ip).lnRatio,0,1e-10,'k=aH at exit');near(inflationPoint(c.entry,ip).lnRatio,0,1e-10,'k=aH at re-entry');
near(inflationPoint(60-1e-8,ip).lnH,inflationPoint(60+1e-8,ip).lnH,1e-7,'H continuous across transition');
ok(crossings({...ip,logk:70}).exit===null,'No exit outside inflation interval');ok(crossings({...ip,epsilon:.9}).exit===null,'Slow shrink can prevent exit');ok(crossings({...ip,post:10}).entry===null,'Re-entry beyond window suppressed');ok(crossings({...ip,logk:-2}).exit===null,'Already outside at initial time');
const mat={...ip,postw:0,post:100};near(crossings(mat).entry,127.6,1e-10,'Matter re-entry slope');
near(inflationPoint(10,{...ip,epsilon:0}).lnH,0,1e-12,'de Sitter inflation H constant');
near(inflationPoint(10,ip).lnR,-9.8,1e-10,'Inflation radius shrink');
near(curvature(FIDUCIAL),0,1e-12,'Fiducial flat closure');
for(const a of [1e-6,.001,.1,1,3]){
 const v=point(a,FIDUCIAL);near(v.f.reduce((x,y)=>x+y,0),1,1e-12,'Omega closure at each epoch');
 near(v.f[0]/v.f[1],FIDUCIAL.r/(FIDUCIAL.m*a),1e-9,'Radiation to matter Omega ratio');
}
near(point(1,FIDUCIAL).f[1],FIDUCIAL.m,1e-12,'Present matter Omega');
near(point(1,FIDUCIAL).f[2],FIDUCIAL.de,1e-12,'Present dark energy Omega');
ok(point(1e-6,FIDUCIAL).f[0]>.99,'Early radiation domination');
ok(point(3,FIDUCIAL).f[2]>.98,'Future dark energy domination');
ok(point(1,{...FIDUCIAL,m:.4,de:.8}).f[3]<0,'Signed negative curvature retained');
console.log(`PASS: ${checks} cosmology checks (analytic limits, integration, branch handling, crossing and continuity).`);
