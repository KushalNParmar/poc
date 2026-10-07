import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {load} from 'cheerio';
import {build,root} from '../scripts/build.mjs';
import '../theme/assets/commerce-core.js';

const C=globalThis.LngCommerce;
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const acne='48573386981533',bundle='48794741473437',hydration='48573378461853';

test('cart merges a size, keeps other sizes distinct, and removes quantities of zero',()=>{
  let lines=C.add([],acne,1,catalog);lines=C.add(lines,acne,2,catalog);lines=C.add(lines,bundle,1,catalog);
  assert.deepEqual(lines,[{id:acne,quantity:3},{id:bundle,quantity:1}]);
  assert.equal(C.totals(lines,catalog).subtotal,338520);
  lines=C.update(lines,acne,0,catalog);assert.deepEqual(lines,[{id:bundle,quantity:1}]);
});
test('cart totals retain paise, calculate discounts, and follow the gift threshold',()=>{
  const single=C.totals([{id:acne,quantity:1}],catalog);assert.equal(single.giftEligible,false);
  const two=C.totals([{id:acne,quantity:2}],catalog,'LOCAL10');
  assert.equal(two.total_price,89820);assert.equal(two.total_discount,9980);assert.equal(two.giftEligible,true);
  const b=C.totals([{id:bundle,quantity:1}],catalog);assert.equal(b.total_price,188820);
  assert.equal(C.totals([{id:hydration,quantity:1}],catalog).items[0].preorder,true);
});
test('corrupt or unknown persisted items are discarded and quantities are bounded',()=>{
  assert.deepEqual(C.normalize(null,catalog),[]);
  assert.deepEqual(C.normalize([{id:'unknown',quantity:1},{id:acne,quantity:-10}],catalog),[]);
  assert.equal(C.add([],acne,999,catalog)[0].quantity,99);
  assert.throws(()=>C.add([],'unknown',1,catalog),/choose a product size/);
});
test('all reconstructed page views render with local assets and valid internal navigation',async()=>{
  const outputs=await build();
  assert.equal(Object.keys(outputs).length,54);
  const paths=new Set(Object.keys(outputs).map(r=>r.split('?')[0]));paths.add('/collections');
  const failures=[];
  for(const [route,file] of Object.entries(outputs)){
    const $=load(fs.readFileSync(path.join(root,'dist',file),'utf8'));
    assert.equal($('#MainContent').length,1,`${route} needs one main region`);
    assert.ok($('title').text().trim(),`${route} needs a title`);
    if(route==='/'){
      assert.equal($('#lng-skin-analysis[data-sa-preload][inert][aria-hidden="true"]').length,1,'Home parks one inaccessible SDK surface for preload');
      assert.equal($('#glamar-skin-container').length,1);
      assert.equal($('script[src="/assets/skin-analysis.js"]').length,1);
    }
    $('script[src],link[href],img[src],source[src],video[poster]').each((i,e)=>{
      for(const key of ['src','href','poster']){
        const value=$(e).attr(key);if(!value)continue;
        if(/^(?:https?:)?\/\//.test(value))failures.push(`${route}: active remote resource ${value}`);
        if(value.startsWith('/assets/')&&!fs.existsSync(path.join(root,'theme',value)))failures.push(`${route}: missing asset ${value}`);
      }
    });
    $('a[href]').each((i,e)=>{
      const href=$(e).attr('href');
      if(href.startsWith('/')&&!href.startsWith('/assets/')&&!href.startsWith('/cart/')&&!paths.has(href.split(/[?#]/)[0]))failures.push(`${route}: unknown internal route ${href}`);
    });
    for(const prefix of ['HeaderMenu','HeaderDrawer']){
      if($('#'+prefix+'-about').length){
        const items=$('#'+prefix+'-about').closest('ul').find('a').map((i,e)=>$(e).text().trim()).get();
        assert.ok(items.indexOf('Skin Analysis')===items.indexOf('The Story')+1,route+' navigation order');
        assert.ok(items.indexOf('About')===items.indexOf('Skin Analysis')+1,route+' About order');
      }
    }
    assert.equal($('script[src*="gokwik"],script[src*="shopifycloud"],script[src*="googletag"]').length,0);
  }
  assert.deepEqual(failures,[]);
});
test('all browser JavaScript parses after asset rewriting',()=>{
  for(const dir of ['theme/assets','theme/assets/vendor']){
    for(const name of fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.js'))){
      const file=path.join(root,dir,name);
      assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}));
    }
  }
});
test('localized CSS dependencies exist and no remote font or image loads remain',()=>{
  const failures=[];
  for(const dir of ['theme/assets','theme/assets/vendor']){
    for(const name of fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.css'))){
      const css=fs.readFileSync(path.join(root,dir,name),'utf8');
      for(const match of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)){
        const value=match[1];
        if(/^(?:https?:)?\/\//.test(value))failures.push(`${name}: remote CSS resource ${value}`);
        if(value.startsWith('/assets/')&&!fs.existsSync(path.join(root,'theme',value.split('#')[0])))failures.push(`${name}: missing CSS resource ${value}`);
      }
    }
  }
  assert.deepEqual(failures,[]);
});

test('an occupied port reports recovery instructions without an unhandled exception',async()=>{
  const occupied=http.createServer();
  await new Promise((resolve,reject)=>{
    occupied.once('error',reject);
    occupied.listen(0,'127.0.0.1',resolve);
  });
  const port=occupied.address().port;
  try{
    await assert.rejects(
      promisify(execFile)(process.execPath,['scripts/serve.mjs'],{
        cwd:root,env:{...process.env,PORT:String(port)},timeout:15000
      }),
      error=>{
        assert.equal(error.code,1);
        assert.match(error.stderr,new RegExp(`Port ${port} is already in use`));
        assert.ok(error.stderr.includes(`http://127.0.0.1:${port}`));
        assert.match(error.stderr,/PORT=\d+ npm start/);
        assert.doesNotMatch(error.stderr,/Unhandled|node:events|at Server/);
        return true;
      }
    );
    assert.equal(occupied.listening,true);
  }finally{
    await new Promise(resolve=>occupied.close(resolve));
  }
});

// A server-side access key makes path containment a required regression check.
test('asset requests cannot escape the public asset directory or read server configuration',async()=>{
  const reserve=http.createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
  const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
  try{
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Test server did not start')),10000);
      child.once('error',error=>{clearTimeout(timeout);reject(error);});
      child.once('exit',code=>{clearTimeout(timeout);reject(new Error('Test server exited: '+code));});
      child.stdout.on('data',data=>{if(data.toString().includes('LNGVTY POC 2 ready')){clearTimeout(timeout);resolve();}});
    });
    for(const route of ['/assets/..%2f..%2f.env','/assets/..%2f..%2fscripts/serve.mjs','/.env','/scripts/glamar-client.mjs']){
      const response=await fetch(`http://127.0.0.1:${port}${route}`);assert.equal(response.status,404,route);
    }
    const response=await fetch(`http://127.0.0.1:${port}/assets/skin-analysis.js`);assert.equal(response.status,200);
    for(const route of ['/','/pages/skin-analysis','/pages/skin-analysis/']){
      const page=await fetch(`http://127.0.0.1:${port}${route}`);
      assert.match(page.headers.get('content-security-policy'),/frame-src https:\/\/cdn.glamar.io/);
      assert.match(page.headers.get('permissions-policy'),/camera=\(self "https:\/\/cdn.glamar.io"\)/);
    }
    const collection=await fetch(`http://127.0.0.1:${port}/collections/frontpage`);
    assert.match(collection.headers.get('content-security-policy'),/frame-src 'none'/);
    assert.equal(collection.headers.get('permissions-policy'),'camera=(), microphone=()');
  }finally{child.kill('SIGTERM');await new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)resolve();else child.once('exit',resolve);});}
});
