// The isolated review page shares existing hosted images without changing the homepage.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=process.cwd(),output='preview/water-rescue/index.html',assets=new Map();
function scan(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())scan(file);
  else if(/\.(?:png|webp|jpe?g|gif|svg)$/i.test(file))assets.set(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),path.relative(root,file));
 }
}
scan(path.resolve('dist'));
const html=fs.readFileSync('release/salt-adventure.html','utf8')
 .replace(/data:image\/[\w+.-]+;base64,([A-Za-z0-9+/=]+)/g,(_,encoded)=>{
  const key=createHash('sha256').update(Buffer.from(encoded,'base64')).digest('hex'),file=assets.get(key);
  if(!file)throw new Error('Embedded preview image has no source asset');
  return path.relative(path.dirname(output),file).split(path.sep).join('/');
 })
 .replace('<head>','<head><meta name="robots" content="noindex,nofollow">');
if(/data:image|<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(html))throw new Error('Unexpected external dependency in preview');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
console.log(JSON.stringify({preview:output,bytes:Buffer.byteLength(html)}));
