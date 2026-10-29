import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { cards } from '../../dist/electrolytes/data.js';
const KEY='k12-electrolytes-salt-v1';
const html=fs.readFileSync(new URL('../../release/salt-adventure.html',import.meta.url),'utf8').replace(/<style>[\s\S]*?<\/style>/g,'');
function boot(saved){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='css-parsing')errors.push(e.message);});
 const dom=new JSDOM(html,{url:'https://urpig.github.io/ch3.1/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.structuredClone=structuredClone;w.IntersectionObserver=class{observe(){} disconnect(){}};w.HTMLElement.prototype.scrollIntoView=function(){};
 if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));
 w.eval(w.document.querySelector('script').textContent);
 const q=s=>{const el=w.document.querySelector(s);assert.ok(el,'Missing '+s);return el;};
 return {dom,w,q,errors,state:()=>JSON.parse(w.localStorage.getItem(KEY)),close:()=>w.close()};
}
function click(b,s){const e=b.q(s);assert.notEqual(e.disabled,true,'Disabled '+s);e.click();}
const action=(b,id,a)=>click(b,`#salt-${id} .salt-scene [data-action="${a}"]`);
function measure(b){for(const a of ['drop','paper','meter'])action(b,5,a);}

test('New student completes all twelve stations using controls and earns the certificate',()=>{
 const b=boot();try{
  for(const c of cards)click(b,`#salt-${c.id} .prediction input[value="0"]`);
  for(let i=0;i<3;i++)click(b,`#salt-1 [data-bottle="${i}"]`);
  action(b,2,'power');click(b,'#salt-2 [data-sample="sugar"]');action(b,2,'power');
  for(const id of ['solid','nacl','sugar','hcl','naoh','acetic'])click(b,`#salt-3 [data-sample="${id}"]`);
  click(b,'#salt-3 [data-electric]');
  for(let i=0;i<4;i++){click(b,`#salt-4 [data-study="${i}"]`);click(b,'#salt-4 [data-reaction-state="after"]');}
  measure(b);assert.equal(b.state().labs.indicator.records.length,1);
  action(b,5,'meter');assert.equal(b.state().labs.indicator.records.length,1,'Repeated reading is not a second condition');
  assert.equal(b.state().observed.includes(5),false);
  click(b,'#salt-5 [data-ui="dilute"]');assert.equal(b.state().labs.indicator.meter,false);assert.match(b.q('#salt-5 .readouts').textContent,/未測量/);
  measure(b);assert.equal(b.state().labs.indicator.records.length,2);assert.equal(b.state().observed.includes(5),true);
  for(let i=0;i<4;i++)click(b,`#salt-6 [data-study="${i}"]`);
  click(b,'#salt-7 [data-dose="5"]');for(let i=0;i<5;i++)action(b,7,'drop');
  assert.deepEqual([...new Set(b.state().labs.neutral.records.map(r=>r.category))],['acid','equal','base']);
  for(let i=0;i<5;i++)click(b,`#salt-8 [data-study="${i}"]`);
  action(b,9,'mix');action(b,9,'filter');click(b,'#salt-9 [data-choice="partner"][data-value="nacl"]');action(b,9,'mix');action(b,9,'filter');
  action(b,10,'pool');click(b,'#salt-10 [data-preset="evap"][data-value="50"]');action(b,10,'separate');
  assert.equal(b.state().labs.crystal.records.length,1);
  for(let i=0;i<3;i++){const d=b.q(`#salt-11 [data-report="${i}"]`);d.open=true;d.dispatchEvent(new b.w.Event('toggle'));}
  click(b,'#salt-12 [data-handover]');
  for(const c of cards){click(b,`#salt-${c.id} .salt-quiz input[value="${c.quiz.answer}"]`);b.q(`#salt-${c.id} .salt-quiz`).dispatchEvent(new b.w.Event('submit',{bubbles:true,cancelable:true}));}
  assert.equal(b.state().observed.length,12);assert.equal(b.q('#progress-count').textContent,'12 / 12');assert.equal(b.q('#certificate').hidden,false);assert.deepEqual(b.errors,[]);
 }finally{b.close();}
});

test('Reload and legacy migration keep visible checklists and chapter progress consistent',()=>{
 const b=boot({version:1,observed:[1,3,7],predictions:{1:1},answers:{q1:1}});
 try{assert.equal(b.q('#salt-1 .explore-status').textContent,'已查看 3 / 3 份採樣紀錄');assert.equal(b.w.document.querySelectorAll('#salt-1 .bottle-line .seen').length,3);assert.equal(b.q('#salt-1 .card-progress-label').textContent,'3 / 3 完成');assert.equal(b.q('#salt-3 [data-electric]').textContent,'關閉電場');assert.equal(b.q('#salt-7 .experiment-goal').dataset.done,'true');assert.deepEqual(b.errors,[]);}finally{b.close();}
});

test('Redo preserves comparisons, card reset clears only its own progress, and actions still work',()=>{
 const b=boot();try{
  measure(b);click(b,'#salt-5 [data-ui="dilute"]');measure(b);
  action(b,2,'power');
  click(b,'#salt-5 [data-ui="reset"]');assert.equal(b.state().labs.indicator.records.length,2);assert.equal(b.state().labs.indicator.meter,false);
  click(b,'#salt-5 .reset-card');assert.equal(b.state().observed.includes(5),false);assert.equal(b.state().labs.indicator.records.length,0);assert.equal(b.state().labs.conduct.records.length,1);
  measure(b);assert.equal(b.state().labs.indicator.records.length,1);assert.deepEqual(b.errors,[]);
 }finally{b.close();}
});

test('Changing concentration invalidates readings without erasing recorded evidence',()=>{
 const b=boot();try{
  measure(b);click(b,'#salt-5 [data-preset="C"][data-value="0.1"]');
  assert.equal(b.state().labs.indicator.meter,false);assert.equal(b.state().labs.indicator.paper,false);assert.equal(b.state().labs.indicator.dropped,false);
  assert.equal(b.state().labs.indicator.records.length,1);measure(b);assert.equal(b.state().labs.indicator.records.length,2);
  assert.deepEqual(b.errors,[]);
 }finally{b.close();}
});
