import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../theme/assets/skin-analysis-core.js';
import '../theme/assets/recommendation-cart.js';
import '../theme/assets/commerce-core.js';
const core=globalThis.LngSkin,cart=globalThis.LngRecommendationCart,C=globalThis.LngCommerce;
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
const acne='48573386948765',small='48573386981533';
const products=core.recommendations({data:{product_list:[
 {sku:'wash',brand:'Fixture Brand',title:'Gentle cleanser',category:'Cleanser',img:'https://images.example.com/wash.jpg',selling_price:450,currency:'inr',product_url:'https://brand.example.com/wash',am_pm:'AM / PM'},
 {sku:'acne',brand:'Fixture Brand',title:'Blemish serum',category:'Serum',concern:'acne',price:600,currency:'inr'},
 {sku:'eye',brand:'Fixture Brand',title:'Eye cream',category:'Eye care',concern:'dark circles',price:650,currency:'inr'},
 {sku:'spf',brand:'Fixture Brand',title:'Sunscreen',category:'Sunscreen',price:700,currency:'inr',am_pm:'AM'}
]}});
const report=core.normalize({skinData:{total_skin_score:72,concerns:[{tech_name:'acne',value:40},{tech_name:'pores',value:65},{tech_name:'dark_circles',value:38}]}});

test('native recommendation payload retains real brands, images, usage and currency units',()=>{
 assert.equal(products.length,4);assert.equal(products[0].price,45000);assert.equal(products[0].currency,'INR');assert.equal(products[0].usage,'AM / PM');assert.equal(products[0].brand,'Fixture Brand');assert.equal(products[2].category,'eye');
 assert.deepEqual(core.recommendations({data:{product_list:[]}}),[]);
 const [unsafe]=core.recommendations([{sku:'unsafe',title:'<b>Name</b>',img:'javascript:bad()',product_url:'https://user:password@example.com',currency:'INR'}]);
 assert.equal(unsafe.title,'Name');assert.equal(unsafe.url,'');assert.equal(unsafe.image,'');assert.equal(unsafe.price,null);
});
test('blend prefers a relevant LNGVTY serum and fills missing categories with SDK products',()=>{
 const plan=core.regimen(report,products,catalog);
 assert.deepEqual(plan.products.map(p=>p.id),['sdk:wash',acne,'sdk:eye','sdk:spf']);
 assert.equal(plan.alternatives.length,1);assert.equal(plan.primary.source,'lngvty');
 const resized=core.regimen(report,products,catalog,small);assert.equal(resized.primary.id,small);assert.equal(resized.primary.price,49900);
});
test('unsupported concerns and healthy scores do not force an unrelated LNGVTY serum',()=>{
 const wrinkles=core.normalize({skinData:{concerns:[{tech_name:'wrinkles',value:30},{tech_name:'hydration',value:95}]}});
 const recommended=core.recommendations([{sku:'lines',title:'Line care serum',category:'Serum',concern:'wrinkles',price:900,currency:'USD'}]);
 const plan=core.regimen(wrinkles,recommended,catalog);assert.equal(plan.primary,null);assert.equal(plan.products[0].id,'sdk:lines');assert.equal(plan.products[0].currency,'USD');
 const exact=core.regimen(null,core.recommendations([{sku:acne,title:'Native local match',category:'Serum'}]),catalog);assert.equal(exact.products[0].source,'lngvty');assert.equal(exact.products[0].price,104900);
});
test('external demo cart restores only validated public product data and preserves totals',()=>{
 const p={...products[0],photo:'PRIVATE',scores:{acne:20},scanId:'PRIVATE'};
 const record=cart.normalize(p);assert.ok(record);assert.equal(record.price,45000);assert.equal(record.photo,undefined);assert.equal(record.scores,undefined);
 const restored={...catalog};cart.restore(JSON.parse(JSON.stringify([record])),restored);
 const lines=C.add(C.add([],acne,1,restored),record.id,2,restored);
 assert.equal(C.totals(lines,restored).total_price,194900);
 assert.equal(cart.normalize({...p,currency:'USD'}),null);assert.equal(cart.normalize({...p,price:null}),null);
 assert.equal(cart.normalize({...p,id:acne}),null);assert.equal(cart.normalize({...p,id:'__proto__'}),null);
 assert.equal(cart.normalize({...p,url:'javascript:alert(1)',image:'data:image/svg+xml,unsafe'}).image,'/assets/product-placeholder.svg');
});
test('the merchant skin page has no login gate or additional vendor branding',()=>{
 const template=fs.readFileSync(new URL('../theme/sections/skin-analysis.liquid',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../theme/assets/skin-analysis.js',import.meta.url),'utf8');
 assert.doesNotMatch(template,/POWERED BY|GlamAR|data-login|sa-login-trigger/);
 assert.doesNotMatch(js,/signedIn\(|loginPending|poc:login|lngvty\.poc2\.profile/);
});

test('recommendations retain alternatives and normalize conflicting product categories',()=>{
 const mixed=core.recommendations([
  {sku:'b5',title:'Vitamin B5 Face Moisturizer',category:'Cleanser',concern:'acne; hydration',price:300,currency:'INR'},
  {sku:'hydra',title:'Sebium Hydra Ultra-Moisturising Cream',category:'Sunscreen',price:1195,currency:'INR'},
  {sku:'cleanse',title:'Gentle Face Wash',category:'Cleanser',price:299,currency:'INR'},
  {sku:'protect',title:'Daily Sunscreen SPF 50',category:'Sunscreen',price:449,currency:'INR'}
 ]);
 assert.equal(mixed[0].category,'moisturiser');assert.equal(mixed[1].category,'moisturiser');assert.deepEqual(mixed[0].concerns,['acne','hydration']);
 const plan=core.regimen(report,mixed,catalog);
 assert.ok(plan.recommendations.some(p=>p.id==='sdk:b5'));assert.ok(plan.recommendations.some(p=>p.id==='sdk:hydra'));
 assert.equal(plan.recommendations.filter(p=>p.source==='lngvty').length,2);
 });

test('each LNGVTY size resolves to its own price and cart variant without changing other products',()=>{
 const matches=core.regimen(report,products,catalog).recommendations;
 const first=matches.find(p=>p.id===acne),dark=matches.find(p=>p.handle==='dark-spots-pore-control-serum-30ml');
 assert.deepEqual(core.variants(first,catalog).map(p=>p.id),[small,acne,'48794741473437']);
 const smallAcne=core.selectVariant(first,small,catalog),bundle=core.selectVariant(first,'48794741473437',catalog);
 assert.equal(smallAcne.price,49900);assert.equal(bundle.price,188820);assert.equal(dark.price,119900);
 assert.equal(core.selectVariant(first,dark.id,catalog),first);
 const lines=C.add(C.add([],smallAcne.id,1,catalog),bundle.id,1,catalog);
 assert.deepEqual(lines.map(line=>line.id),[small,'48794741473437']);
 assert.equal(C.totals(lines,catalog).total_price,238720);
 assert.equal(core.selectVariant(first,undefined,catalog),first);
});
test('SDK demo size choices never replace the returned product or change its price',()=>{
 const product=products[0];
 for(const size of ['10ml','30ml','30+30ml',small])assert.equal(core.selectVariant(product,size,catalog),product);
 assert.deepEqual(core.variants(product,catalog),[]);
 const local=core.regimen(null,core.recommendations([{sku:small,title:'SDK local match'}]),catalog).recommendations[0];
 assert.equal(local.id,small);assert.equal(core.variants(local,catalog).length,3);
});
