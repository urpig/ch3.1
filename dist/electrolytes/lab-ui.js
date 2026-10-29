import { labProgress } from './student-guide.js';
import { labWorkflow } from './lab-workflow.js';
import { solutions, fmt } from './core.js';
import { escapeHTML } from '../chemistry/components.js';

const names={conduct:'導電實驗桌',indicator:'酸鹼鑑定台',neutral:'中和滴定台',precip:'沉澱分離台',crystal:'皇家試驗鹽田'};
const numbers={conduct:'01',indicator:'02',neutral:'03',precip:'04',crystal:'05'};
const advanced={conduct:['C'],indicator:['C','dilution'],neutral:['C0','V0','Ct','step','added'],precip:['C1','V1','C2','V2'],crystal:['water','salt','other','dirt']};
const icons={load:'↘',electrode:'↕',power:'⏻',drop:'↓',paper:'▤',meter:'⌁',record:'＋',play:'▷',pause:'Ⅱ',replay:'↺',mix:'↘',filter:'▽',settle:'↓',pool:'→',separate:'◇'};
export function setupWorkbench(root,type,api) {
 const $=q=>root.querySelector(q);
 root.classList.add('precision-lab');root.dataset.lab=type;
 const head=document.createElement('header');head.className='workbench-heading';
 head.innerHTML='<div><span class="bench-eyebrow">EXPERIMENT '+numbers[type]+' / 動手找證據</span><h3>'+names[type]+'</h3></div><div class="bench-utilities"><span class="virtual-badge">虛擬實驗 · 25°C</span><button type="button" data-ui="reset">↺ 重做實驗</button></div>';
 root.prepend(head);
 const steps=document.createElement('ol');steps.className='bench-steps';steps.setAttribute('aria-label','實驗操作順序');if(type!=='conduct')head.after(steps);
 $('.lab-guide').setAttribute('aria-live','off');
 $('.bench-label>span').textContent=type==='conduct'?'選取樣本 → 點擊刀閘開關 → 觀察燈泡':'點發亮的器材，完成後自動記錄';
 $('.bench-label button').textContent='⤢ 專注操作';
 const note=$('.model-note'),noteDetails=document.createElement('details');noteDetails.className='model-assumptions';
 note.before(noteDetails);noteDetails.innerHTML='<summary>查看模型假設與適用限制</summary>';noteDetails.append(note);
 const insight=document.createElement('div');insight.className='bench-insight';$('.readouts').after(insight);
 const controls=$('.salt-controls');
 const title=document.createElement('div');title.className='controls-heading';title.innerHTML='<span>實驗工具箱</span><small>一次改一個條件</small>';controls.prepend(title);
 const details=document.createElement('details');details.className='parameter-panel';
 details.innerHTML='<summary><span>調整實驗參數</span><small class="parameter-summary"></small><b>＋</b></summary><div class="parameter-fields"></div>';
 const params=details.querySelector('.parameter-fields');
 advanced[type].forEach(key=>{const field=$('[data-num="'+key+'"]')?.closest('.salt-field');if(field)params.append(field);});
 const firstActions=controls.querySelector('.salt-actions');controls.insertBefore(details,firstActions);
 // Apparatus are the main controls; keep equivalent buttons available on demand.
 if(['indicator','precip','conduct'].includes(type)){
  const alternate=document.createElement('details');alternate.className='alternate-controls';
  alternate.innerHTML='<summary>使用按鈕操作器材</summary>';firstActions.before(alternate);alternate.append(firstActions);
 }
 root.querySelectorAll('[data-action="record"]').forEach(b=>b.hidden=true);
 const progress=document.createElement('p');progress.className='experiment-goal';progress.setAttribute('role','status');head.after(progress);
 const sample=$('[data-select="sample"]');
 if(sample) {
  const rack=document.createElement('div');rack.className='sample-rack';rack.setAttribute('aria-label','選擇實驗樣品');
  rack.innerHTML=Array.from(sample.options).map(o=>'<button type="button" data-sample="'+o.value+'" aria-pressed="false"><i class="mini-vial '+(o.value==='solid'?'solid-vial':'')+'" aria-hidden="true"><span></span></i><span>'+escapeHTML(solutions[o.value].name.replace('水溶液',''))+'<small>'+escapeHTML(solutions[o.value].formula.replace('(aq)',''))+'</small></span></button>').join('');
  sample.closest('label').hidden=true;sample.closest('label').after(rack);
 }
 for(const select of root.querySelectorAll('[data-select]:not([data-select="sample"])')){
  const key=select.dataset.select,label=select.closest('label'),group=document.createElement('div');group.className='tool-picker';group.dataset.picker=key;group.setAttribute('data-glossary-skip','');
  group.innerHTML='<span>'+label.firstChild.textContent+'</span><div class="tool-choice" role="group" aria-label="'+label.firstChild.textContent+'">'+Array.from(select.options).map(o=>'<button type="button" data-choice="'+key+'" data-value="'+o.value+'">'+escapeHTML(o.textContent)+'</button>').join('')+'</div>';label.hidden=true;label.after(group);
 }
 const reason=document.createElement('p');reason.className='disabled-reason';controls.append(reason);
 if(type==='indicator') {
  const dilution=document.createElement('div');dilution.className='quick-dilution';
  dilution.innerHTML='<span>稀釋比較</span><div><button data-ui="dilute">＋ 水，稀釋 10 倍</button><button data-ui="undilute">還原濃度</button></div><small class="dilution-summary"></small>';details.before(dilution);
 }
 if(type==='neutral') {
  const dose=document.createElement('div');dose.className='dose-picker';
  dose.innerHTML='<span>每次加入多少？</span><div>'+[.1,.5,1,5].map(v=>'<button type="button" data-dose="'+v+'">'+v+' <small>mL</small></button>').join('')+'</div><small>靠近變色時，換成較小份量。</small>';details.before(dose);
 }
 const notice=document.createElement('p');notice.className='lab-announcement';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');controls.append(notice);
 root.addEventListener('click',e=>{
  const choice=e.target.closest('[data-choice]');if(choice&&!choice.disabled)api.change(choice.dataset.choice,choice.dataset.value);
  const sampleButton=e.target.closest('[data-sample]'),dose=e.target.closest('[data-dose]'),ui=e.target.closest('[data-ui]');
  if(sampleButton)api.change('sample',sampleButton.dataset.sample);
  if(dose)api.change('step',Number(dose.dataset.dose));
  const preset=e.target.closest('[data-preset]');if(preset&&!preset.disabled)api.change(preset.dataset.preset,Number(preset.dataset.value));
  if(ui?.dataset.ui==='reset'){api.reset();notice.textContent='已準備新的實驗，先前紀錄保留。';}
  if(ui?.dataset.ui==='dilute'&&!ui.disabled){api.change('dilution',Math.min(10000,api.state().dilution*10));notice.textContent='已稀釋至原體積的 '+api.state().dilution+' 倍；請重新使用指示劑、試紙與 pH 計。';}
  if(ui?.dataset.ui==='undilute'&&!ui.disabled)api.change('dilution',1);
 });
 let lastRecord=JSON.stringify(api.state().records);
 function update(s,running) {
  const flow=labWorkflow(type,s,running);root.dataset.running=String(running);const goal=labProgress(type,s);if(api.completed())goal.done=true;progress.textContent=goal.done?'✓ 本實驗的比較已完成；結果已自動記錄。':goal.text;progress.dataset.done=String(goal.done);
  root.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(String(s[b.dataset.choice])===b.dataset.value)));
  reason.textContent=type==='indicator'&&(!s.dropped||!s.paper||!s.meter)?'依序使用指示劑、試紙與 pH 計；三種證據齊全就會自動記錄。':type==='precip'&&!s.mixed?'先倒入混合，再過濾；結果會自動記錄。':type==='crystal'&&!s.pooled?'先送入蒸發池，才會開放蒸發操作。':type==='crystal'&&flow.disabled.includes('separate')&&!s.separated?'晶體析出後，就能收集。':'';
  const stepsHTML=flow.steps.map((t,i)=>'<li class="'+(i<flow.step?'done':i===flow.step?'current':'')+'" '+(i===flow.step?'aria-current="step"':'')+'><span>'+(i<flow.step?'✓':String(i+1).padStart(2,'0'))+'</span>'+t+'</li>').join('');
  if(steps.innerHTML!==stepsHTML)steps.innerHTML=stepsHTML;
  $('.lab-guide').innerHTML='<span class="step-chip">'+(type==='conduct'?'操作提示':'現在做這一步')+'</span><strong>'+flow.detail+'</strong>';
  insight.innerHTML='<span class="observation-icon" aria-hidden="true">◎</span><div><small>看見了什麼？</small><strong>'+flow.title+'</strong></div>';
  const labels={load:s.loaded?'重新放入樣品':'放入樣品',electrode:s.immersed?'提起電極':'放下電極',power:s.powered?'斷開電路':'接通電路',record:'記錄這次結果',drop:type==='neutral'?'加入 '+fmt(s.step)+' mL':s.dropped?'重新使用指示劑':'使用指示劑',paper:s.paper?'重新測試紙':'蘸取 pH 試紙',meter:s.meter?'重新量測 pH':'插入 pH 計',mix:'倒入並混合',filter:s.filtered?'已完成過濾':'過濾分離',play:type==='crystal'?'開始蒸發':'連續滴加',pause:'暫停',replay:'從零重播',settle:s.settled?'已完成沉降':'沉降泥沙',pool:'送入蒸發池',separate:s.separated?'已收集晶體':'收集晶體'};
  root.querySelectorAll('.salt-controls [data-action]').forEach(button=>{
   const a=button.dataset.action;button.textContent=labels[a]||button.textContent;button.dataset.icon=icons[a]||'';
   button.disabled=flow.disabled.includes(a);button.title=button.disabled?(reason.textContent||'這個步驟尚未就緒，請依上方提示操作。'):'';button.classList.toggle('next-action',a===flow.next&&!button.disabled);
   if(['meter','paper','drop','filter','settle','separate'].includes(a))button.classList.toggle('tool-used',!!({meter:s.meter,paper:s.paper,drop:type==='indicator'&&s.dropped,filter:s.filtered,settle:s.settled,separate:s.separated}[a]));
  });
  if(type==='conduct'){$('[data-action="power"]').setAttribute('aria-pressed',String(s.powered));}
  root.querySelectorAll('[data-sample]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sample===s.sample)));
  root.querySelectorAll('[data-dose]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.dose)===s.step)));
  $('.parameter-summary').textContent=type==='conduct'?(s.sample==='water'?'純水':s.sample==='solid'?'固態樣品':s.C+' mol/L'):type==='indicator'?s.C+' mol/L · '+s.dilution+' 倍':type==='neutral'?s.C0+' mol/L × '+s.V0+' mL':type==='precip'?s.V1+' mL ＋ '+s.V2+' mL':s.water+' g 水 · '+s.salt+' g NaCl';
  if(type==='indicator'){$('.dilution-summary').textContent='目前為原體積的 '+s.dilution+' 倍';$('[data-ui="dilute"]').disabled=s.dilution>=10000||s.sample==='water'||!s.dropped||!s.paper||!s.meter;$('[data-ui="undilute"]').disabled=s.dilution===1;$('[data-ui="dilute"]').classList.toggle('next-action',flow.next==='dilute'&&!goal.done); }
  if(type==='crystal')params.querySelectorAll('.salt-field').forEach(el=>{el.hidden=['other','dirt'].includes(el.querySelector('[data-num]').dataset.num)&&s.mode==='pure';});
  root.querySelectorAll('[data-preset]').forEach(b=>{b.disabled=!!root.querySelector('[data-range="'+b.dataset.preset+'"]').disabled;b.setAttribute('aria-pressed',String(Number(b.dataset.value)===s[b.dataset.preset]));});
  root.querySelectorAll('[data-range]').forEach(r=>{r.style.setProperty('--range-fill',((Number(r.value)-Number(r.min))/(Number(r.max)-Number(r.min))*100)+'%');});
  const targets=type==='conduct'?[
   ['power',79.7,31.3,s.powered?'斷開電路':'接通電路']
  ]:type==='indicator'?[
   ['drop',18,48,['red','blue'].includes(s.kind)?'蘸取石蕊試紙':'滴加指示劑'],['paper',16,88,'蘸取 pH 試紙'],['meter',81,45,'插入探棒']
  ]:type==='neutral'?[
   ['drop',49,53,'旋鈕 ＋'+fmt(s.step)+' mL']
  ]:type==='precip'?[
   ['mix',20,56,'倒入 →'],['filter',78,52,'放入濾紙']
  ]:[
   [!s.pooled?'pool':'separate',50,77,!s.pooled?'送入鹽池':s.separated?'✓ 已收集並記錄':'收集晶體']
  ];
  const layer=document.createElement('div');layer.className='apparatus-layer';
  layer.innerHTML=targets.map(([a,x,y,t])=>'<button type="button" class="apparatus-control '+(a===flow.next?'suggested':'')+'" data-action="'+a+'" style="left:'+x+'%;top:'+y+'%" '+(flow.disabled.includes(a)?'disabled':'')+' aria-label="器材：'+t+'">'+t+'</button>').join('');
  if(type==='conduct')layer.innerHTML='<button type="button" class="apparatus-control circuit-switch" data-action="power" aria-label="刀閘開關：'+(s.powered?'斷開電路':'接通電路')+'" aria-pressed="'+s.powered+'" title="點擊刀閘開關，'+(s.powered?'斷開':'接通')+'電路"><span class="sr-only">'+(s.powered?'斷開電路':'接通電路')+'</span></button>';
  $('.salt-scene').append(layer);
  if(JSON.stringify(s.records)!==lastRecord&&s.records.length)notice.textContent='✓ 已自動記錄。'+(goal.done?'本次比較已完成。':'換一個條件，再做比較。');
  lastRecord=JSON.stringify(s.records);
  $('.lab-records h3').innerHTML='我的證據紀錄 <span class="record-count">'+s.records.length+' 筆</span><small>改一個條件，比較兩次結果</small>';
 }
 return{update};
}
