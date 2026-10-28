import { conductivity, speciate, neutralize, precipitate, crystallize, fmt, indicator } from './core.js';

// This state drives both the next-step prompt and available apparatus controls.
export function labWorkflow(type, s, running=false) {
 const steps={conduct:['放入樣品','接觸電極','開啟檢測','記錄比較'],indicator:['選擇樣品','觀察顏色','量測 pH','記錄比較'],neutral:['配好兩液','控制滴加','判讀過量','記錄比較'],precip:['準備兩液','倒入混合','過濾分離','記錄比較'],crystal:['處理原料','送入鹽池','蒸發析晶','收集與記錄']}[type];
 const out={steps,step:0,title:'準備開始',detail:'',next:'',disabled:[]};
 if(type==='conduct') {
  const r=conductivity(s.sample,s.C,true,s.powered);
  out.steps=[];out.next='power';
  out.title=!s.powered?'樣本已就位，接通開關看看':s.sample==='solid'?'離子被固定在晶格中':r.score<.1?'導電非常微弱':'能導電，電路中有電流通過';
  out.detail=!s.powered?'選取樣本，再點擊刀閘開關。金屬片接上另一端，就能接通電路。':s.sample==='solid'?'固態食鹽的離子不能自由移動；換成食鹽水比較。':s.sample==='sugar'?'糖分子不解離成離子。水本身的微量離子仍可能導電。':s.sample==='water'?'蒸餾水仍有極少量離子，所以不是「絕對不導電」。':'換一種樣本，再接通刀閘開關比較；每次接通都會自動記錄。導電不代表可食用。';
 }
 if(type==='indicator') {
  const r=speciate(s.sample,s.C,s.dilution),seen=s.dropped||s.paper||s.meter;
  out.step=!s.dropped?1:!s.meter||!s.paper?2:3;out.next=!s.dropped?'drop':!s.paper?'paper':!s.meter?'meter':'record';
  out.title=s.meter?(Math.abs(r.pH-7)<1e-7?'接近中性':r.pH<7?'這份樣品呈酸性':'這份樣品呈鹼性'):seen?'先看顏色，再讀數值':'三種工具，交叉確認';
  out.detail=!s.dropped?'選好指示劑，點器材觀察顏色。每種工具使用等同樣品，避免互相污染。':!s.paper?indicator(s.kind,r.pH).range+'。接著蘸取 pH 試紙，比較色卡。':!s.meter?'試紙只能估讀；接著點 pH 計探棒，取得數值。':'pH '+fmt(r.pH)+'。試試右側「稀釋 10 倍」，觀察 pH 是否往 7 靠近。';
  if(!s.meter)out.disabled.push('record');
 }
 if(type==='neutral') {
  const r=s.reverse?neutralize(s.Ct,s.added,s.C0,s.V0):neutralize(s.C0,s.V0,s.Ct,s.added);
  out.step=s.added===0||running?1:s.records.length?3:2;out.next=running?'pause':'drop';
  out.title=s.added===0?'從一小份開始滴加':r.acidLeft>1e-10?'酸仍然過量':r.baseLeft>1e-10?'鹼已經過量':'兩者恰好等莫耳';
  out.detail=s.added===0?'點滴定管旋鈕加入一份。靠近顏色轉變時，改成小份量。':'已加入 '+fmt(s.added)+' mL；HCl '+fmt(r.a*1000,3)+' mmol，NaOH '+fmt(r.b*1000,3)+' mmol。記錄酸過量、等莫耳及鹼過量三種情況。';
  if(running)out.disabled.push('play');else out.disabled.push('pause');if(s.added>=200)out.disabled.push('drop','play');
 }
 if(type==='precip') {
  const r=precipitate(s.C1,s.V1,s.C2,s.V2,s.partner);
  out.step=!s.mixed?1:!s.filtered?2:3;out.next=!s.mixed?'mix':!s.filtered?'filter':'record';
  out.title=!s.mixed?'兩份透明液體，會有變化嗎？':r.mass===0?'沒有生成碳酸鈣沉澱':s.filtered?'固體留在濾紙上':'白色固體出現了';
  out.detail=!s.mixed?'點左側燒杯，將碳酸鈉倒入第二份溶液。':s.filtered?'濾液仍含 Na⁺、Cl⁻ 或過量離子；過濾只能分離固體。':r.mass===0?'這組條件沒有足夠的 Ca²⁺ 與 CO₃²⁻ 配對。換一種溶液比較。':'理論生成 '+fmt(r.mass,4)+' g CaCO₃。點漏斗，把沉澱和溶液分開。';
  if(!s.mixed)out.disabled.push('filter','record');if(s.mixed)out.disabled.push('mix');if(s.filtered)out.disabled.push('filter');
 }
 if(type==='crystal') {
  const r=crystallize({water:s.water,salt:s.salt,other:s.mode==='natural'?s.other:0,dirt:s.mode==='natural'?s.dirt:0,evaporated:s.water*s.evap/100,filtered:s.filtered,settled:s.settled,separated:s.separated});
  out.step=!s.pooled?(s.mode==='pure'||s.filtered||s.settled?1:0):!r.crystalMass?2:3;out.next=!s.pooled?(s.mode==='natural'&&!s.filtered?'filter':'pool'):!r.crystalMass?(running?'pause':'play'):!s.separated?'separate':'record';
  out.title=!s.pooled?'先檢視原料，再送進鹽池':s.separated?'收集完成，還需要品質證據':r.crystalMass?'晶體已出現，可以收集':'水減少，鹽沒有增加';
  out.detail=!s.pooled?(s.mode==='natural'?(s.filtered?'懸浮泥沙已移除，溶解的鹽仍保留。現在把原料送入蒸發池。':'天然鹵水還有其他溶解鹽與泥沙。先過濾懸浮物，溶解的離子仍會留下。'):'純 NaCl 模式可直接送入蒸發池。改原料用量會開始一份新樣品。'):s.separated?'本次收集 '+fmt(r.harvest)+' g 晶體。外觀與結晶不能證明食品安全。':s.salt===0&&s.mode==='pure'?'這份樣品沒有鹽，蒸乾也不會長出晶體。':r.crystalMass?'NaCl 晶體 '+fmt(r.crystalSalt)+' g，仍溶解 '+fmt(r.dissolvedSalt)+' g；兩者相加等於原先用量。':'剩餘水 '+fmt(r.waterLeft)+' g。可拖曳蒸發滑桿，或播放天氣情境（速度為示意）。';
  if(!s.pooled)out.disabled.push('play','pause','replay','separate','record');else out.disabled.push('pool','filter','settle');
  if(running)out.disabled.push('play');else out.disabled.push('pause');if(s.evap>=100)out.disabled.push('play');
  if(!r.crystalMass||s.separated)out.disabled.push('separate');
 }
 return out;
}
