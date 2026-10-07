/* Local adapter. Never contacts Shopify, GoKwik, payment providers, or analytics. */
(function(){
  'use strict';
  const KEY='lngvty.poc2.cart.v1', C=window.LngCommerce, catalog=window.LNGVTY_CATALOG;
  let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{saved={};}
  window.LngRecommendationCart.restore(saved.recommendedProducts,catalog);
  let lines=C.normalize(saved.items,catalog),coupon=saved.coupon==='LOCAL10'?'LOCAL10':'';
  function snapshot(){return C.totals(lines,catalog,coupon);}
  function persist(){
    const recommendedProducts=lines.map(line=>catalog[line.id]).filter(product=>product?.source==='sdk');
    try{localStorage.setItem(KEY,JSON.stringify({items:lines,coupon,recommendedProducts}));}catch{}
    document.dispatchEvent(new CustomEvent('poc:cart-change',{detail:snapshot()}));
    return snapshot();
  }
  window.POC={
    cart:snapshot,
    add(id,qty=1){lines=C.add(lines,id,qty,catalog);return persist();},
    registerRecommendation(value){const product=window.LngRecommendationCart.normalize(value);if(!product)return null;catalog[product.id]=product;return product.id;},
    update(id,qty){lines=C.update(lines,id,qty,catalog);return persist();},
    clear(){lines=[];coupon='';return persist();},
    applyCoupon(code){if(code&&code.toUpperCase()!=='LOCAL10')throw new Error('That code is unavailable. Use LOCAL10 to try a demo discount.');coupon=code.toUpperCase();return persist();},
    money:value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:value%100?2:0}).format(value/100),
    catalog,
  };
  window.Shopify={locale:'en',country:'IN',currency:{active:'INR',rate:'1.0'},routes:{root:'/'},designMode:false,PaymentButton:{init(){}},bind:(fn,scope)=>fn.bind(scope)};
  window.jdgm={data:{reviewWidget:{}},docReady:fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()};
  window.routes={cart_add_url:'/cart/add.js',cart_change_url:'/cart/change.js',cart_update_url:'/cart/update.js',cart_url:'/cart',predictive_search_url:'/search/suggest'};
  window.cartStrings={error:'Please try again.',quantityError:'Please choose a quantity from 1 to 99.'};
  window.shopUrl=location.origin;
  const nativeFetch=window.fetch.bind(window);
  async function bodyData(body){
    if(body instanceof FormData||body instanceof URLSearchParams)return Object.fromEntries(body);
    if(typeof body==='string'){try{return JSON.parse(body);}catch{return Object.fromEntries(new URLSearchParams(body));}}
    return body||{};
  }
  window.fetch=async function(input,options={}){
    const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.origin);
    if(/^\/cart(?:\/|\.js|$)/.test(url.pathname)){
      const data=await bodyData(options.body),action=url.pathname.replace(/\.js$/,'');
      let result;
      try{
        if(action==='/cart/add'){
          for(const item of data.items||[data])POC.add(item.id,item.quantity||1);
          result={...POC.cart(),sections:{}};
          document.dispatchEvent(new Event('poc:open-cart'));
        }else if(action==='/cart/change'){
          const id=data.id||POC.cart().items[Number(data.line)-1]?.id; result=POC.update(id,data.quantity);
        }else if(action==='/cart/clear')result=POC.clear();
        else if(action==='/cart/update'){
          for(const [id,quantity]of Object.entries(data.updates||{}))POC.update(id,quantity);result=POC.cart();
        }else result=POC.cart();
        return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
      }catch(error){return new Response(JSON.stringify({status:422,description:error.message}),{status:422,headers:{'Content-Type':'application/json'}});}
    }
    const sdkPage=['/','/pages/skin-analysis'].includes(location.pathname.replace(/\/$/,'')||'/');
    const sdkRequest=sdkPage&&url.protocol==='https:'&&['cdn.glamar.io','api.glamar.fynd.com'].includes(url.hostname);
    if(url.origin!==location.origin&&!sdkRequest)throw new Error('External services are disabled in the local POC.');
    return nativeFetch(input,options);
  };
  addEventListener('storage',event=>{if(event.key===KEY){try{const s=JSON.parse(event.newValue||'{}');window.LngRecommendationCart.restore(s.recommendedProducts,catalog);lines=C.normalize(s.items,catalog);coupon=s.coupon==='LOCAL10'?'LOCAL10':'';document.dispatchEvent(new Event('poc:cart-change'));}catch{}}});
})();
