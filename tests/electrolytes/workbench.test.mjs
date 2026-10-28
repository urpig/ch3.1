import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,cleanLab } from '../../dist/electrolytes/labs.js';
import { labWorkflow } from '../../dist/electrolytes/lab-workflow.js';
import { conductivity,speciate,neutralize,precipitate,crystallize } from '../../dist/electrolytes/core.js';
import { conductScene,phScene,neutralScene,precipScene,crystalScene } from '../../dist/electrolytes/apparatus.js';
const fresh=t=>structuredClone(defaults[t]);
test('Conductivity starts ready for power without preparation steps',()=>{
 const s=fresh('conduct');assert.equal(s.loaded,true);assert.equal(s.immersed,true);assert.equal(s.powered,false);
 assert.equal(labWorkflow('conduct',s).next,'power');assert.deepEqual(labWorkflow('conduct',s).steps,[]);assert.deepEqual(labWorkflow('conduct',s).disabled,[]);
 assert.equal(conductivity(s.sample,s.C,s.loaded&&s.immersed,s.powered).score,0);
 s.powered=true;assert.ok(conductivity(s.sample,s.C,s.loaded&&s.immersed,s.powered).score>0);
});
test('Legacy partial preparation becomes ready without losing comparisons',()=>{
 const s=cleanLab('conduct',{sample:'sugar',C:.001,loaded:false,immersed:false,powered:false,records:[{text:'earlier result',category:'nacl'}]});
 assert.equal(s.loaded,true);assert.equal(s.immersed,true);assert.equal(s.powered,false);assert.equal(s.sample,'sugar');assert.equal(s.C,.001);assert.equal(s.records.length,1);
 assert.equal(labWorkflow('conduct',s).next,'power');
});
test('Powered off apparatus says unmeasured instead of an insulating sample',()=>{
 const s=fresh('conduct');assert.match(conductScene(conductivity(s.sample,s.C,true,false),s),/尚未檢測/);
 s.powered=true;assert.match(conductScene(conductivity(s.sample,s.C,true,true),s),/能導電/);
});
test('Sugar and solid salt receive distinct scientific observation feedback',()=>{
 const s={...fresh('conduct'),loaded:true,immersed:true,powered:true,sample:'sugar'};
 assert.match(labWorkflow('conduct',s).detail,/不解離/);
 s.sample='solid';assert.match(labWorkflow('conduct',s).title,/晶格/);
 assert.equal(conductivity('solid').score,0);
});
test('Indicator workflow follows used instruments and requires a measured pH',()=>{
 const s=fresh('indicator');assert.ok(labWorkflow('indicator',s).disabled.includes('record'));
 s.dropped=true;assert.equal(labWorkflow('indicator',s).next,'paper');
 s.paper=true;assert.equal(labWorkflow('indicator',s).next,'meter');
 s.meter=true;assert.equal(labWorkflow('indicator',s).next,'record');
 s.dilution=10;assert.match(labWorkflow('indicator',s).detail,/pH 3[。]/);
});
test('Indicator observation distinguishes acid, neutral salt, and carbonate base',()=>{
 const s={...fresh('indicator'),meter:true};
 assert.match(labWorkflow('indicator',s).title,/酸性/);
 s.sample='nacl';assert.match(labWorkflow('indicator',s).title,/中性/);
 s.sample='carbonate';assert.match(labWorkflow('indicator',s).title,/鹼性/);
});
test('Titration guidance distinguishes acid, exact equivalence and base excess',()=>{
 const s=fresh('neutral');s.added=19;assert.match(labWorkflow('neutral',s).title,/酸/);
 s.added=20;assert.match(labWorkflow('neutral',s).title,/等莫耳/);
 s.added=20.1;assert.match(labWorkflow('neutral',s).title,/鹼/);
 s.reverse=true;assert.match(labWorkflow('neutral',s).title,/酸/);
});
test('Continuous titration has mutually exclusive play/pause and stops at capacity',()=>{
 const s=fresh('neutral');assert.ok(labWorkflow('neutral',s).disabled.includes('pause'));
 assert.ok(labWorkflow('neutral',s,true).disabled.includes('play'));
 s.added=200;assert.ok(labWorkflow('neutral',s).disabled.includes('drop'));
 assert.ok(labWorkflow('neutral',s).disabled.includes('play'));
});
test('Precipitation requires mixing before filtration and cannot pour twice',()=>{
 const s=fresh('precip');assert.ok(labWorkflow('precip',s).disabled.includes('filter'));
 s.mixed=true;assert.equal(labWorkflow('precip',s).next,'filter');assert.ok(labWorkflow('precip',s).disabled.includes('mix'));
 s.filtered=true;assert.match(labWorkflow('precip',s).detail,/濾液仍含/);
 assert.equal(labWorkflow('precip',s).next,'record');
});
test('A sodium chloride control does not claim a calcium carbonate precipitate',()=>{
 const s={...fresh('precip'),mixed:true,partner:'nacl'};
 assert.match(labWorkflow('precip',s).title,/沒有生成/);
});
test('Saltfield cannot evaporate an unloaded pond or collect absent crystals',()=>{
 const s=fresh('crystal');assert.ok(labWorkflow('crystal',s).disabled.includes('play'));
 s.pooled=true;assert.ok(labWorkflow('crystal',s).disabled.includes('separate'));
 s.evap=50;assert.equal(labWorkflow('crystal',s).next,'separate');assert.match(labWorkflow('crystal',s).detail,/12 g/);
 s.separated=true;assert.equal(labWorkflow('crystal',s).next,'record');assert.match(labWorkflow('crystal',s).detail,/不能證明食品安全/);
});
test('Natural brine asks for pretreatment; zero-salt water does not promise crystals',()=>{
 const s={...fresh('crystal'),mode:'natural'};assert.equal(labWorkflow('crystal',s).next,'filter');
 s.filtered=true;assert.equal(labWorkflow('crystal',s).next,'pool');
 s.mode='pure';s.salt=0;s.pooled=true;s.evap=100;assert.match(labWorkflow('crystal',s).detail,/不會長出晶體/);
 assert.ok(labWorkflow('crystal',s).disabled.includes('play'));
});
test('Saved and restored experiment state preserves valid parameters and records',()=>{
 const s={...fresh('neutral'),reverse:true,added:20.1,step:.1,records:[{text:'saved comparison',category:'base'}]};
 assert.deepEqual(cleanLab('neutral',JSON.parse(JSON.stringify(s))),s);
});
test('All redesigned apparatus render finite accessible scenes at edge conditions',()=>{
 const scenes=[
  conductScene(conductivity('solid'),{loaded:true,sample:'solid',immersed:true,powered:true}),
  phScene(speciate('carbonate',.1),{dropped:true,paper:true,meter:true}),
  neutralScene(neutralize(.1,20,.1,200),{v:200,pouring:true}),
  precipScene(precipitate(0,1,0,1),{mixed:true,filtered:true,V1:1,V2:1}),
  crystalScene(crystallize({water:100,salt:30,evaporated:100,separated:true}),{pooled:true,separated:true})
 ];
 for(const scene of scenes){assert.match(scene,/role="img" aria-label="/);assert.doesNotMatch(scene,/NaN|undefined|Infinity/);}
});
test('Saltfield scene shows an empty pool before loading and collected solids after separation',()=>{
 const r=crystallize({water:100,salt:30,evaporated:50,separated:true});
 assert.match(crystalScene(r,{pooled:false}),/尚未裝入/);
 assert.match(crystalScene(r,{pooled:true,separated:true}),/已收集 12 g/);
});
