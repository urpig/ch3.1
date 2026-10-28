import { svg, beaker, label } from './art.js';
export function reactionIllustration(index, reacted=true){
 const id='reaction-study-'+index,gas=index===0?'CO₂':'H₂';
 let body=label(54,40,'OBSERVATION / 0'+(index+1),11,'#7d8d80','start')+beaker(id,275,129,210,200,index===2&&reacted?'#e0e6d8':'#bbd8d2',.63)+label(380,165,'250 mL',11,'#6c9184');
 if(index<2){
  body+=index===0?'<path d="M312 316l9-25 26-12 30 10 11 27Z" fill="#dedbd0" stroke="#a9ac9a"/><path d="m321 291 29 8 18-17m-18 17 7 17" fill="none" stroke="#f9f8ef" stroke-width="3"/>':'<path d="M325 306l17-27 46 9 13 25-28 10Z" fill="url(#'+id+'-metal)" stroke="#738b81"/><path d="m342 279 8 29 38-20m-38 20 23 15" fill="none" stroke="#dbe7df" stroke-width="2"/>';
  if(reacted)for(let i=0;i<10;i++)body+='<circle class="study-bubble" cx="'+(326+(i*31)%111)+'" cy="'+(277-(i*23)%107)+'" r="'+(3+i%4)+'" fill="#ffffff40" stroke="#79a999" style="animation-delay:-'+i*.3+'s"/>';
  body+='<path d="M510 225h47" stroke="#a4b7a3"/>'+label(570,220,reacted?gas+' 氣泡':'尚未反應',14,'#41634e','start')+label(570,244,reacted?'氣體生成的證據':'切換反應後觀察',11,'#788775','start')+label(157,302,index===0?'石灰岩':'鋅粒',15)+label(157,324,index===0?'CaCO₃(s)':'Zn(s)',12,'#829182');
 }else if(index===2){
  body+='<path d="M88 249q32-14 63 0l-7 10H94Z" fill="#faf9ee" stroke="#b9c7b3"/><path d="M151 249h80" stroke="url(#'+id+'-metal)" stroke-width="8" stroke-linecap="round"/>'+label(156,293,reacted?'形成 Ca(OH)₂':'白色 CaO 固體',13)+'<rect x="558" y="104" width="25" height="175" rx="12" fill="#fffdf5" stroke="#b6c6ba"/><circle cx="570" cy="280" r="20" fill="#e9d1bd" stroke="#bbaa95"/><path d="M570 280V'+(reacted?150:231)+'" stroke="#bc795a" stroke-width="8" stroke-linecap="round"/>'+label(570,331,reacted?'放熱，溫度升高':'觀察溫度的變化',13);
 }else{
  body+='<rect x="91" y="145" width="76" height="155" rx="25" fill="#f8fcf766" stroke="#9ab3a6" stroke-width="2"/><rect x="110" y="132" width="38" height="17" rx="4" fill="#8f9c89"/><path d="M128 132V100H426V279" stroke="#8ea99a" stroke-width="7" fill="none"/><path d="M128 132V100H426V279" stroke="#e9f4eb" stroke-width="3" fill="none"/>'+label(128,226,'CO₂',21)+label(128,331,'二氧化碳',13);
  if(reacted)for(let i=0;i<7;i++)body+='<circle class="study-bubble" cx="'+(420+(i%3)*7)+'" cy="'+(269-i*12)+'" r="'+(3+i%3)+'" fill="#fff8" stroke="#8fb8a5" style="animation-delay:-'+i*.4+'s"/>';
  body+='<rect x="563" y="150" width="25" height="135" rx="3" fill="'+(reacted?'#d98991':'#91a8d0')+'" stroke="#9cab99"/>'+label(575,323,reacted?'濕潤藍石蕊變紅':'濕潤藍石蕊',12);
 }
 body+=label(380,377,index<2?'已知試劑的反應前後示意，不進行真實化學操作':index===2?'沒有氣體產生；溫度計只示意升溫，不表示實測數值':'部分 CO₂ 與水形成碳酸；石蕊變色為另份樣品示意',12,'#718570');
 return svg(body,['石灰岩與稀鹽酸','鋅與稀鹽酸','生石灰與水','二氧化碳與水'][index]+(reacted?'：反應後觀察':'：反應前觀察'),id,400);
}
export function saltSpecimen(index,name,formula){
 const id='salt-specimen-'+index;let crystals='';
 for(let i=0;i<27;i++){const x=290+(i*37)%180,y=251+(i*17)%55,z=5+i%6;crystals+=index===0?'<path d="M'+x+' '+y+'l'+z+' -4 '+z+' 4v'+z+'l-'+z+' 4 -'+z+' -4Z" fill="#fffef2" stroke="#c4c9bb" stroke-width=".8"/>':'<ellipse cx="'+x+'" cy="'+y+'" rx="'+z+'" ry="'+z*.55+'" fill="'+(i%2?'#f8f8ec':'#e5e7db')+'" stroke="#c7cebd" stroke-width=".5"/>';}
 const body=label(54,40,'SPECIMEN / 0'+(index+1),11,'#7d8d80','start')+'<ellipse cx="380" cy="335" rx="143" ry="12" fill="#31533a18"/><path d="M276 94h208v209q0 22-23 22H299q-23 0-23-22Z" fill="url(#'+id+'-glass)" stroke="#8aa89b" stroke-width="2"/><rect x="267" y="66" width="226" height="38" rx="7" fill="url(#'+id+'-metal)" stroke="#7d9285"/>'+Array.from({length:23},(_,i)=>'<path d="M'+(278+i*9)+' 74v22" stroke="#7e9587"/>').join('')+'<path d="M290 256q90-27 180 0v51H290Z" fill="#e9eddf"/>'+crystals+'<rect x="300" y="131" width="160" height="95" rx="3" fill="#fffdf3" stroke="#d8ddcb"/>'+label(380,158,name,17)+label(380,190,formula,23)+label(380,211,'教學樣品 · 不可食用',10,'#9a7b52')+'<path d="M288 116v181" stroke="white" stroke-width="5" opacity=".8"/>'+label(380,373,'外觀僅作示意，應比較組成與性質',13,'#718570');
 return svg(body,name+'的密封玻璃樣品瓶，外觀僅作示意',id,400).replace('viewBox="0 0 760 400"','viewBox="180 40 400 350"');
}
