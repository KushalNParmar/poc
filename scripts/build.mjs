import fs from 'node:fs/promises';
import path from 'node:path';
import { Liquid } from 'liquidjs';

export const root = path.resolve(import.meta.dirname, '..');
export async function build() {
  const routes=JSON.parse(await fs.readFile(path.join(root,'data/routes.json'),'utf8'));
  for(const [name,variable] of [['catalog','LNGVTY_CATALOG'],['reviews','LNGVTY_REVIEWS']]) {
    const data=JSON.parse(await fs.readFile(path.join(root,'data',name+'.json'),'utf8'));
    await fs.writeFile(path.join(root,'theme/assets',name+'.js'),`window.${variable} = ${JSON.stringify(data)};\n`);
  }
  const engine=new Liquid({root:[path.join(root,'theme/templates'),path.join(root,'theme/sections')],layouts:path.join(root,'theme/layout'),partials:path.join(root,'theme/sections'),extname:'.liquid',cache:true});
  await fs.mkdir(path.join(root,'dist'),{recursive:true});
  const outputs={};
  for(const page of routes) {
    const html=await engine.renderFile(page.template,{page});
    const relative=page.path==='/'?'index.html':page.path.includes('?page=')?page.path.slice(1).replace('?page=','/page-')+'/index.html':page.path.slice(1)+'/index.html';
    await fs.mkdir(path.dirname(path.join(root,'dist',relative)),{recursive:true});
    await fs.writeFile(path.join(root,'dist',relative),html);
    outputs[page.path]=relative;
  }
  // Assets have a single source of truth; avoid copying 200 MB on every build.
  await fs.writeFile(path.join(root,'dist/route-map.json'),JSON.stringify(outputs,null,2)+'\n');
  console.log(`Built ${routes.length} Liquid page views.`);
  return outputs;
}
if(process.argv[1]===import.meta.filename) await build();
