import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('dist'),visited=new Set(),modules=[];
function visit(file){
 if(visited.has(file))return;visited.add(file);
 let source=fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'');
 const pattern=/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\r?$/gm;
 const imports=[...source.matchAll(pattern)];
 for(const m of imports)visit(path.posix.normalize(path.posix.join(path.posix.dirname(file),m[2])));
 const exports=[...source.matchAll(/export\s+(?:const|let|function|class)\s+(\w+)/g)].map(m=>m[1]);
 source=source.replace(pattern,(_,names,dep)=>'const {'+names+'}=__modules['+JSON.stringify(path.posix.normalize(path.posix.join(path.posix.dirname(file),dep)))+'];').replace(/\bexport\s+(?=const|let|function|class)/g,'');
 modules.push('__modules['+JSON.stringify(file)+']=(()=>{\n'+source+'\nreturn {'+exports.join(',')+'};\n})();');
}
visit('electrolytes/app.js');
const script="'use strict';\nconst __modules={};\n"+modules.join('\n');new vm.Script(script);
let html=fs.readFileSync(path.join(root,'electrolytes/index.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,href)=>{
 const cssFile=path.resolve(root,'electrolytes',href);
 let css=fs.readFileSync(cssFile,'utf8');
 css=css.replace(/url\(['"]?([^)'"]+)['"]?\)/g,(match,url)=>{
  if(url.startsWith('data:')||url.startsWith('http'))return match;
  const file=path.resolve(path.dirname(cssFile),url),data=fs.readFileSync(file);
  return 'url("data:image/png;base64,'+data.toString('base64')+'")';
 });
 return '<style>'+css+'</style>';
});
html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+script.replaceAll('</script','<\\/script')+'</script>');
// Offline sibling entries are relative to the existing workspace outputs folder.
html=html.replaceAll('href="../index.html"','href="#chapter-top"').replaceAll('href="../chemistry/index.html"','href="https://urpig.github.io/1-1/dist/chemistry/index.html"');
// Hosted entry uses the same modules with cacheable external images and styles.
const out=path.resolve('index.html');
const online=fs.readFileSync(path.join(root,'electrolytes/index.html'),'utf8')
 .replace(/(<link rel="stylesheet" href=")([^"]+)(")/g,(_,a,href,b)=>a+'./dist/'+path.posix.normalize(path.posix.join('electrolytes',href))+b)
 .replace('src="./app.js"','src="./dist/electrolytes/app.js"')
 .replaceAll('href="../index.html"','href="#chapter-top"')
 .replaceAll('href="../chemistry/index.html"','href="https://urpig.github.io/1-1/dist/chemistry/index.html"');
fs.writeFileSync(out,online);
fs.mkdirSync('release',{recursive:true});fs.writeFileSync('release/salt-adventure.html',html.replaceAll('href="./失落的神兵-拖曳探索版.html"','href="./index.html"').replaceAll('href="./chemistry-adventure.html"','href="./chemistry.html"'));
console.log(JSON.stringify({modules:visited.size,bytes:Buffer.byteLength(online),offlineBytes:Buffer.byteLength(html),output:out}));

