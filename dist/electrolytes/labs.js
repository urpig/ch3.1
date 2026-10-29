import { labProgress } from './student-guide.js';
import { conductivityLabel, qualitativeRecord } from './conductivity-feedback.js';
import { conductivity, speciate, solutions, indicator, neutralize, precipitate, crystallize, fmt, sci, bounded, ionInfo } from './core.js';
import { ionsView, phScale, label, svg } from './art.js';
import { conductScene, phScene, neutralScene, precipScene, crystalScene } from './apparatus.js';
import { escapeHTML } from '../chemistry/components.js';
import { labWorkflow } from './lab-workflow.js';
import { setupWorkbench } from './lab-ui.js';
export const defaults={
 conduct:{sample:'nacl',C:.01,loaded:true,immersed:true,powered:false,records:[]},
 indicator:{sample:'hcl',C:.01,dilution:1,kind:'btb',dropped:false,paper:false,meter:false,records:[]},
 neutral:{C0:.1,V0:20,Ct:.1,step:1,added:0,reverse:false,records:[]},
 precip:{C1:.1,V1:20,C2:.1,V2:20,partner:'calcium',mixed:false,filtered:false,records:[]},
 crystal:{mode:'pure',water:100,salt:30,other:3,dirt:2,evap:0,filtered:false,settled:false,pooled:false,separated:false,weather:'sun',records:[]}
};
export function cleanLab(type,raw){
 const d=structuredClone(defaults[type]);if(!d)return{};
 if(!raw||typeof raw!=='object')return d;
 const ranges={C:[.000001,.1],dilution:[1,10000],C0:[.001,.2],V0:[5,100],Ct:[.001,.2],step:[.1,10],added:[0,200],C1:[0,.2],C2:[0,.2],V1:[1,100],V2:[1,100],water:[10,500],salt:[0,150],other:[0,15],dirt:[0,10],evap:[0,100]};
 const enums={sample:Object.keys(solutions),kind:['btb','phenol','red','blue','universal'],partner:['calcium','nacl','water'],mode:['pure','natural'],weather:['sun','cloud']};
 for(const k of Object.keys(d)){
  if(typeof d[k]==='number'){try{d[k]=bounded(raw[k],...(ranges[k]||[0,1000]));}catch{}}
  else if(typeof d[k]==='boolean')d[k]=raw[k]===true;
  else if(typeof d[k]==='string'&&enums[k]?.includes(raw[k]))d[k]=raw[k];
 }
 d.records=Array.isArray(raw.records)?raw.records.filter(x=>x&&typeof x==='object'&&typeof x.text==='string').slice(-20).map(x=>({text:x.text.slice(0,350),category:typeof x.category==='string'?x.category.slice(0,25):'',...(typeof x.key==='string'?{key:x.key.slice(0,200)}:{}),...(typeof x.complete==='boolean'?{complete:x.complete}:{})})):[];
 if(type==='conduct'){d.loaded=true;d.immersed=true;d.records=d.records.map(qualitativeRecord);}
 if(type==='indicator'&&d.sample==='solid')d.sample='hcl';
 if(type==='crystal'&&!d.pooled){d.evap=0;d.separated=false;}
 return d;
}
function metric(title,value,unit=''){return '<div class="salt-metric"><span>'+title+'</span><strong>'+value+' <small>'+unit+'</small></strong></div>';}
let fieldSerial=0;

function field(key,title,value,min,max,step,unit=''){
 const uid='salt-control-'+(++fieldSerial);
 const presetMap={C:[.00001,.001,.01,.1],C0:[.01,.05,.1,.2],Ct:[.01,.05,.1,.2],C1:[0,.05,.1,.2],C2:[0,.05,.1,.2],dilution:[1,10,100,1000],V0:[10,20,50,100],V1:[10,20,50,100],V2:[10,20,50,100],step:[.1,.5,1,5],added:[0,10,20,40],water:[50,100,200,500],salt:[0,15,30,60],other:[0,3,5,10],dirt:[0,2,5,10],evap:[0,25,50,75,100]};
 const presets=(presetMap[key]||[]).filter(v=>v>=min&&v<=max);
 return '<div class="salt-field"><label for="'+uid+'">'+title+' <small>'+unit+'</small></label><div class="dial-value"><output data-num="'+key+'" for="'+uid+'">'+value+'</output><small>'+unit+'</small></div><input id="'+uid+'" data-range="'+key+'" type="range" min="'+min+'" max="'+max+'" step="any" data-step="'+step+'" value="'+value+'" aria-label="'+title+'滑桿"><div class="parameter-presets" role="group" aria-label="'+title+'快捷設定">'+presets.map(v=>'<button type="button" data-preset="'+key+'" data-value="'+v+'" aria-label="'+title+'設為 '+v+' '+unit+'">'+v+'</button>').join('')+'</div><span class="input-error" role="status"></span></div>';
}
function select(key,title,options,value){return '<label class="salt-select">'+title+'<select data-select="'+key+'">'+options.map(([v,t])=>'<option value="'+v+'" '+(v===value?'selected':'')+'>'+t+'</option>').join('')+'</select></label>';}
function buttons(items){return '<div class="salt-actions">'+items.map(([key,text,cls])=>'<button type="button" class="'+(cls||'secondary')+'" data-action="'+key+'">'+text+'</button>').join('')+'</div>';}
function labFrame(root,title,controls,note){root.innerHTML='<div class="lab-guide" role="status"></div><div class="salt-workbench"><div class="salt-stage"><div class="bench-label"><span>'+title+'</span><button class="text-button" data-action="zoom" aria-pressed="false">放大觀察 ⤢</button></div><div class="salt-scene"></div><div class="readouts" aria-live="off"></div><div class="lab-chart"></div><details class="micro-details"><summary>放大：追蹤看不見的粒子與物質</summary><div class="micro-view"></div></details><p class="model-note">'+note+'</p></div><aside class="salt-controls">'+controls+'<p class="action-error" role="status"></p></aside></div><div class="lab-records"><h3>我的實驗紀錄 <small>改一個條件，找出差別</small></h3><div class="record-list"></div></div>';}
function ionRows(entries){return '<div class="ion-ledger">'+entries.map(([name,n])=>'<span><b>'+name+'</b> '+sci(n)+' mol</span>').join('')+'</div>';}
export function mountLab(root,type,ctx){
 let s=cleanLab(type,ctx.data),timer=null,running=false,disposed=false,changeHandler=null,motionTimer=null;
 const $=q=>root.querySelector(q);
 const stop=()=>{if(timer)clearInterval(timer);timer=null;running=false;};
 const save=()=>{ctx.save(s);};
 const guide=t=>{if($('.lab-guide').textContent!==t)$('.lab-guide').textContent=t;};
 const record=(text,category='',key='',complete=false)=>{
  const entry={text,category,...(key?{key,complete}:{})};
  const existing=key?s.records.findIndex(r=>r.key===key):-1;
  if(existing>=0)s.records[existing]=entry;else s.records.push(entry);
  s.records=s.records.slice(-20);save();drawRecords();
  if(labProgress(type,s).done)ctx.mark();
 };
 function drawRecords(){const list=$('.record-list'),open=!!list.querySelector('details[open]'),row=(r,i)=>'<p><span>'+String(i+1).padStart(2,'0')+'</span>'+escapeHTML(r.text)+'</p>',older=s.records.slice(0,-2),recent=s.records.slice(-2);list.innerHTML=s.records.length?(older.length?'<details class="record-history" '+(open?'open':'')+'><summary>查看先前 '+older.length+' 筆紀錄</summary>'+older.map(row).join('')+'</details>':'')+'<div class="recent-records"><span class="record-caption">最近兩次觀察 · 放在一起比較</span>'+recent.map((r,i)=>row(r,older.length+i)).join('')+'</div>':'<p class="muted">'+(type==='conduct'?'選取樣本並接通刀閘開關，結果會自動記錄在這裡。':'完成操作後會自動記錄，不用另外按儲存。')+'</p>';}
 function bind(onChange){
  changeHandler=onChange;

  root.querySelectorAll('[data-num]').forEach(n=>{
   const key=n.dataset.num,r=root.querySelector('[data-range="'+key+'"]'),err=n.closest('.salt-field').querySelector('.input-error');
   function input(){try{const v=bounded(r.value,Number(r.min),Number(r.max),key);err.textContent='';n.value=Number(v.toPrecision(8));s[key]=v;onChange(key);save();}catch(error){err.textContent=error.message+'；保留前一組有效實驗值。';r.value=s[key];}}
   r.addEventListener('input',input);
   r.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const min=Number(r.min),max=Number(r.max),delta=Number(r.dataset.step),current=Number(r.value),next=e.key==='Home'?min:e.key==='End'?max:current+(['ArrowRight','ArrowUp'].includes(e.key)?delta:-delta);r.value=Number(Math.max(min,Math.min(max,next)).toPrecision(12));input();});
  });
  root.querySelectorAll('[data-select]').forEach(el=>el.onchange=()=>{s[el.dataset.select]=el.value;onChange(el.dataset.select);save();});
  root.addEventListener('click',handler);
 }
 function handler(e){const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;const a=btn.dataset.action;
  if(a==='zoom'){const active=!root.classList.contains('expanded-lab');root.classList.toggle('expanded-lab',active);btn.setAttribute('aria-pressed',String(active));btn.textContent=active?'縮回操作區 ↙':'放大觀察 ⤢';return;}
  if(root.querySelector('input:invalid')){$('.action-error').textContent='請先修正標示的數值。';return;}
  if(labWorkflow(type,s,running).disabled.includes(a))return;
  $('.action-error').textContent='';act(a);root.dataset.operation=a;clearTimeout(motionTimer);motionTimer=setTimeout(()=>{delete root.dataset.operation;},1100);save();
 }
 const opts=ids=>ids.map(id=>[id,solutions[id].name+' · '+solutions[id].formula]);
 let draw,act;
 if(type==='conduct'){
  labFrame(root,'鹽場工作台 / 導電比較',select('sample','選擇樣品',opts(['water','nacl','sugar','acetic','hcl','naoh','solid']),s.sample)+field('C','溶質濃度',s.C,.000001,.1,.001,'mol/L')+buttons([['power','開啟電源','primary']]),'低電壓電路的教學模擬。點擊刀閘開關，接通或斷開電路。結果只呈現導電狀態；蒸餾水與糖水仍可能有微量導電，但未必足以讓燈泡發亮。粒子數量為示意，不模擬電極反應。');
  draw=()=>{
   const r=conductivity(s.sample,s.C,s.loaded&&s.immersed,s.powered);
   $('.salt-scene').innerHTML=conductScene(r,{...s,id:'conductor'});
   $('.readouts').innerHTML=metric('導電結果',conductivityLabel(r,s.powered))+metric('樣品',solutions[s.sample].formula);
   $('.micro-view').innerHTML=ionsView(s.sample==='solid'?[{label:'Na⁺',charge:1,c:1},{label:'Cl⁻',charge:-1,c:1}]:r.ions,{solid:s.sample==='solid',on:s.loaded&&s.immersed&&s.powered,id:'conduct-micro',neutral:s.sample==='sugar'?'糖仍以中性分子存在，微量 H⁺、OH⁻ 來自水':s.sample==='acetic'?'多數醋酸分子仍未游離；圖中粒子數不按比例':''});
   if(!s.loaded)$('.micro-view').innerHTML='<p>先放入樣品，再觀察其中的粒子。</p>';
   $('[data-action="power"]').setAttribute('aria-pressed',String(s.powered));
   $('[data-num="C"]').disabled=['water','solid'].includes(s.sample);$('[data-range="C"]').disabled=['water','solid'].includes(s.sample);
   guide(s.powered?'觀察導電結果與燈泡反應，結果已自動記錄。':'選取樣本，點擊刀閘開關，看看能不能導電。');
  };
  act=a=>{if(a==='power'){
   s.powered=!s.powered;
   if(s.powered){const r=conductivity(s.sample,s.C);record(solutions[s.sample].name+'｜'+(s.sample==='solid'?'固態':s.sample==='water'?'純水':s.C+' mol/L')+'｜'+conductivityLabel(r),s.sample);}
  }draw();};
  bind(k=>{if(k==='sample'||k==='C'){s.loaded=true;s.immersed=true;s.powered=false;}draw();});
 }
 if(type==='indicator'){
  labFrame(root,'鹵水檢測室 / 酸鹼鑑定',select('sample','已知對照溶液',opts(['water','nacl','sugar','hcl','acetic','naoh','ammonia','carbonate']),s.sample)+field('C','原始濃度',s.C,.000001,.1,.001,'mol/L')+field('dilution','稀釋倍數',s.dilution,1,10000,1,'原體積的倍數')+select('kind','選擇指示劑',[['red','紅色石蕊試紙'],['blue','藍色石蕊試紙'],['phenol','酚酞'],['btb','BTB'],['universal','廣用指示劑']],s.kind)+buttons([['drop','滴加／蘸取指示劑','primary'],['paper','用 pH 試紙蘸取'],['meter','插入 pH 計'],['record','記錄並比較']]),'同一套 25°C 理想平衡資料驅動 pH、H⁺、OH⁻、顏色。醋酸 Ka=1.8×10⁻⁵；氨 Kb=1.8×10⁻⁵。假設指示劑量很少、不改變樣品 pH；試紙用另一份等同樣品。');
  draw=()=>{const r=speciate(s.sample,s.C,s.dilution),ind=indicator(s.kind,r.pH);
   $('.salt-scene').innerHTML=phScene(r,{...s,id:'indicator'});
   $('.readouts').innerHTML=metric('pH 計',s.meter?fmt(r.pH):'未測量')+metric('試紙約讀',s.paper?Math.round(r.pH):'未蘸取')+metric('酸鹼判讀',s.meter?(Math.abs(r.pH-7)<1e-7?'中性':r.pH<7?'酸性':'鹼性'):'待量測');
   $('.lab-chart').innerHTML=(s.dropped||s.paper||s.meter?phScale(r.pH):'')+'<p class="range-note">'+(s.dropped?ind.range+' · '+ind.label:'選擇並使用工具後，比較三種證據。')+'</p>';
   $('.micro-view').innerHTML='<div class="readouts">'+metric('有效濃度',s.sample==='water'?'純水':sci(r.C),'mol/L')+metric('[H⁺]',sci(r.H),'mol/L')+metric('[OH⁻]',sci(r.OH),'mol/L')+metric('比較',Math.abs(r.pH-7)<1e-7?'相等：中性':r.pH<7?'H⁺ > OH⁻：酸性':'H⁺ < OH⁻：鹼性')+'</div><p>水溶液中兩種離子都存在；圖與數值為理想模型。</p>';
   guide(!s.dropped?'① 先選一種指示劑，滴加或蘸取樣品。':!s.paper?'② 用另一份樣品測 pH 試紙。':!s.meter?'③ 插入 pH 計，核對顏色估讀。':'④ 改變濃度或稀釋倍數，記錄比較。');
  };
  act=a=>{
   if(a==='drop')s.dropped=true;if(a==='paper')s.paper=true;if(a==='meter')s.meter=true;
   if(s.dropped&&s.paper&&s.meter){
    const r=speciate(s.sample,s.C,s.dilution),key=[s.sample,s.C,s.dilution,s.kind].join('|');
    record(solutions[s.sample].name+'｜稀釋 '+s.dilution+' 倍｜pH '+fmt(r.pH)+'｜'+indicator(s.kind,r.pH).label,s.sample+'-'+s.dilution,key,true);
   }
   draw();
  };
  bind(k=>{if(['sample','C','dilution'].includes(k))s.dropped=s.paper=s.meter=false;if(k==='kind')s.dropped=false;draw();});
 }
 if(type==='neutral'){
  const calc=(added=s.added)=>s.reverse?neutralize(s.Ct,added,s.C0,s.V0):neutralize(s.C0,s.V0,s.Ct,added);
  const capture=()=>{const r=calc(),cat=r.acidLeft>1e-10?'acid':r.baseLeft>1e-10?'base':'equal';
   record(({acid:'酸過量',equal:'恰好中和',base:'鹼過量'}[cat])+'｜加入 '+fmt(s.added)+' mL｜pH '+fmt(r.pH)+'｜'+fmt(r.temperature)+' °C',cat,[s.reverse,s.C0,s.V0,s.Ct,s.added].join('|'),true);
  };
  const advance=()=>{const eq=s.C0*s.V0/s.Ct,next=Math.min(200,Number((s.added+s.step).toFixed(3)));
   s.added=next;if(Math.abs(s.added-eq)<1e-9)stop();
   capture();
  };
  labFrame(root,'精準工作台 / 酸鹼滴定',select('reverse','滴定方向',[['false','燒杯 HCl ← 滴入 NaOH'],['true','燒杯 NaOH ← 滴入 HCl']],String(s.reverse))+field('C0','燒杯濃度',s.C0,.001,.2,.001,'mol/L')+field('V0','燒杯初始體積',s.V0,5,100,1,'mL')+field('Ct','滴管濃度',s.Ct,.001,.2,.001,'mol/L')+field('step','每次加入體積',s.step,.1,10,.1,'mL')+field('added','累計加入體積',s.added,0,200,.1,'mL')+buttons([['drop','滴管加入一次','primary'],['play','連續滴加'],['pause','暫停'],['replay','從零重播'],['record','記錄此刻證據']]),'反應按 1：1 莫耳數計算，總體積可相加。pH 使用含水離子積的穩定公式、25°C 參考值；溫度另假設兩液初溫 25°C、密度 1 g/mL、比熱 4.18 J/(g·°C)、無散熱，放熱 57.3 kJ/mol。不模擬升溫對 Kw 的改變。');
  draw=()=>{const r=calc();
   $('.salt-scene').innerHTML=neutralScene(r,{v:s.added,reverse:s.reverse,pouring:running,id:'titration'});
   $('.readouts').innerHTML=metric('pH（25°C）',fmt(r.pH))+metric('溫度（理想）',fmt(r.temperature),'°C')+metric('已反應',fmt(r.reacted*1000,3),'mmol')+metric('酸 / 鹼初始',fmt(r.a*1000,3)+' / '+fmt(r.b*1000,3),'mmol');
   const eq=s.C0*s.V0/s.Ct,max=Math.min(200,Math.max(50,eq*1.5,s.added)),points=Array.from({length:161},(_,i)=>{const v=max*i/160,p=calc(v).pH;return (52+v/max*635)+','+(196-p/14*165);}).join(' ');
   $('.lab-chart').innerHTML='<svg viewBox="0 0 760 245" role="img" aria-label="pH 隨滴定體積變化圖"><path d="M52 26V198H690" stroke="#8c9e88" fill="none"/>'+[0,7,14].map(n=>label(30,201-n/14*165,String(n),12)).join('')+'<polyline points="'+points+'" fill="none" stroke="#537e65" stroke-width="3"/><circle cx="'+(52+Math.min(max,s.added)/max*635)+'" cy="'+(196-r.pH/14*165)+'" r="5" fill="#b27745"/>'+label(380,232,'加入體積 0 ～ '+fmt(max)+' mL',13)+label(111,23,'pH',12)+'</svg>';
   $('.micro-view').innerHTML='<p class="equation">H⁺ + OH⁻ → H₂O</p>'+ionRows([['Na⁺（旁觀）',r.Na],['Cl⁻（旁觀）',r.Cl],['剩餘酸當量',r.acidLeft],['剩餘鹼當量',r.baseLeft],['新生成水',r.waterMade]])+'<p>「剩餘當量」是反應物差額；水本身仍提供微量 H⁺、OH⁻。<br>放熱 Q = '+fmt(r.Q)+' J；ΔT = Q ÷（總質量 × 4.18）。</p>';
   $('[data-num="added"]').value=s.added;$('[data-range="added"]').value=s.added;
   guide(r.acidLeft>1e-10?'酸仍過量。觀察加入下一滴後的 pH。':r.baseLeft>1e-10?'鹼已過量。比較它與剛好等莫耳時的數據。':'等莫耳點：本例 HCl、NaOH 在 25°C 近似中性。');
   $('[data-action="play"]').disabled=running;$('[data-action="pause"]').disabled=!running;
  };
  act=a=>{if(a==='drop'){stop();advance();}
   if(a==='play'||a==='replay'){stop();if(a==='replay')s.added=0;running=true;timer=setInterval(()=>{if(disposed)return;if(root.querySelector('input:invalid')){stop();draw();return;}advance();if(s.added>=200)stop();draw();save();},500);}
   if(a==='pause')stop();
   if(a==='record'||a==='pause')capture();draw();
  };
  bind(k=>{stop();if(k==='reverse')s.reverse=s.reverse==='true';if(['C0','V0','Ct','reverse'].includes(k))s.added=0;if(k==='added')capture();draw();});
 }
 if(type==='precip'){
  const calc=()=>precipitate(s.C1,s.V1,s.C2,s.V2,s.partner);
  labFrame(root,'離子工作台 / 沉澱與過濾',field('C1','Na₂CO₃ 濃度',s.C1,0,.2,.005,'mol/L')+field('V1','Na₂CO₃ 體積',s.V1,1,100,1,'mL')+select('partner','第二份溶液',[['calcium','CaCl₂ 氯化鈣'],['nacl','NaCl 食鹽水（對照）'],['water','蒸餾水（對照）']],s.partner)+field('C2','第二份濃度',s.C2,0,.2,.005,'mol/L')+field('V2','第二份體積',s.V2,1,100,1,'mL')+buttons([['mix','傾倒、混合溶液','primary'],['filter','放入濾紙，固液分離'],['record','記錄反應結果']]),'理論上限模型：視 CaCO₃ 為難溶、反應完成，忽略少量溶解及酸鹼平衡影響；非常低濃度時不代表真實可見沉澱量。M(CaCO₃)=100.09 g/mol。過濾只分離固體，不移除溶解離子。');
  draw=()=>{const r=calc();$('.salt-scene').innerHTML=precipScene(r,{...s,id:'precipitation'});
   $('.readouts').innerHTML=metric('CaCO₃ 理論質量',s.mixed?fmt(r.mass,4):'尚未混合','g')+metric('剩餘 Ca²⁺',s.mixed?sci(r.Ca):'—','mol')+metric('剩餘 CO₃²⁻',s.mixed?sci(r.CO3):'—','mol');
   $('.micro-view').innerHTML='<p class="equation">Ca²⁺ + CO₃²⁻ → CaCO₃(s)</p>'+ionRows([['原 Ca²⁺',r.calcium],['原 CO₃²⁻',r.carbonate],['Na⁺ 旁觀',r.Na],['Cl⁻ 旁觀',r.Cl]])+(s.mixed?'<p>生成 '+sci(r.solid)+' mol CaCO₃。'+(s.filtered?'固體在濾紙上；旁觀與過量離子在濾液中。':'沉澱在杯底；其他離子仍在水中。')+'</p>':'<p>先算反應前的離子，再混合。</p>');
   $('[data-action="filter"]').disabled=!s.mixed;
   $('[data-num="C2"]').disabled=s.partner==='water';$('[data-range="C2"]').disabled=s.partner==='water';
   guide(!s.mixed?'① 先預測用量少的一方，再混合。':!s.filtered?'② 觀察杯底後，放入濾紙分離。':'③ 記錄濾紙與濾液，再改用量或換對照溶液。');
  };
  act=a=>{if(a==='mix')s.mixed=true;if(a==='filter'&&s.mixed)s.filtered=true;
   if(s.mixed&&s.filtered){const r=calc();record((s.partner==='calcium'?'CaCl₂':s.partner==='nacl'?'NaCl':'水')+' 對照｜CaCO₃ '+fmt(r.mass,4)+' g｜已過濾；溶解離子仍可留在濾液',s.partner,[s.partner,s.C1,s.V1,s.C2,s.V2].join('|'),true);}draw();
  };
  bind(()=>{s.mixed=s.filtered=false;draw();});
 }
 if(type==='crystal'){
  const calc=()=>crystallize({water:s.water,salt:s.salt,other:s.mode==='natural'?s.other:0,dirt:s.mode==='natural'?s.dirt:0,evaporated:s.water*s.evap/100,filtered:s.filtered,settled:s.settled,separated:s.separated});
  labFrame(root,'皇家試驗鹽田 / 質量守恆',select('mode','原料模式',[['pure','A · 純 NaCl 水溶液'],['natural','B · 天然鹵水（簡化）']],s.mode)+field('water','原始水量',s.water,10,500,10,'g')+field('salt','原始 NaCl',s.salt,0,150,1,'g')+field('other','其他溶解鹽（KCl代表）',s.other,0,15,.5,'g')+field('dirt','懸浮泥沙',s.dirt,0,10,.5,'g')+select('weather','天氣（速度定性示意）',[['sun','晴天'],['cloud','陰天']],s.weather)+buttons([['settle','沉降、傾取上清液'],['filter','過濾懸浮物'],['pool','送入蒸發池','primary']])+field('evap','已蒸發水量',s.evap,0,100,1,'% 原始水量')+buttons([['play','開始蒸發'],['pause','暫停'],['replay','蒸發歸零重播'],['separate','分離晶體與母液'],['record','記錄產量與限制']]),'25°C 固定溶解度近似：NaCl 36 g／100 g 水；其他鹽以 KCl 約 35 g／100 g 水代表，獨立計算、不含共離子或共結晶。沉降移除 80% 懸浮物為示意假設；過濾理想移除剩餘懸浮物。天氣只改變示意速度，不是氣象預報或真實生產時間。');
  draw=()=>{const r=calc();$('.salt-scene').innerHTML=crystalScene(r,{...s,running,id:'evaporation'});
   $('.readouts').innerHTML=metric('NaCl 固體總量',fmt(r.crystalSalt),'g')+metric('仍溶解 NaCl',fmt(r.dissolvedSalt),'g')+metric('母液',fmt(r.mother),'g')+metric('已收集晶體',fmt(r.harvest),'g');
   const saltTotal=r.crystalSalt+r.dissolvedSalt;
   $('.lab-chart').innerHTML='<div class="mass-bar"><span style="width:'+(s.salt?r.dissolvedSalt/s.salt*100:0)+'%">溶解 '+fmt(r.dissolvedSalt)+' g</span><b>晶體 '+fmt(r.crystalSalt)+' g</b></div><p class="conservation">NaCl 總量 '+fmt(saltTotal)+' g = 原先 '+fmt(s.salt)+' g</p>';
   $('.micro-view').innerHTML='<div class="readouts">'+metric('起初未溶 NaCl',fmt(r.initialSolid),'g')+metric('蒸發後新析 NaCl',fmt(r.newCrystal),'g')+metric('排出水蒸氣',fmt(r.evaporated),'g')+metric('移除懸浮物',fmt(r.removedDirt),'g')+metric('保留懸浮物',fmt(r.dirtLeft),'g')+metric('其他鹽晶體',fmt(r.crystalOther),'g')+metric('母液 NaCl 重量百分比',fmt(r.percent),'%')+metric('母液 NaCl 質量 ppm',fmt(r.ppm,0),'ppm')+'</div><p>總帳：母液 '+fmt(r.mother)+' + 晶體 '+fmt(r.crystalMass)+' + 剩餘泥沙 '+fmt(r.dirtLeft)+' + 移除泥沙 '+fmt(r.removedDirt)+' + 水蒸氣 '+fmt(r.evaporated)+' = '+fmt(r.total)+' g（原先 '+fmt(r.initial)+' g）</p><p class="safety-evidence">'+(s.mode==='natural'?'其他鹽仍溶解 '+fmt(r.dissolvedOther)+' g；乾晶體組成僅是理想模型。實際純度未知，母液夾帶與污染未測。':'純 NaCl 教學模型也不構成真實食品檢驗。')+' 品質狀態：證據不足，不能判定可食用。</p>';
   ['other','dirt'].forEach(k=>{root.querySelector('[data-num="'+k+'"]').disabled=s.mode==='pure';root.querySelector('[data-range="'+k+'"]').disabled=s.mode==='pure';});
   $('[data-num="evap"]').value=fmt(s.evap,1).replaceAll(',','');$('[data-range="evap"]').value=s.evap;
   $('[data-num="evap"]').disabled=!s.pooled;$('[data-range="evap"]').disabled=!s.pooled;
   $('[data-action="play"]').disabled=!s.pooled||running;$('[data-action="pause"]').disabled=!running;$('[data-action="separate"]').disabled=!s.pooled||r.crystalMass<=0;
   $('[data-action="filter"]').disabled=s.pooled;$('[data-action="settle"]').disabled=s.pooled;
   guide(!s.pooled?'① 檢視原料成分，選擇前處理，再送入蒸發池。':!r.crystalMass?'② 水蒸發時溶質量不變；調整失水量直到飽和。':!s.separated?'③ 晶體已析出；分離晶體與母液。':'④ 記下產量與純度限制，不能直接判定可食用。');
  };
  act=a=>{if(a==='settle'&&!s.pooled)s.settled=true;if(a==='filter'&&!s.pooled)s.filtered=true;if(a==='pool')s.pooled=true;
   if(a==='play'||a==='replay'){if(!s.pooled){guide('先把原料送入蒸發池。');return;}stop();if(a==='replay')s.evap=0;s.separated=false;running=true;timer=setInterval(()=>{if(root.querySelector('input:invalid')){stop();draw();return;}s.evap=Math.min(100,s.evap+(s.weather==='sun'?1:.4));if(s.evap>=100)stop();draw();save();},300);}
   if(a==='pause')stop();if(a==='separate'&&s.pooled&&calc().crystalMass>0){stop();s.separated=true;}
   if(a==='separate'||a==='record'){if(!s.pooled){guide('先完成原料處理與蒸發流程。');return;}const r=calc();record((s.mode==='pure'?'純 NaCl':'天然鹵水')+'｜蒸水 '+fmt(r.evaporated)+' g｜NaCl晶體 '+fmt(r.crystalSalt)+' g；其他晶體 '+fmt(r.crystalOther)+' g｜'+(s.separated?'已分離':'未分離')+'；食品證據不足',s.mode,[s.mode,s.water,s.salt,s.other,s.dirt,s.evap,s.filtered,s.settled,s.separated].join('|'),s.separated&&s.evap>0);}draw();
  };
  bind(k=>{stop();if(['mode','water','salt','other','dirt'].includes(k)){s.pooled=false;s.evap=0;s.filtered=s.settled=false;}if(k!=='weather')s.separated=false;draw();});
 }
 function syncControls(){
  root.querySelectorAll('[data-num]').forEach(n=>{n.value=s[n.dataset.num];root.querySelector('[data-range="'+n.dataset.num+'"]').value=s[n.dataset.num];});
  root.querySelectorAll('[data-select]').forEach(n=>{n.value=String(s[n.dataset.select]);});
  root.querySelectorAll('.input-error,.action-error').forEach(n=>n.textContent='');
 }
 const ui=setupWorkbench(root,type,{
  state:()=>s,
  completed:()=>ctx.completed?.()||false,
  change:(key,value)=>{stop();s[key]=value;syncControls();changeHandler(key);save();},
  reset:()=>{stop();const records=s.records;s=structuredClone(defaults[type]);s.records=records;syncControls();draw();drawRecords();save();}
 });
 const baseDraw=draw;
 draw=()=>{
  const focused=document.activeElement,focusedAction=focused?.closest('.salt-scene')=== $('.salt-scene')?focused.dataset.action:null;
  baseDraw();ui.update(s,running);
  if(focusedAction)root.querySelector('.salt-scene [data-action="'+focusedAction+'"]')?.focus({preventScroll:true});
 };
 draw();drawRecords();
 return{destroy(){disposed=true;clearTimeout(motionTimer);stop();},getState(){return structuredClone(s);}};
}

