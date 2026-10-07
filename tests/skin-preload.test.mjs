import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../theme/assets/skin-analysis-sdk.js';

// Exercise the real page controller, including a click before config finishes.
// The fake DOM/SDK makes the lifetime checks deterministic without a camera.
function harness(){
  const elements=new Map(),documentEvents=new Map(),windowEvents=new Map(),rootEvents=new Map(),sdkEvents=new Map(),calls=[];
  function element(){
    const attributes=new Set();
    return {dataset:{},children:[],hidden:false,inert:false,textContent:'',content:'Home description',
      hasAttribute:name=>attributes.has(name),setAttribute:name=>attributes.add(name),removeAttribute:name=>attributes.delete(name),
      toggleAttribute(name,on){if(on)attributes.add(name);else attributes.delete(name);},
      querySelector:selector=>get(selector),querySelectorAll:()=>[],addEventListener(){},focus(){},scrollIntoView(){},replaceChildren(){this.children=[];}};
  }
  const get=selector=>{if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);};
  const root=get('#lng-skin-analysis');root.setAttribute('data-sa-preload');root.setAttribute('aria-hidden');root.inert=true;
  root.addEventListener=(event,handler)=>rootEvents.set(event,handler);
  const home=get('#sa-home-content');get('#MainContent').children=[home,root];
  const location={origin:'http://127.0.0.1:8765',pathname:'/',reload(){calls.push('reload');}};
  let resolveConfig,fetches=0,loaded=false;
  const config=new Promise(resolve=>{resolveConfig=resolve;});
  const sdk={
    init(){calls.push('init');loaded=false;get('#glamar-skin-container').children=[element()];},
    addEventListener:(event,handler)=>sdkEvents.set(event,handler),
    removeEventListener:(event,handler)=>{if(sdkEvents.get(event)===handler)sdkEvents.delete(event);},
    isLoaded:()=>loaded,skinAnalysis:()=>calls.push('start'),close:()=>calls.push('close')
  };
  const context={URL,AbortController,setTimeout,clearTimeout,location,GlamAR:sdk,LngSkinSDK:globalThis.LngSkinSDK,
    history:{pushState(state,title,url){location.pathname=url;}},
    fetch:()=>{fetches++;return config;},
    document:{title:'Home',body:element(),getElementById:id=>id==='lng-skin-analysis'?root:null,
      querySelector:selector=>selector==='header-drawer'?null:get(selector),querySelectorAll:()=>[],
      addEventListener:(event,handler)=>documentEvents.set(event,handler)},
    addEventListener:(event,handler)=>windowEvents.set(event,handler),scrollY:80,scrollTo(){}
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(new URL('../theme/assets/skin-analysis.js',import.meta.url),'utf8'),context);
  return {root,home,calls,get,location,context,fetches:()=>fetches,
    resolve(){resolveConfig({ok:true,json:async()=>({appId:'fixture',accessKey:'fixture'})});},
    action(action){rootEvents.get('click')({target:{closest:()=>({dataset:{saAction:action}})}});},
    ready(){loaded=true;sdkEvents.get('loaded')?.();},
    navigate(path){const link={href:location.origin+path,target:'',hasAttribute:()=>false};let prevented=false;documentEvents.get('click')({button:0,target:{closest:()=>link},preventDefault(){prevented=true;}});assert.ok(prevented);},
    back(){location.pathname='/';windowEvents.get('popstate')();},
    dispose(){windowEvents.get('pagehide')();}
  };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('homepage initializes once while hidden; Analyse only reveals the same SDK without method calls',async()=>{
  const h=harness();
  try{
    assert.equal(h.fetches(),1);assert.equal(h.root.inert,true);
    h.resolve();await flush();h.ready();
    assert.deepEqual(h.calls,['init']);assert.equal(h.root.inert,true);assert.equal(h.root.dataset.sdkState,'ready');
    const frame=h.get('#glamar-skin-container').children[0];
    h.navigate('/pages/skin-analysis');await flush();
    assert.equal(h.location.pathname,'/pages/skin-analysis');assert.equal(h.root.inert,false);assert.equal(h.home.inert,true);
    assert.equal(h.get('#glamar-skin-container').children[0],frame);assert.deepEqual(h.calls,['init']);assert.equal(h.fetches(),1);
    assert.equal(h.get('#sa-sdk-section').inert,true);h.action('start');
    assert.equal(h.get('#sa-sdk-section').inert,false);assert.equal(h.root.dataset.saScreen,'sdk');assert.deepEqual(h.calls,['init']);
    assert.equal(h.get('#glamar-skin-container').children[0],frame);assert.equal(h.fetches(),1);
    h.action('start');assert.deepEqual(h.calls,['init']);
    h.back();await flush();
    assert.equal(h.root.inert,true);assert.equal(h.home.inert,false);assert.equal(h.context.document.title,'Home');
    assert.deepEqual(h.calls,['init','close','init']);assert.notEqual(h.get('#glamar-skin-container').children[0],frame);
  }finally{h.dispose();}
});

test('revealing during preload does not queue an SDK start; leaving cancels late initialization',async()=>{
  const h=harness();
  try{
    h.navigate('/pages/skin-analysis');h.navigate('/pages/skin-analysis');h.action('start');
    assert.equal(h.fetches(),1);assert.deepEqual(h.calls,[]);assert.equal(h.get('#sa-sdk-section').inert,false);h.resolve();await flush();
    assert.deepEqual(h.calls,['init']);h.ready();assert.deepEqual(h.calls,['init']);assert.equal(h.get('#sa-sdk-loading').hidden,true);
  }finally{h.dispose();}
  const leaving=harness();leaving.dispose();leaving.resolve();await flush();
  assert.deepEqual(leaving.calls,[]);assert.equal(leaving.root.dataset.sdkState,'closed');
});
