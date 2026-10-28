import test from 'node:test';
import assert from 'node:assert/strict';
import { learningRoute } from '../../dist/electrolytes/learning-route.js';
import { cards } from '../../dist/electrolytes/data.js';

test('Every card guides through the first incomplete learning step, even when later steps are already done',()=>{
 for(const card of cards){
  for(let mask=0;mask<8;mask++){
   const prediction=!!(mask&1),observed=!!(mask&2),answered=!!(mask&4);
   const state={predictions:prediction?{[card.id]:0}:{},observed:observed?[card.id]:[],answers:answered?{[card.quiz.id]:card.quiz.answer}:{}};
   const expected=!prediction?0:!observed?1:!answered?2:card.id===12?2:3;
   const route=learningRoute(card,state);assert.equal(route.step,expected,`card ${card.id}, progress ${mask}`);assert.ok(route.title&&route.detail&&route.action);
  }
 }
});
test('An incorrect or newly changed answer keeps the student on verification',()=>{
 const card=cards[0],state={predictions:{[card.id]:0},observed:[card.id],answers:{[card.quiz.id]:(card.quiz.answer+1)%card.quiz.options.length}};
 assert.equal(learningRoute(card,state).step,2);delete state.answers[card.quiz.id];assert.equal(learningRoute(card,state).step,2);
});
test('Completed final card never offers an invalid thirteenth station',()=>{
 const card=cards.at(-1),route=learningRoute(card,{predictions:{[card.id]:0},observed:[card.id],answers:{[card.quiz.id]:card.quiz.answer}});
 assert.equal(route.step,2);assert.doesNotMatch(route.action,/13/);
});
