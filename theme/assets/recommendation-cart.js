/* Public product data only. Scan photos, scores and reports never enter the cart. */
(function(root){
  'use strict';
  const text=value=>typeof value==='string'?value.slice(0,240):'';
  function https(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
  function normalize(product){
    if(!product||product.source!=='sdk'||typeof product.id!=='string'||!product.id.startsWith('sdk:')||product.id.length>600)return null;
    if(product.currency!=='INR'||!Number.isSafeInteger(product.price)||product.price<=0||product.price>100000000)return null;
    const title=text(product.title||product.product_title);if(!title)return null;
    return {id:product.id,source:'sdk',currency:'INR',title,product_title:title,brand:text(product.brand),
      variant_title:[text(product.brand),'Recommended care'].filter(Boolean).join(' · '),handle:product.id,
      price:product.price,url:https(product.url)||'/pages/skin-analysis',image:https(product.image)||'/assets/product-placeholder.svg',preorder:false,gift:false};
  }
  function restore(products,catalog){
    for(const value of (Array.isArray(products)?products:[]).slice(0,40)){const product=normalize(value);if(product)catalog[product.id]=product;}
  }
  root.LngRecommendationCart={normalize,restore};
})(globalThis);
