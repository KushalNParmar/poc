(function(){
  'use strict';
  const root=document.getElementById('lng-skin-analysis');if(!root)return;
  const $=s=>root.querySelector(s);
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let stage='intro',report=null,sdkProducts=[],session=null,stopped=false,ready=false,loadingTimer=null;
  const sizeSelections=new Map();
  let currentProducts=[];
  let controller=null,bootPromise=null,scriptPromise=null,generation=0;
  function notice(message){$('#sa-notice').textContent=message;$('#sa-notice').hidden=!message;}
  function setStage(next,focus=true){
    stage=next;root.dataset.saScreen=next;
    $('#sa-landing').hidden=next!=='intro';$('#sa-recommendations').hidden=next!=='recommendations';
    const scanner=$('#sa-sdk-section');scanner.inert=next!=='sdk';
    if(next==='sdk')scanner.removeAttribute('aria-hidden');else scanner.setAttribute('aria-hidden','true');
    if(focus){const heading=$(next==='intro'?'#sa-sdk-title':next==='sdk'?'#sa-scan-title':'#sa-recommendations-title');heading.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  }
  function resetResults(){report=null;sdkProducts=[];sizeSelections.clear();currentProducts=[];$('#sa-sdk-result-actions').hidden=true;$('#sa-recommendations-content').innerHTML='';}
  function updateResults(){
    $('#sa-sdk-result-actions').hidden=!report&&!sdkProducts.length;
    if(stage==='recommendations')renderRecommendations();
  }
  function failure(message){clearTimeout(loadingTimer);root.dataset.sdkState='error';$('#sa-sdk-loading-label').textContent=message;$('#sa-sdk-loading').hidden=false;$('[data-sa-action="retry"]').hidden=false;}
  function sdkError(error){
    const message=typeof error==='string'?error:String(error?.message||error?.error||'');
    const explanation=/domain|origin|whitelist/i.test(message)?'Skin analysis is not yet enabled for this website address.':'The analysis could not complete this step. Please follow the on-screen guidance or try again.';
    if(!ready)failure(explanation);else notice(explanation);
  }
  function stop(){
    if(stopped)return;stopped=true;generation++;bootPromise=null;clearTimeout(loadingTimer);controller?.abort();
    session?.dispose();session=null;$('#glamar-skin-container').replaceChildren();
    root.dataset.sdkState='closed';$('#sa-sdk-loading').hidden=true;resetResults();
  }
  function resetScan(){stop();setStage('intro');notice('');boot();}
  function loadSDK(){
    if(window.GlamAR)return Promise.resolve(window.GlamAR);
    if(scriptPromise)return scriptPromise;
    scriptPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=LngSkinSDK.SDK_URL;script.async=true;script.dataset.glamarSdk='true';
      script.onload=()=>window.GlamAR?resolve(window.GlamAR):reject(new Error('Skin analysis could not initialize. Please try again.'));
      script.onerror=()=>{script.remove();reject(new Error('Skin analysis could not load. Check your connection and try again.'));};
      document.head.append(script);
    }).catch(error=>{scriptPromise=null;throw error;});
    return scriptPromise;
  }
  function boot(){
    if(bootPromise)return bootPromise;
    const current=++generation;controller=new AbortController();stopped=false;ready=false;
    root.dataset.sdkState='loading';$('#sa-sdk-loading').hidden=false;$('#sa-sdk-loading-label').textContent='Preparing your skin analysis';
    $('[data-sa-action="retry"]').hidden=true;
    loadingTimer=setTimeout(()=>{if(!stopped&&!ready)failure('Skin analysis is taking longer than expected. Please check your connection and try again.');},45000);
    bootPromise=(async()=>{
      try{
        const [config,sdk]=await Promise.all([
          fetch('/api/skin-analysis/sdk-config',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Skin analysis is temporarily unavailable. Please try again later.');return response.json();}),loadSDK()
        ]);
        if(stopped||current!==generation)return;
        session=LngSkinSDK.session(sdk,{
          containerId:'glamar-skin-container',appId:config.appId,accessKey:config.accessKey,
          onReady(){ready=true;root.dataset.sdkState='ready';clearTimeout(loadingTimer);$('#sa-sdk-loading').hidden=true;},
          onCapture:resetResults,
          onResult(value){try{report=LngSkin.normalize(value);}catch{report=null;}updateResults();notice('');},
          onRecommendation(value){sdkProducts=LngSkin.recommendations(value);updateResults();},
          onViewRecommendations:openRecommendations,
          onError:sdkError,onCameraIssue(){notice('Camera access is unavailable. Allow camera access in your browser to continue.');},
          onUnavailable:failure,onClosed:resetScan,
          onCart(){document.dispatchEvent(new CustomEvent('poc:open-cart'));},
          onAddToCart(payload){
            const localId=LngSkinSDK.cartVariant(payload,POC.catalog);
            const product=sdkProducts.find(p=>p.sku===String(payload?.skuId));
            try{
              const id=localId||product&&POC.registerRecommendation(product);
              if(!id){notice('This product is available through its brand. Open your recommendations to view its details.');return;}
              POC.add(id,1);session?.addedToCart(payload.skuId);document.dispatchEvent(new CustomEvent('poc:open-cart'));
            }catch(error){notice(error.message);}
          }
        });
        const frame=$('#glamar-skin-container iframe');if(frame)frame.title='Skin analysis';
      }catch(error){if(!stopped&&current===generation)failure(error.message||'Skin analysis could not load. Please try again.');}
    })();return bootPromise;
  }
  function openRecommendations(){if(!report&&!sdkProducts.length)return;renderRecommendations();setStage('recommendations');}
  function priceLabel(product){
    if(product.price===null||!product.currency)return 'Price unavailable';
    if(product.currency==='INR')return 'Rs. '+(product.price/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
    try{return new Intl.NumberFormat('en-IN',{style:'currency',currency:product.currency}).format(product.price/100);}catch{return 'Price unavailable';}
  }
  const collectionCards={
    'acne-blemish-control-serum-30ml':{title:'Acne + Blemish Control',image:'/assets/media/Acne-40c9319372.png',dot:'lime'},
    'dark-spots-pore-control-serum-30ml':{title:'Dark Spots + Pore Control',image:'/assets/media/Darkspots-8092b6e6c8.png',dot:'orange'},
    'deep-hydration-glow-serum-30ml':{title:'Deep Hydration + Glow',image:'/assets/media/Glow-45f0ea8b6e.png',dot:'green'}
  };
  function productImage(p,collection=false){
    const src=collection&&p.source==='lngvty'?collectionCards[p.handle]?.image||p.image:p.image;
    return src?`<img src="${escape(src)}" alt="${escape(p.title)}" loading="lazy" referrerpolicy="no-referrer">`:'<span>Product image unavailable</span>';
  }
  function productLink(p,content,className){
    return p.url?`<a class="${className}" href="${escape(p.url)}" ${p.source==='lngvty'?'':'target="_blank" rel="noopener noreferrer"'}>${content}</a>`:`<div class="${className}">${content}</div>`;
  }
  function purchaseActions(p,buy=true){
    const canAdd=p.source==='lngvty'||(p.currency==='INR'&&p.price>0);
    if(!canAdd)return p.url?`<div class="cta-row">${productLink(p,'View product','sa-external-product')}</div>`:'';
    return `<div class="cta-row"><button type="button" class="btn-add" data-sa-add="${escape(p.id)}">${p.preorder?'Pre-order now':'Add to cart'}</button>${buy?`<button type="button" class="btn-buy" data-sa-buy="${escape(p.id)}">Buy now</button>`:''}</div>`;
  }
  const productKey=p=>p.source==='lngvty'?p.handle:p.id;
  function sizePicker(p){
    const local=p.source==='lngvty',variants=LngSkin.variants(p,POC.catalog);
    const options=local?variants.map(v=>({value:v.id,label:v.variant_title.replace(/\s/g,'').toLowerCase()})):['10ml','30ml','30+30ml'].map(label=>({value:label,label}));
    const active=local?p.id:sizeSelections.get(productKey(p))||'30ml';
    return `<div class="size-picker" role="group" aria-label="${local?'Choose size':'Demo size options'} for ${escape(p.title)}">${options.map(option=>`<button type="button" class="size-box${active===option.value?' is-active':''}" data-sa-size="${escape(option.value)}" aria-pressed="${active===option.value}">${escape(option.label)}</button>`).join('')}</div>`;
  }
  function productCard(p){
    const local=p.source==='lngvty'?collectionCards[p.handle]:null;
    return `<article class="card" data-sa-product="${escape(productKey(p))}" aria-label="${escape(p.title)}">${productLink(p,`<div class="thumb">${productImage(p,true)}</div>`,'thumb-link')}<div class="label-row">${local?`<span class="dot ${local.dot}" aria-hidden="true"></span>`:''}<span class="label">${escape(local?.title||p.title)}</span></div>${sizePicker(p)}<div class="price-row" aria-live="polite" aria-atomic="true"><span class="price-current">${priceLabel(p)}</span></div>${purchaseActions(p)}${p.url?productLink(p,'View full details →','view-link'):''}</article>`;
  }
  function selectSize(button){
    const card=button.closest('[data-sa-product]'),key=card.dataset.saProduct,index=currentProducts.findIndex(p=>productKey(p)===key);
    if(index<0)return;
    const current=currentProducts[index],value=button.dataset.saSize;
    const next=LngSkin.selectVariant(current,value,POC.catalog);
    if(current.source==='lngvty'&&next.id!==value)return;
    sizeSelections.set(key,value);currentProducts[index]=next;
    card.querySelectorAll('[data-sa-size]').forEach(control=>{const active=control.dataset.saSize===value;control.classList.toggle('is-active',active);control.setAttribute('aria-pressed',String(active));});
    card.querySelector('.price-current').textContent=priceLabel(next);
    const add=card.querySelector('[data-sa-add]'),buy=card.querySelector('[data-sa-buy]');
    if(add){add.dataset.saAdd=next.id;add.textContent=next.preorder?'Pre-order now':'Add to cart';}
    if(buy)buy.dataset.saBuy=next.id;
  }
  function renderRecommendations(){
    const plan=LngSkin.regimen(report,sdkProducts,POC.catalog),panel=$('#sa-recommendations-content');
    const products=plan.recommendations.map(p=>LngSkin.selectVariant(p,sizeSelections.get(productKey(p)),POC.catalog));
    currentProducts=products;
    $('#sa-recommendations-count').textContent=products.length?`${products.length} ${products.length===1?'product':'products'}`:'';
    if(!products.length){panel.innerHTML=`<div class="sa-empty"><h3>Your report comes first.</h3><p>${report?'Your analysis has not returned matching products yet. Recommendations will appear here when available.':'No products were returned for this analysis.'}</p><button class="sa-button" data-sa-action="results">Back to my report ↗</button></div>`;return;}
    panel.innerHTML=`<div class="grid">${products.map(productCard).join('')}</div>`;
  }
  root.addEventListener('error',event=>{if(event.target.matches?.('.sa-catalog .thumb img')){const note=document.createElement('span');note.textContent='Product image unavailable';event.target.replaceWith(note);}},true);
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-sa-action],[data-sa-size],[data-sa-add],[data-sa-buy]');if(!button)return;
    try{
      if(button.dataset.saSize){selectSize(button);return;}
      if(button.dataset.saAdd||button.dataset.saBuy){const id=button.dataset.saAdd||button.dataset.saBuy,product=sdkProducts.find(p=>p.id===id);if(product&&!POC.registerRecommendation(product))throw new Error('Please view this product on its brand’s website.');POC.add(id,1);if(button.dataset.saBuy)location.assign('/checkout');else document.dispatchEvent(new CustomEvent('poc:open-cart'));return;}
      switch(button.dataset.saAction){
        // Initialization already runs on page load. This control only reveals the frame.
        case 'start':setStage('sdk');break;
        case 'retry':stop();boot();break;
        case 'close':case 'new-scan':resetScan();break;
        case 'recommendations':openRecommendations();break;
        case 'results':setStage('sdk');break;
      }
    }catch(error){notice(error.message);}
  });
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  // Only the home/skin pair uses same-document navigation. Other Liquid routes
  // keep their normal navigation; the SDK frame never moves or gets reparented.
  if(root.hasAttribute('data-sa-preload')){
    const homeTitle=document.title,homeDescription=document.querySelector('meta[name="description"]')?.content||'';
    const homeSections=[...document.querySelector('#MainContent').children].filter(node=>node!==root&&!['SCRIPT','LINK'].includes(node.tagName));
    let showingSkin=false,homeScroll=0;
    function renderRoute(){
      const skin=location.pathname.replace(/\/$/,'')==='/pages/skin-analysis';
      if(skin===showingSkin)return;
      if(skin)homeScroll=window.scrollY;
      showingSkin=skin;
      document.body.dataset.saView=skin?'skin':'home';document.body.dataset.page=skin?'/pages/skin-analysis':'/';
      root.toggleAttribute('data-sa-preload',!skin);root.inert=!skin;
      if(skin)root.removeAttribute('aria-hidden');else root.setAttribute('aria-hidden','true');
      homeSections.forEach(node=>{node.inert=skin;});
      document.title=skin?'Skin Analysis | LNGVTY':homeTitle;
      const description=document.querySelector('meta[name="description"]');if(description)description.content=skin?'Understand your skin and find products matched to its needs.':homeDescription;
      document.querySelectorAll('a[href="/pages/skin-analysis"]').forEach(link=>{if(skin)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
      const drawer=document.querySelector('header-drawer');
      if(drawer?.querySelector('details[open]')){
        const summary=drawer.querySelector('summary');
        drawer.closeMenuDrawer?.({type:'navigation'},summary);summary?.setAttribute('aria-expanded','false');
      }
      if(skin){
        document.querySelectorAll('#MainContent video').forEach(video=>video.pause());
        boot();window.scrollTo({top:0,behavior:'instant'});$('#sa-sdk-title').focus({preventScroll:true});
      }else{
        // Discard any scan/camera session before warming a fresh hidden instance.
        stop();setStage('intro',false);boot();window.scrollTo({top:homeScroll,behavior:'instant'});
        document.querySelector('#MainContent').focus({preventScroll:true});
      }
    }
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');if(!link)return;
      const next=LngSkinSDK.localRoute(event,link,location.origin);if(!next)return;
      event.preventDefault();
      if(location.pathname!==next)history.pushState(null,'',next);
      renderRoute();
    });
    window.addEventListener('popstate',renderRoute);
  }
  setStage('intro',false);
  boot();
})();
