import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import {serveSkinSdkConfig} from '../scripts/skin-analysis-config.mjs';
import '../theme/assets/skin-analysis-core.js';
import '../theme/assets/skin-analysis-sdk.js';
const core=globalThis.LngSkin,bridge=globalThis.LngSkinSDK;
test('same-document routing preserves new-tab clicks, downloads, anchors and other storefront routes',()=>{
 const origin='http://127.0.0.1:8765',event={button:0};
 const link=(href,extras={})=>({href,target:'',hasAttribute:()=>false,...extras});
 assert.equal(bridge.localRoute(event,link(origin+'/pages/skin-analysis'),origin),'/pages/skin-analysis');
 assert.equal(bridge.localRoute(event,link(origin+'/'),origin),'/');
 assert.equal(bridge.localRoute(event,link(origin+'/pages/skin-analysis/'),origin),'/pages/skin-analysis');
 for(const modifier of ['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented'])assert.equal(bridge.localRoute({...event,[modifier]:true},link(origin+'/pages/skin-analysis'),origin),null);
 for(const href of [origin+'/#serums',origin+'/collections/frontpage',origin+'/?campaign=test','https://example.com/pages/skin-analysis'])assert.equal(bridge.localRoute(event,link(href),origin),null);
 assert.equal(bridge.localRoute(event,link(origin+'/',{target:'_blank'}),origin),null);
 assert.equal(bridge.localRoute(event,link(origin+'/',{hasAttribute:()=>true}),origin),null);
 assert.equal(bridge.localRoute({button:1},link(origin+'/'),origin),null);
});
function fakeSDK({loaded=false}={}){
 const listeners=new Map(),calls=[];
 return {calls,listeners,init(...args){calls.push(['init',...args]);},addEventListener(event,fn){listeners.set(event,fn);},removeEventListener(event,fn){if(listeners.get(event)===fn)listeners.delete(event);},isLoaded:()=>loaded,skinAnalysis:option=>calls.push(['skinAnalysis',option]),close:()=>calls.push(['close']),addedToCart:id=>calls.push(['addedToCart',id]),emit(event,payload){listeners.get(event)?.(payload);}};
}
test('SDK initializes native onboarding and never starts skin analysis programmatically',()=>{
 const sdk=fakeSDK();let ready=0;
 const session=bridge.session(sdk,{containerId:'sdk-mount',appId:'app-fixture',accessKey:'sdk-key-fixture',onReady:()=>ready++});
 assert.deepEqual(sdk.calls,[['init','sdk-mount','sdk-key-fixture',{platform:'web',category:'skinanalysis',meta:{preloadMLModels:['face','light']},configuration:{skinAnalysis:{appId:'app-fixture'}}}]]);
 sdk.emit('loaded');sdk.emit('loaded');assert.equal(ready,1);assert.equal(sdk.calls.length,1);
 session.dispose();assert.equal(sdk.listeners.size,0);assert.deepEqual(sdk.calls.at(-1),['close']);session.dispose();assert.equal(sdk.calls.length,2);
});
test('SDK result callbacks never mistake capture or metadata for results',()=>{
 const sdk=fakeSDK({loaded:true});let results=[],errors=[],camera=0,cart=0,added=[];
 const session=bridge.session(sdk,{containerId:'mount',appId:'app',accessKey:'key',onResult:r=>results.push(r),onError:e=>errors.push(e),onCameraIssue:()=>camera++,onCart:()=>cart++,onAddToCart:p=>added.push(p)});
 sdk.emit('skin-analysis',{option:'capture',value:'a private photo'});sdk.emit('skin-analysis',{option:'scan-metadata',value:{scanId:'private'}});
 assert.equal(results.length,0);
 sdk.emit('skin-analysis',{option:'result',value:{skinData:{total_skin_score:80}}});assert.equal(results.length,1);
 sdk.emit('skin-analysis',{option:'error',value:{message:'no face'}});sdk.emit('camera-access-issue');sdk.emit('add-to-cart-global');sdk.emit('add-to-cart',{skuId:'known'});session.addedToCart('known');
 assert.equal(errors.length,1);assert.equal(camera,1);assert.equal(cart,1);assert.deepEqual(added,[{skuId:'known'}]);assert.deepEqual(sdk.calls.at(-1),['addedToCart','known']);
 session.dispose();sdk.emit('skin-analysis',{option:'result',value:{}});assert.equal(results.length,1);
});
test('disposing while SDK is loading prevents late events and does not call unloaded methods',()=>{
 const sdk=fakeSDK();let ready=false;const session=bridge.session(sdk,{containerId:'mount',appId:'app',accessKey:'key',onReady:()=>ready=true});
 const late=sdk.listeners.get('loaded');session.dispose();late();assert.equal(ready,false);assert.equal(sdk.calls.length,1);
});
test('SDK cart events require an exact local variant instead of guessing a product',()=>{
 const catalog={'123':{title:'Local serum'}};
 assert.equal(bridge.cartVariant({skuId:'123'},catalog),'123');assert.equal(bridge.cartVariant({skuId:'gid://shopify/ProductVariant/123'},catalog),'123');assert.equal(bridge.cartVariant({skuId:'unknown',productName:'Local serum'},catalog),null);assert.equal(bridge.cartVariant({skuId:'__proto__'},catalog),null);
});
test('SDK result normalization and matching preserve actual scores and deduplicate variants',()=>{
 const report=core.normalize({outputs:[{skinData:{total_skin_score:82,skin_type:'combination',concerns:[{tech_name:'pores',value:70},{tech_name:'acne',value:50},{tech_name:'whiteheads',value:55}]}}]});
 assert.equal(report.score,82);assert.equal(report.concerns[0].id,'acne');
 assert.deepEqual(core.matches(report,{'48573386948765':{},'48573386588317':{}}).map(p=>p.id),['48573386948765','48573386588317']);
 assert.throws(()=>core.normalize({output:{error:'no face',status_code:422}}),/photo could not be analysed/);
});
test('only the two required public SDK fields are returned; REST scan endpoints are gone',async()=>{
 const server=http.createServer((req,res)=>serveSkinSdkConfig(req,res,{appId:'app-fixture',accessKey:'public-sdk-key',apiToken:'NEVER-RETURN'}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const response=await fetch(base+'/api/skin-analysis/sdk-config');assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{appId:'app-fixture',accessKey:'public-sdk-key'});
  assert.equal((await fetch(base+'/api/skin-analysis/scans',{method:'POST'})).status,404);
  assert.equal((await fetch(base+'/api/skin-analysis/sdk-config',{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/api/skin-analysis/sdk-config',{headers:{Origin:'https://foreign.example'}})).status,403);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('the merchant integration contains no custom camera, upload or direct scan API implementation',()=>{
 const js=fs.readFileSync(new URL('../theme/assets/skin-analysis.js',import.meta.url),'utf8');
 const template=fs.readFileSync(new URL('../theme/sections/skin-analysis.liquid',import.meta.url),'utf8');
 assert.doesNotMatch(js,/getUserMedia|createImageBitmap|toBlob\(|\/skin-analysis\/scans|canvas\.getContext/);
 assert.doesNotMatch(template,/<video|<canvas|type="file"|id="sa-report"/);
 assert.match(template,/id="glamar-skin-container"/);assert.equal(bridge.SDK_URL,'https://cdn.glamar.io/sdk/wrapper');
});
