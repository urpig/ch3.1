import test from 'node:test';
import assert from 'node:assert/strict';
import { conductivity } from '../../dist/electrolytes/core.js';
import { cleanLab } from '../../dist/electrolytes/labs.js';
import { conductScene } from '../../dist/electrolytes/apparatus.js';
import { conductivityLabel } from '../../dist/electrolytes/conductivity-feedback.js';

test('Qualitative results distinguish no power, ionic conduction, trace conduction and solid salt',()=>{
 assert.equal(conductivityLabel(conductivity('nacl'),false),'尚未檢測');
 assert.equal(conductivityLabel(conductivity('nacl')),'能導電');
 for(const id of ['water','sugar'])assert.equal(conductivityLabel(conductivity(id)),'導電極微弱');
 assert.equal(conductivityLabel(conductivity('solid')),'不能導電');
});
test('Saved comparison records migrate to observations without losing their sample or concentration',()=>{
 const saved=cleanLab('conduct',{records:[{text:'食鹽水｜0.01 mol/L｜導電分數 44.9763',category:'nacl'},{text:'糖水｜0.01 mol/L｜導電分數 0.0095',category:'sugar'},{text:'固態氯化鈉｜固態｜導電分數 0',category:'solid'}]});
 assert.deepEqual(saved.records.map(r=>r.text),['食鹽水｜0.01 mol/L｜能導電','糖水｜0.01 mol/L｜導電極微弱','固態氯化鈉｜固態｜不能導電']);
});
test('Series circuit shows a real knife switch and lamp without a numbered meter',()=>{
 const on=conductScene(conductivity('nacl'),{loaded:true,immersed:true,powered:true}),off=conductScene(conductivity('nacl',.01,true,false),{loaded:true,immersed:true,powered:false});
 assert.match(on,/電池盒 · 3 V/);assert.match(on,/刀閘開關/);assert.match(on,/小燈泡與燈座/);assert.match(on,/已接通/);assert.match(off,/尚未檢測/);
 for(const scene of [on,off])assert.doesNotMatch(scene,/導電分數|導電比較分數|比較計|\/ 100|NaN|undefined/);
 assert.notEqual(on,off);
});
