import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { cleanState } from '../../dist/electrolytes/app.js';
import { labProgress } from '../../dist/electrolytes/student-guide.js';
import { cleanLab, defaults } from '../../dist/electrolytes/labs.js';

test('Legacy completed observations restore the checklist without erasing other progress',()=>{
 const s=cleanState({version:1,observed:[1,3,4,6,8,11],explored:{1:[],3:[0]},predictions:{1:1},answers:{q1:1}});
 for(const [id,n] of [[1,3],[3,6],[4,4],[6,4],[8,5]])assert.deepEqual(s.explored[id],Array.from({length:n},(_,i)=>i));
 assert.equal(s.steps[3],1);assert.equal(s.steps[11],7);assert.equal(s.predictions[1],1);assert.equal(s.answers.q1,1);
 assert.deepEqual(cleanState(JSON.parse(JSON.stringify(s))),s);
});
test('Incomplete observations are not silently upgraded by migration',()=>{
 const s=cleanState({version:1,explored:{1:[0]}});assert.deepEqual(s.explored[1],[0]);assert.equal(s.observed.length,0);
});
test('Repeated pH measurements of the same condition do not complete a comparison',()=>{
 const r={text:'pH 2',category:'hcl-1',key:'hcl|0.01|1|btb',complete:true};
 assert.equal(labProgress('indicator',{records:[r,r]}).done,false);
 assert.equal(labProgress('indicator',{records:[r,{...r,key:'hcl|0.01|10|btb'}]}).done,true);
 assert.equal(labProgress('indicator',{records:[r,{...r,key:'different',complete:false}]}).done,false);
});
test('Auto-record evidence survives sanitizing and storage round trip',()=>{
 const s={...structuredClone(defaults.indicator),records:[{text:'pH 2',category:'hcl-1',key:'hcl|0.01|1|btb',complete:true}]};
 assert.deepEqual(cleanLab('indicator',JSON.parse(JSON.stringify(s))),s);
});
test('Precipitation needs a filtered calcium experiment and a filtered control',()=>{
 const r={text:'已過濾',category:'calcium',complete:true};
 assert.equal(labProgress('precip',{records:[r,r]}).done,false);
 assert.equal(labProgress('precip',{records:[r,{text:'未過濾',category:'nacl'}]}).done,false);
 assert.equal(labProgress('precip',{records:[r,{...r,category:'nacl'}]}).done,true);
});
test('Titration completion requires acid, equivalence, and base evidence',()=>{
 assert.equal(labProgress('neutral',{records:[{category:'acid'},{category:'base'}]}).done,false);
 assert.equal(labProgress('neutral',{records:[{category:'acid'},{category:'equal'},{category:'base'}]}).done,true);
});

test('Hosted entry keeps anchors local and all script and stylesheet paths resolve',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(Buffer.byteLength(html)<20000);assert.doesNotMatch(html,/<base /);
 const files=[...html.matchAll(/(?:src|href)="(\.\/dist\/[^"]+)"/g)].map(m=>m[1]);
 assert.ok(files.length>=7);for(const file of files)assert.ok(fs.existsSync(file.split('?')[0]),file);
});
