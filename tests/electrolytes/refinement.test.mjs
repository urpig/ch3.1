import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanState } from '../../dist/electrolytes/app.js';
import { reactionIllustration, saltSpecimen } from '../../dist/electrolytes/lesson-art.js';
import { salts } from '../../dist/electrolytes/data.js';

test('Exploration progress restores only unique, valid observations for the correct card',()=>{
 const state=cleanState({version:1,explored:{1:[0,0,2,3,-1,'1'],3:[0,5,6],4:[0,3,4],6:[3,99],8:[4,5],999:[0]}});
 assert.deepEqual(state.explored,{1:[0,2],3:[0,5],4:[0,3],6:[3],8:[4]});
});
test('Calcium oxide illustrates heating without falsely generating gas bubbles',()=>{
 const before=reactionIllustration(2,false),after=reactionIllustration(2,true);
 assert.doesNotMatch(after,/class="study-bubble"/);
 assert.match(after,/放熱，溫度升高/);assert.notEqual(before,after);
});
test('Gas-generating observations show bubbles only after the reaction',()=>{
 for(const i of [0,1,3]){
  assert.doesNotMatch(reactionIllustration(i,false),/class="study-bubble"/);
  assert.match(reactionIllustration(i,true),/class="study-bubble"/);
 }
});
test('All five specimen bottles identify their contents and render finite labelled illustrations',()=>{
 salts.forEach(([name,formula],i)=>{const image=saltSpecimen(i,name,formula);assert.ok(image.includes(name));assert.ok(image.includes(formula));assert.match(image,/role="img" aria-label="/);assert.doesNotMatch(image,/NaN|undefined|Infinity/);});
});
