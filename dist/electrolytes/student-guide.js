// Small, visible goals use the same evidence as completion checks.
export function labProgress(type, s) {
 const records=s.records||[], unique=field=>new Set(records.map(r=>r[field]).filter(Boolean));
 if(type==='conduct')return {done:unique('category').size>=2,text:'比較 '+unique('category').size+' / 2 種樣品；換一瓶，再接通開關。'};
 if(type==='indicator'){
  const count=new Set(records.filter(r=>r.complete!==false).map(r=>r.key||r.category).filter(Boolean)).size;
  return {done:count>=2,text:'完成 '+Math.min(count,2)+' / 2 組檢測；每組使用指示劑、試紙與 pH 計。第二組可稀釋 10 倍。'};
 }
 if(type==='neutral'){
  const seen=unique('category'),missing=[['acid','酸過量'],['equal','恰好中和'],['base','鹼過量']].filter(([key])=>!seen.has(key));
  return {done:missing.length===0,text:missing.length?'還差：'+missing.map(([,label])=>label).join('、')+'。滴加時會自動記錄。':'酸過量、恰好中和、鹼過量，三種證據都記下了。'};
 }
 if(type==='precip'){
  const seen=new Set(records.filter(r=>r.complete===true||r.text.includes('已過濾')).map(r=>r.category));
  return {done:seen.has('calcium')&&(seen.has('nacl')||seen.has('water')),text:'完成「氯化鈣」與一組「食鹽水／蒸餾水」對照，各混合並過濾。已完成 '+seen.size+' 組。'};
 }
 if(type==='crystal')return {done:records.some(r=>r.complete===true),text:'送入鹽池 → 蒸發到出現晶體 → 收集；產量會自動記錄。'};
 return {done:false,text:''};
}

export function explorationHint(card,state){
 if(state.observed.includes(card.id))return '✓ 觀察已完成，可以用一題驗證想法。';
 if(['conduct','indicator','neutral','precip','crystal'].includes(card.type))return labProgress(card.type,state.labs[card.type]||{records:[]}).text;
 const counts={story:3,ions:6,reactions:4,strength:4,salts:5};
 if(counts[card.type])return '已查看 '+(state.explored[card.id]||[]).length+' / '+counts[card.type]+(card.type==='ions'?' 種樣品；記得開啟電場。':card.type==='reactions'?' 組反應；每組都要點擊加入試劑。':' 個情境；點選尚未打勾的項目。');
 if(card.type==='audit')return '打開三份紀錄的「查看核對說明」，完成證據核對。';
 return '回看棚下煮鹽的成果，點擊「確認新法供鹽，向皇帝告別」，再完成下方的一題判斷。';
}

export const notebook={
 1:['透明、白色結晶都是外觀，不能用來認定成分。','未知液體不品嚐；用檢測結果提出證據。'],
 2:['水中可自由移動的離子能搬運電荷。','固態食鹽的離子固定；糖水則主要是中性分子。導電不代表可食用。'],
 3:['陽離子朝負極、陰離子朝正極移動。','解離或游離後，溶液中的正負電荷總量仍平衡。'],
 4:['酸與碳酸鹽反應可產生 CO₂；鋅與稀鹽酸可產生 H₂。','生石灰加水會放熱；不能把所有冒泡都當成同一種氣體。'],
 5:['在本章 25°C 模型中：pH < 7 酸性、= 7 中性、> 7 鹼性。','不同指示劑有不同變色範圍；用試紙與 pH 計交叉確認。','加純水稀釋，酸鹼通常往中性靠近，不會直接變成另一類。'],
 6:['「強弱」看形成離子的比例，「濃淡」看每份溶液含多少溶質。','強酸也可以很稀，不能只看 pH 就判斷酸的強弱。'],
 7:['中和時 H⁺ 與 OH⁻ 結合成水。','酸或鹼用量過多，反應後仍會偏酸或偏鹼；相同體積不一定恰好中和。'],
 8:['化學中的「鹽」是一類物質，不只有食鹽。','鹽類有不同用途、溶解性與酸鹼性；不是每種鹽都能吃。'],
 9:['Ca²⁺ 與 CO₃²⁻ 結合，形成難溶的碳酸鈣沉澱。','過濾留住固體，無法移除所有溶解離子。'],
 10:['蒸發減少水，原本的 NaCl 總量沒有增加。','結晶後要分離晶體與母液；白色晶體仍不等於食品安全證明。'],
 11:['檢查成分、用量與質量守恆，才能判斷報告是否合理。','導電、pH 7 和白色外觀，都不足以證明可食用。'],
 12:['中和是化學反應；鹵水蒸發是分離原有的鹽。','製鹽流程合理，仍需要純度與污染物檢驗。']
};
