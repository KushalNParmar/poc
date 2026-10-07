(function(root){
  'use strict';
  const SDK_URL='https://cdn.glamar.io/sdk/wrapper';
  function session(sdk,{containerId,appId,accessKey,onReady=()=>{},onResult=()=>{},onRecommendation=()=>{},onCapture=()=>{},onViewRecommendations=()=>{},onError=()=>{},onCameraIssue=()=>{},onCart=()=>{},onAddToCart=()=>{},onClosed=()=>{},onUnavailable=()=>{}}){
    let disposed=false,loaded=false;
    const listeners=[];
    const listen=(event,handler)=>{const guarded=value=>{if(!disposed)handler(value);};sdk.addEventListener(event,guarded);listeners.push([event,guarded]);};
    function ready(){if(disposed||loaded)return;loaded=true;onReady();}
    // The wrapper initializes its event bus in init. isLoaded covers a cached SDK.
    sdk.init(containerId,accessKey,{platform:'web',category:'skinanalysis',meta:{preloadMLModels:['face','light']},configuration:{skinAnalysis:{appId}}});
    listen('loaded',ready);
    listen('skin-analysis',payload=>{
      const option=String(payload?.option||payload?.options||'').toLowerCase();
      if(option==='result')onResult(payload.value);
      if(option==='recommendation')onRecommendation(payload.value);
      if(option==='capture')onCapture();
      if(option==='error')onError(payload.value);
    });
    listen('error',onError);
    listen('camera-access-issue',onCameraIssue);
    listen('add-to-cart',onAddToCart);
    listen('add-to-cart-global',onCart);
    listen('ui-interaction',event=>{if(event?.screenType==='saBottomNavigationPanel'&&event.buttonType==='product')onViewRecommendations();});
    listen('subscription-invalid',()=>onUnavailable('Skin analysis is temporarily unavailable. Please try again later.'));
    listen('closed',onClosed);
    if(sdk.isLoaded())ready();
    return {dispose(){if(disposed)return;disposed=true;listeners.forEach(([event,handler])=>sdk.removeEventListener(event,handler));if(loaded)sdk.close();},addedToCart(skuId){if(!disposed&&loaded&&typeof sdk.addedToCart==='function')sdk.addedToCart(skuId);}};
  }
  function cartVariant(payload,catalog){
    const id=String(payload?.skuId||'').replace(/^gid:\/\/shopify\/ProductVariant\//,'');
    return Object.hasOwn(catalog,id)?id:null;
  }
  function localRoute(event,link,origin){
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return null;
    const url=new URL(link.href,origin),path=url.pathname.replace(/\/$/,'')||'/';
    if(url.origin!==origin||url.search||url.hash||!['/','/pages/skin-analysis'].includes(path))return null;
    return path;
  }
  root.LngSkinSDK={SDK_URL,session,cartVariant,localRoute};
})(globalThis);
