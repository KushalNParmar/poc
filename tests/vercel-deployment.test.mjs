import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {load} from 'cheerio';
import {buildVercel} from '../scripts/build-vercel.mjs';

test('Vercel package includes every rendered page and asset with correct routes and an isolated SDK function',async()=>{
  const output=await buildVercel(),staticRoot=path.join(output,'static');
  const config=JSON.parse(await fs.readFile(path.join(output,'config.json'),'utf8'));
  assert.equal(config.version,3);
  const resolveRoute=route=>{
    const url=new URL(route,'https://lngvty.vercel.app');
    return config.routes.find(r=>r.dest&&new RegExp(r.src).test(url.pathname)&&(!r.has||r.has.every(h=>h.type==='query'&&url.searchParams.get(h.key)===h.value)));
  };
  const pages=JSON.parse(await fs.readFile(new URL('../data/routes.json',import.meta.url),'utf8'));
  for(const page of pages){
    const route=resolveRoute(page.path);assert.ok(route,'route '+page.path);
    const html=await fs.readFile(path.join(staticRoot,route.dest),'utf8'),$=load(html);
    assert.equal($('#MainContent').length,1,page.path);
    for(const element of $('script[src],link[href],img[src],source[src],video[poster]').toArray()){
      for(const attr of ['src','href','poster']){
        const value=$(element).attr(attr);
        if(value?.startsWith('/assets/'))assert.ok((await fs.stat(path.join(staticRoot,value.split(/[?#]/)[0]))).isFile(),value);
      }
    }
  }
  assert.match(resolveRoute('/blogs/skinmaxxing?page=2').dest,/page-2\/index.html$/);
  assert.match(resolveRoute('/pages/reward-for-discipline?view=reward-for-discilpine-tnc').dest,/reward-for-discipline-tnc/);
  assert.match(resolveRoute('/pages/skin-analysis/').headers['Permissions-Policy'],/camera=\(self "https:\/\/cdn.glamar.io"\)/);
  assert.match(resolveRoute('/').headers['Content-Security-Policy'],/frame-src https:\/\/cdn.glamar.io/);
  assert.equal(resolveRoute('/collections/frontpage').headers['Permissions-Policy'],'camera=(), microphone=()');
  assert.equal(resolveRoute('/missing').status,404);
  const redirects=config.routes.filter(r=>r.status===302);
  assert.equal(redirects.find(r=>new RegExp(r.src).test('/account')).headers.Location,'/pages/kp-account');
  for(const name of ['.env','scripts','docs','data','package.json'])await assert.rejects(fs.stat(path.join(staticRoot,name)),{code:'ENOENT'});
  const functionRoot=path.join(output,'functions/api/skin-analysis/sdk-config.func');
  assert.deepEqual((await fs.readdir(functionRoot)).sort(),['.vc-config.json','index.mjs','skin-analysis-config.mjs']);
  const handler=(await import(pathToFileURL(path.join(functionRoot,'index.mjs')).href)).default;
  const server=http.createServer((req,res)=>handler(req,res,{appId:'fixture-app',accessKey:'fixture-web-key'}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const response=await fetch(base+'/api/skin-analysis/sdk-config',{headers:{Origin:base.replace('http:','https:'),'x-forwarded-proto':'https'}});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{appId:'fixture-app',accessKey:'fixture-web-key'});
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await fetch(base+'/api/skin-analysis/sdk-config',{headers:{Origin:'https://foreign.example','x-forwarded-proto':'https'}})).status,403);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
