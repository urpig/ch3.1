import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scienceTerms,primerTerms} from '../../dist/electrolytes/terminology-data.js';
import {matchScienceTerms,TermPrimer} from '../../dist/electrolytes/terminology.js';
const ids=new Set(scienceTerms.map(t=>t.id));
test('Glossary entries have unique IDs, complete student explanations, valid card links and related terms',()=>{
 assert.equal(ids.size,scienceTerms.length);
 assert.ok(scienceTerms.length>=90);
 const aliases=new Map();
 for(const t of scienceTerms){
  for(const key of ['label','definition','example','note'])assert.ok(t[key].trim(),`${t.id}: ${key}`);
  assert.ok(t.chapters.length);
  for(const n of t.chapters)assert.ok(Number.isInteger(n)&&n>=1&&n<=12);
  for(const id of t.related)assert.ok(ids.has(id),`${t.id} -> ${id}`);
  for(const name of [t.label,...t.aliases]){assert.ok(!aliases.has(name)||aliases.get(name)===t.id,`conflicting alias ${name}`);aliases.set(name,t.id);}
 }
});
test('All 12 cards have three relevant primer terms and an independent card filter launcher',()=>{
 for(let n=1;n<=12;n++){
  assert.equal(primerTerms[n].length,3);
  for(const id of primerTerms[n])assert.ok(scienceTerms.find(t=>t.id===id).chapters.includes(n));
  const html=TermPrimer(n);assert.ok(html.includes(`data-open-glossary="${n}"`));assert.equal((html.match(/data-science-term=/g)||[]).length,3);
 }
});
test('Term matching keeps longer compound names intact',()=>{
 assert.deepEqual(matchScienceTerms('非電解質、強電解質、弱電解質、電解質').map(x=>x.term),['nonelectrolyte','strong-electrolyte','weak-electrolyte','electrolyte']);
 assert.deepEqual(matchScienceTerms('氫氧根離子濃度與氫離子濃度').map(x=>x.term),['oh-concentration','h-concentration']);
 assert.deepEqual(matchScienceTerms('碳酸氫鈉與碳酸鈉及碳酸根離子').map(x=>x.term),['baking-soda','sodium-carbonate','carbonate']);
});
test('Formula annotations do not turn the H2 inside H2O into hydrogen gas',()=>{
 assert.equal(matchScienceTerms('H₂O').length,0);
 assert.deepEqual(matchScienceTerms('H₂ 與 CO₂，NaCl、[H⁺]、pH').map(x=>x.term),['hydrogen','carbon-dioxide','table-salt','h-concentration','ph']);
 assert.equal(matchScienceTerms('NaClX NH₄⁺X').length,0);
});
test('Misconception pairs and all specified reagents are available',()=>{
 for(const id of ['neutrality','neutral','dissociation','ionization','concentration','strong-acid','weak-acid','precipitation','settling','filtration','mother-liquor','hcl','sulfuric','nitric','acetic','naoh','calcium-hydroxide','ammonia','table-salt','sodium-carbonate','baking-soda','calcium-carbonate','calcium-sulfate'])assert.ok(ids.has(id),id);
});
test('Local offline build includes dictionary, glossary CSS and initialization',()=>{
 const html=fs.readFileSync('release/salt-adventure.html','utf8');
 assert.ok(html.includes('科學名詞小字典'));assert.ok(html.includes('水離子積'));assert.ok(html.includes('mountTerminology();'));
 assert.ok(html.includes('.science-dictionary::backdrop'));assert.ok(!/<script[^>]+src=/.test(html));
 assert.ok(!html.includes('\uFFFD'));
});
