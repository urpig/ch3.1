import { conductivityLabel } from './conductivity-feedback.js';
import { svg, beaker, label } from './art.js';
import { fmt, indicator, solutions } from './core.js';

function plaque(x,y,w,title,sub=''){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="45" rx="6" fill="#fffdf2" stroke="#d3dac8"/>'+label(x+w/2,y+18,title,12)+(sub?label(x+w/2,y+34,sub,10,'#87917b'):'');}
function ruler(x,y,h,n=5){return Array.from({length:n*2+1},(_,i)=>'<path d="M'+x+' '+(y+i*h/(n*2))+'h'+(i%2?8:15)+'" stroke="#91aa9b" stroke-width="1"/>').join('');}
function shadow(x,y,w){return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+w+'" ry="10" fill="#315240" opacity=".08"/>';}
function meter(x,y,w,title,value,sub){return shadow(x+w/2,y+101,w*.5)+'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="99" rx="12" fill="#345c4b" stroke="#254638"/><path d="M'+(x+8)+' '+(y+9)+'h'+(w-16)+'" stroke="#a6c1a3" opacity=".3"/><rect x="'+(x+13)+'" y="'+(y+17)+'" width="'+(w-26)+'" height="48" rx="4" fill="#e4eccd"/>'+label(x+w/2,y+10,title,9,'#cedac5')+label(x+w/2,y+49,value,25,'#304e3a')+label(x+w/2,y+84,sub,10,'#d8e1cd');}

export function conductScene(r,{loaded=false,immersed=false,powered=false,sample='nacl',id='conduct'}={}){
 const result=conductivityLabel(r,powered),lit=powered&&r.score>.1,ey=immersed?211:179;
 let body='<defs><radialGradient id="'+id+'-glow"><stop stop-color="#ffe7a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe7a0" stop-opacity="0"/></radialGradient></defs>';
 // The two cells, lamp, knife switch and immersed electrodes form one series circuit.
 body+='<path d="M222 95H264Q285 95 285 126V158Q285 165 350 165M430 165H473Q495 165 495 136H546M650 136H699V218H425V'+ey+'M222 153H247V218H333V'+ey+'" fill="none" stroke="#344e47" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><path d="M222 95H264Q285 95 285 126V158Q285 165 350 165M430 165H473Q495 165 495 136H546M650 136H699V218H425V'+ey+'" fill="none" stroke="#b66e58" stroke-width="3" stroke-linejoin="round"/>';
 body+='<g filter="url(#'+id+'-shadow)"><rect x="42" y="60" width="180" height="126" rx="13" fill="#3e514b" stroke="#2d423b"/><rect x="51" y="71" width="160" height="100" rx="8" fill="#263d35"/>';
 for(let i=0;i<2;i++){const y=79+i*43;body+='<rect x="65" y="'+y+'" width="132" height="34" rx="8" fill="url(#'+id+'-metal)" stroke="#8b9b91"/><rect x="'+(i?159:66)+'" y="'+(y+1)+'" width="37" height="32" rx="6" fill="#b78355"/><path d="M'+(i?202:58)+' '+(y+10)+'v14" stroke="#dce2d5" stroke-width="4"/>'+label(129,y+22,'AA · 1.5 V',11,'#f5f4df')+label(i?181:81,y+22,'＋',12,'#fff6e8');}
 body+='</g><circle cx="222" cy="95" r="6" fill="#b47155"/><circle cx="222" cy="153" r="6" fill="#253e36"/>'+label(132,43,'電池盒 · 3 V',14)+label(237,94,'＋',12,'#ad6750')+label(235,171,'−',15,'#536c64');
 if(lit)body+='<circle cx="390" cy="103" r="65" fill="url(#'+id+'-glow)" opacity="'+(.3+r.lamp*.65)+'"/>';
 body+='<path d="M377 128C375 113 359 112 359 92A31 31 0 1 1 421 92C421 111 406 115 403 128Z" fill="'+(lit?'#f6dfa0':'#e1ebe0')+'" fill-opacity=".78" stroke="#8d9e8e" stroke-width="2"/><path d="M375 76Q367 86 370 97" fill="none" stroke="#fffdf5" stroke-width="5" stroke-linecap="round"/><path d="M382 127V105l5-7 6 6 6-6 3 7v22" fill="none" stroke="'+(lit?'#ce873a':'#8c8a72')+'" stroke-width="2"/><rect x="376" y="127" width="28" height="22" rx="3" fill="url(#'+id+'-metal)" stroke="#8e9b8d"/><path d="M377 133h26m-26 7h26" stroke="#74877a"/><rect x="349" y="150" width="82" height="33" rx="8" fill="#eee9d8" stroke="#b8b49c"/><circle cx="350" cy="165" r="5" fill="#a28a65"/><circle cx="430" cy="165" r="5" fill="#a28a65"/>'+label(390,43,'小燈泡與燈座',14);
 body+='<g class="physical-switch"><rect x="523" y="89" width="164" height="94" rx="10" fill="#e4d4b3" stroke="#ad9876" stroke-width="2" filter="url(#'+id+'-shadow)"/><path d="M530 98h149" stroke="#f9efd9" stroke-width="2"/>';
 for(const x of [535,675])for(const y of [100,172])body+='<circle cx="'+x+'" cy="'+y+'" r="3" fill="#988b73"/><path d="M'+(x-2)+' '+y+'h4" stroke="#d8ccb2"/>';
 body+='<rect x="536" y="126" width="20" height="22" rx="3" fill="#b7924b" stroke="#937334"/><rect x="640" y="126" width="20" height="22" rx="3" fill="#b7924b" stroke="#937334"/><path class="switch-lever" d="M546 136L'+(powered?'650 136':'626 105')+'" stroke="url(#'+id+'-metal)" stroke-width="9" stroke-linecap="round"/><path d="M'+(powered?'592 136h30':'582 122l29-11')+'" stroke="#436150" stroke-width="13" stroke-linecap="round"/><circle cx="546" cy="136" r="6" fill="#c6af72" stroke="#927941"/>'+label(605,77,'刀閘開關',14)+label(605,204,powered?'已接通 · 點此斷開':'點擊開關，接通電路',13,'#456b4b')+'</g>';
 body+=beaker(id,277,247,204,134,'#9ecbbb',loaded&&sample!=='solid'?.67:0,loaded&&sample==='solid'?18:0);
 body+='<rect x="325" y="'+ey+'" width="16" height="137" rx="4" fill="url(#'+id+'-metal)" stroke="#799386"/><rect x="417" y="'+ey+'" width="16" height="137" rx="4" fill="url(#'+id+'-metal)" stroke="#799386"/>'+label(310,246,'−',17,'#527da1')+label(449,246,'＋',17,'#ad6852');
 body+=plaque(46,281,170,solutions[sample].name,solutions[sample].formula)+label(609,294,'導電結果',12,'#7b8a77')+label(609,324,result,22,powered&&r.score>.1?'#3c704b':'#6f7f6a')+label(379,409,'電池 → 燈泡 → 開關 → 電極與樣品 → 電池',12,'#718570');
 return svg(body,'電池、燈泡、刀閘開關與電極串聯的導電裝置；'+result,id,435);
}

export function phScene(r,{kind='btb',dropped=false,paper=false,meter:measured=false,id='ph'}={}){
 const ind=indicator(kind,r.pH),litmus=['red','blue'].includes(kind),p=indicator('universal',r.pH);
 let body=beaker(id,272,173,226,171,dropped&&!litmus?ind.color:'#b4d5c6',.65);
 body+=plaque(279,349,210,'對照樣品',dropped?ind.label:'先觀察，再量測');
 body+=meter(548,54,168,'酸鹼檢測',measured?'pH '+fmt(r.pH):'— —','25°C 理想水溶液');
 body+='<path d="M548 113Q482 58 465 139V'+(measured?259:158)+'" stroke="#567867" stroke-width="4" fill="none"/><rect x="455" y="'+(measured?192:100)+'" width="20" height="99" rx="6" fill="#e8eee1" stroke="#8ca696"/><rect x="460" y="'+(measured?260:168)+'" width="10" height="38" rx="4" fill="#536e5b"/>';
 if(litmus){
  body+='<rect x="114" y="82" width="26" height="107" rx="3" fill="'+(kind==='red'?'#ce7b86':'#7d93c4')+'"/>'+label(127,62,kind==='red'?'紅色石蕊':'藍色石蕊',12);
  if(dropped)body+='<rect x="301" y="156" width="24" height="130" rx="2" fill="'+(kind==='red'?'#ce7b86':'#7d93c4')+'"/><rect x="301" y="233" width="24" height="53" fill="'+ind.color+'"/>';
 }else{
  body+='<rect x="97" y="105" width="58" height="70" rx="10" fill="#dbb980" fill-opacity=".8" stroke="#9d8058"/><rect x="109" y="93" width="34" height="16" rx="4" fill="#607360"/><rect x="106" y="129" width="40" height="28" rx="3" fill="#fff5d8"/>'+label(126,147,kind==='btb'?'BTB':kind==='phenol'?'酚酞':'廣用',11)+label(126,70,'少量指示劑',12);
  body+='<path d="M215 83l74 33" stroke="#607b69" stroke-width="16" stroke-linecap="round"/><path d="M288 116l31 14" stroke="#c7dace" stroke-width="8"/><path d="M319 130l11 5" stroke="#90aa9d" stroke-width="4"/>';
  if(dropped)body+='<circle class="drop-fall" cx="330" cy="166" r="5" fill="'+ind.color+'"/>';
 }
 body+=beaker(id,64,258,111,71,'#b4d5c6',.5)+'<rect x="100" y="231" width="23" height="81" fill="#ede2c2" stroke="#bcb499"/><rect x="100" y="280" width="23" height="32" fill="'+(paper?p.color:'#ede2c2')+'"/>'+label(118,347,'另一份等同樣品',10);
 body+=label(380,407,'顏色是線索；試紙估讀，pH 計量測',11,'#7c8f78');
 return svg(body,'指示劑、獨立樣品試紙與 pH 計',id);
}

export function neutralScene(r,{v=0,reverse=false,pouring=false,id='neutral'}={}){
 const col=indicator('btb',r.pH).color,used=v>0&&v%50===0?50:v%50,ly=59+used/50*130;
 let body='<ellipse cx="176" cy="345" rx="80" ry="12" fill="#4f665924"/><rect x="104" y="331" width="143" height="15" rx="5" fill="#687c6b"/><path d="M171 330V35H369" fill="none" stroke="url(#'+id+'-metal)" stroke-width="8"/><path d="M171 107H345" stroke="#7e9483" stroke-width="7"/><path d="M337 94v27h52" stroke="#65806b" stroke-width="4" fill="none"/><rect x="348" y="43" width="35" height="157" rx="4" fill="url(#'+id+'-glass)" stroke="#829d8b" stroke-width="2"/><rect x="353" y="'+ly+'" width="25" height="'+Math.max(0,195-ly)+'" fill="#b2d4c7" opacity=".7"/>'+ruler(348,58,130)+label(400,61,'0',9)+label(400,190,'50 mL',9);
 body+='<path d="M365 200V238" stroke="#809b87" stroke-width="5"/><rect x="351" y="204" width="29" height="10" rx="3" fill="#4b715b"/><circle cx="366" cy="209" r="8" fill="#b39b6c"/><path d="M366 200v18" stroke="#f4e1b8" stroke-width="2"/>';
 body+=plaque(439,57,230,reverse?'滴定管：稀鹽酸 HCl':'滴定管：NaOH 水溶液','累計加入 '+fmt(v)+' mL · 每 50 mL 補充（示意）');
 body+=beaker(id,269,246,208,109,col,Math.min(.88,.18+r.volume*1000/400));
 if(pouring||v>0)body+='<circle class="drop-fall" cx="365" cy="244" r="4" fill="#b0cfc1"/>';
 body+=meter(539,237,174,'即時讀值','pH '+fmt(r.pH),fmt(r.temperature)+' °C · 理想升溫');
 body+=plaque(56,235,150,reverse?'燒杯：NaOH':'燒杯：HCl','BTB 指示劑');
 body+=label(375,392,(r.acidLeft>1e-12?'酸過量':r.baseLeft>1e-12?'鹼過量':'酸鹼當量相等')+' · 總體積 '+fmt(r.volume*1000)+' mL',14);
 return svg(body,'有刻度與旋鈕的中和滴定工作台',id);
}

export function precipScene(r,{mixed=false,filtered=false,V1=20,V2=20,partner='calcium',id='precip'}={}){
 const second=partner==='calcium'?'CaCl₂':partner==='nacl'?'NaCl':'H₂O';
 let body='<g class="pouring-vessel">'+beaker(id,63,169,157,171,'#b4d2c3',mixed?0:Math.min(.8,.16+V1/160))+'</g><path class="transfer-stream" d="M215 184Q292 152 339 238" stroke="#88b9ac" stroke-width="7" stroke-linecap="round" fill="none"/>';
 body+=beaker(id,281,169,157,171,mixed&&r.mass?'#e0e6d8':'#b4d2c3',filtered?0:Math.min(.8,.16+(mixed?V1+V2:V2)/260),mixed&&!filtered?r.mass*24:0);
 body+=plaque(71,87,141,'Na₂CO₃(aq)',mixed?'已倒入右杯':fmt(V1)+' mL')+plaque(288,87,143,mixed?'混合液':second+(partner==='water'?'':'(aq)'),mixed?fmt((V1+V2))+' mL':fmt(V2)+' mL');
 body+='<path d="M690 327V57M548 142H690" stroke="url(#'+id+'-metal)" stroke-width="7"/><rect x="647" y="327" width="84" height="13" rx="4" fill="#6e8572"/><path d="M497 139H673L600 229V267H579V229Z" fill="#eaf4e9" fill-opacity=".6" stroke="#87a28f" stroke-width="2"/><path d="M506 147H664L590 221Z" fill="#fffdf0" stroke="#c9ccae"/>';
 body+=[525,547,570,610,632,652].map(x=>'<path d="M'+x+' 148L590 220" stroke="#e2dfc7" stroke-width="1"/>').join('');
 if(filtered&&r.mass)body+='<ellipse cx="590" cy="177" rx="34" ry="'+Math.min(15,5+r.mass*15)+'" fill="#fff" stroke="#d6d9ca"/>';
 body+='<path class="transfer-stream filter-stream" d="M590 263V310" stroke="#9ac2b5" stroke-width="4" stroke-dasharray="6 8"/>'+beaker(id,530,281,123,63,'#b4d2c3',filtered?.57:0);
 body+=label(590,102,filtered?'濾紙：'+fmt(r.mass,4)+' g CaCO₃':'濾紙與漏斗',12)+label(142,380,mixed?'原料已移出':'第一份溶液',12)+label(360,380,filtered?'已倒入漏斗':mixed?(r.mass?'白色沉澱出現':'無沉澱'):'第二份溶液',12)+label(591,380,filtered?'濾液仍含溶解離子':'濾液收集杯',12);
 return svg(body,'透明燒杯、白色沉澱與有支架的過濾裝置',id);
}

export function crystalScene(r,{mode='pure',filtered=false,settled=false,weather='sun',running=false,pooled=false,separated=false,id='crystal'}={}){
 let body='<path d="M0 143Q110 91 224 148T428 145T760 130V340H0Z" fill="#c8d5bd"/><path d="M0 199Q190 155 345 206T760 177V337H0Z" fill="#dbe2c8"/>';
 body+=weather==='sun'?'<circle cx="650" cy="60" r="26" fill="#eacb7a"/><circle cx="650" cy="60" r="39" fill="#eacb7a" opacity=".14"/>':'<path d="M594 75q-18-29 17-38 22-32 49 0 38-1 35 38Z" fill="#b8c9c2"/>';
 body+=plaque(36,27,268,mode==='pure'?'A / 純氯化鈉水溶液':'B / 天然鹵水簡化模型',filtered?'已過濾懸浮物':settled?'已沉降、傾取上清液':'原料中的溶解鹽仍保留');
 // Retaining walls and pond depth, with water and crystals driven by mass balance.
 body+='<path d="M131 222L280 161H607L683 274 514 343H169Z" fill="#b3a489" stroke="#8d9278" stroke-width="2"/><path d="M169 343v15h345l169-69v-15L514 343Z" fill="#928f73"/><path d="M149 225L284 175H598L663 270 509 328H184Z" fill="#e2dfc6"/>';
 if(pooled&&r.waterLeft>0)body+='<path d="M154 228L287 180H594L657 268 506 321H190Z" fill="#84b6aa" opacity="'+(.12+.6*r.waterLeft/Math.max(1,r.waterLeft+r.evaporated))+'"/><path d="M196 250l282-54M246 280l302-59M340 296l254-58" stroke="#e1f0db" stroke-width="1" opacity=".35"/>';
 if(pooled&&!separated)for(let i=0;i<Math.min(55,Math.ceil(r.crystalMass*2));i++){const x=215+(i*47)%319,y=228+(i*23)%62;body+='<path d="M'+x+' '+y+'l8-4 8 4v10l-8 4-8-4Z" fill="#fffdf0" stroke="#c1c6b1"/><path d="M'+x+' '+y+'l8 4 8-4m-8 4v10" fill="none" stroke="#e1dfcb"/>';}
 if(pooled&&r.dirtLeft)for(let i=0;i<12;i++)body+='<circle cx="'+(220+i*26)+'" cy="'+(258+i%3*12)+'" r="3" fill="#927853"/>';
 body+='<ellipse cx="85" cy="302" rx="45" ry="14" fill="#7c847026"/><path d="M43 197H125L115 296Q84 310 53 296Z" fill="#b19e7b" stroke="#918969"/><ellipse cx="84" cy="197" rx="41" ry="12" fill="'+(pooled?'#d0c5a9':'#a2c2ae')+'" stroke="#918969"/><path d="M58 209L65 291M110 208L104 293" stroke="#93865e" stroke-width="3"/>'+label(85,329,pooled?'原料已送入':'原料鹵水',11);
 if(separated)body+='<path d="M569 332h137l-14 33H581Z" fill="#b7a17a" stroke="#948569"/><path d="M584 336l21-25 15 13 19-31 24 22 24 21Z" fill="#fffbed" stroke="#d3cfb5"/>'+label(639,391,'已收集 '+fmt(r.harvest)+' g',12);
 if(running)body+='<g class="vapor" stroke="#fbfff3" stroke-width="3" fill="none"><path d="M309 208q-13-18 0-35t0-32M389 197q-13-18 0-35t0-32M479 214q-13-18 0-35t0-32"/></g>';
 body+=label(374,388,pooled?'剩水 '+fmt(r.waterLeft)+' g · 晶體 '+fmt(r.crystalMass)+' g':'鹽池尚未裝入原料',14)+label(384,409,'蒸發移除的是水；晶體來自原有溶質',10,'#7d8972');
 return svg(body,'依水量與晶體質量變化的鹽田工作台',id);
}
