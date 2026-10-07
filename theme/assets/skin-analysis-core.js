(function(root){
  'use strict';
  const names={acne:'Acne',pores:'Pores',wrinkles:'Fine lines & wrinkles',hydration:'Hydration',pigmentation:'Pigmentation',dark_circles:'Dark circles',eye_bags:'Eye bags',whiteheads:'Whiteheads',blackheads:'Blackheads',post_acne_scars:'Post-acne marks',redness:'Redness',texture:'Texture'};
  const alias={darkcircle:'dark_circles',darkcircles:'dark_circles',darkspots:'pigmentation',spots:'pigmentation',postacnescars:'post_acne_scars',acnescars:'post_acne_scars',eyebags:'eye_bags',finelines:'wrinkles',moisture:'hydration',dehydration:'hydration'};
  const key=value=>{const s=String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');return alias[s]||Object.keys(names).find(k=>k.replace(/_/g,'')===s)||null;};
  const number=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
  const score=value=>{const n=number(value);return n!==null&&n>=0&&n<=100?Math.round(n):null;};
  const text=value=>typeof value==='string'?value.slice(0,100):null;
  function output(payload){
    let p=payload;
    for(let i=0;i<6&&p&&typeof p==='object';i++){
      if(p.skinData||p.total_skin_score!==undefined||Array.isArray(p.concerns))return p;
      if(p.outputs?.[0])p=p.outputs[0];else if(p.output)p=p.output;else if(p.data)p=p.data;else if(p.value)p=p.value;else return p;
    }
    return p||{};
  }
  function normalize(payload){
    const out=output(payload);
    if(out.error||Number(out.status_code)>=400)throw new Error('The photo could not be analysed. Use a clear, evenly lit photo with one face looking straight ahead.');
    const skin=out.skinData||out;
    if(!skin||typeof skin!=='object')throw new Error('No skin report was returned. Please try again.');
    const seen=new Set();
    const concerns=(Array.isArray(skin.concerns)?skin.concerns:[]).flatMap(c=>{
      const id=key(c.tech_name||c.name||c.key),value=score(c.value??c.score);
      if(!id||value===null||seen.has(id))return [];seen.add(id);
      let image=null;try{const u=new URL(c.image);if(u.protocol==='https:'&&u.hostname==='cdn.pixelbin.io')image=u.href;}catch{}
      return [{id,name:names[id],score:value,severity:text(c.severity),image}];
    }).sort((a,b)=>a.score-b.score);
    const overall=score(skin.total_skin_score??skin.skin_score??skin.skinScore);
    if(overall===null&&!concerns.length)throw new Error('No usable skin scores were returned. Please try another photo.');
    const age=number(skin.skin_age);
    return {score:overall,skinType:text(skin.skin_type||skin.skinType),skinAge:age!==null&&age>=0&&age<=120?age:null,skinTone:text(skin.skin_tone),health:text(skin.skin_health),concerns};
  }
  function matches(report,catalog){
    const mapping={acne:'48573386948765',whiteheads:'48573386948765',blackheads:'48573386948765',pores:'48573386588317',pigmentation:'48573386588317',post_acne_scars:'48573386588317',hydration:'48573378461853'};
    const seen=new Set();
    return (report?.concerns||[]).filter(c=>c.score<75).sort((a,b)=>a.score-b.score).flatMap(c=>{const id=mapping[c.id];if(!id||!catalog[id]||seen.has(id))return [];seen.add(id);return [{id,concern:c.name,concernId:c.id}];});
  }
  const cleanText=value=>typeof value==='string'?value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,240):'';
  function safeURL(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}}
  function category(value){
    const name=String(value||'').toLowerCase();
    if(/cleanser|cleansing|face\s*wash/.test(name))return 'cleanser';
    if(/sunscreen|sunblock|\bspf\b/.test(name))return 'sunscreen';
    if(/\beye\b/.test(name))return 'eye';
    if(/moisturi[sz]|cream|lotion/.test(name))return 'moisturiser';
    if(/serum/.test(name))return 'serum';
    if(/toner|toning/.test(name))return 'toner';
    return 'other';
  }
  function recommendations(payload){
    let data=payload;
    for(let i=0;i<5&&data&&!Array.isArray(data)&&!Array.isArray(data.product_list)&&!Array.isArray(data.products);i++)data=data.data||data.output||data.value||data.recommendations;
    const list=Array.isArray(data)?data:data?.product_list||data?.products||[],seen=new Set();
    return list.slice(0,40).flatMap(p=>{
      if(!p||typeof p!=='object')return [];
      const title=cleanText(p.title||p.productName||p.name),sku=String(p.sku??p.skuId??p.id??'').slice(0,150),url=safeURL(p.product_url||p.url);
      if(!title||(!sku&&!url))return [];
      const id='sdk:'+encodeURIComponent(sku||url);if(seen.has(id))return [];seen.add(id);
      const rawPrice=[p.selling_price,p.mrp,p.price].find(value=>number(value)!==null&&Number(value)>0);
      const currency=/^[A-Za-z]{3}$/.test(p.currency||'')?p.currency.toUpperCase():null;
      const rawConcern=p.concern||p.target_concern||p.concerns||'';
      const concernText=cleanText(Array.isArray(rawConcern)?rawConcern.join(', '):rawConcern);
      const concerns=(Array.isArray(rawConcern)?rawConcern:String(rawConcern).split(/[;,/|]/)).map(key).filter(Boolean);
      return [{id,sku,source:'sdk',brand:cleanText(p.brand||p.brandName),title,image:safeURL(p.img||p.image||p.productImage),url,
        category:category(title)!=='other'?category(title):category(p.category||p.type),categoryLabel:cleanText(p.category||p.type),concerns,concernText,
        price:rawPrice===undefined?null:Math.round(Number(rawPrice)*100),currency,
        usage:cleanText(p.am_pm||p.when_to_use),description:cleanText(p.short_description||p.benefit)}];
    });
  }
  function localProduct(match,catalog,id=match.id){
    const p=catalog[id];
    const families={'acne-blemish-control-serum-30ml':['acne','whiteheads','blackheads'],'dark-spots-pore-control-serum-30ml':['pores','pigmentation','post_acne_scars'],'deep-hydration-glow-serum-30ml':['hydration']};
    return {...p,title:p.product_title,source:'lngvty',brand:'LNGVTY',currency:'INR',category:'serum',categoryLabel:'Serum',concerns:families[p.handle]||[match.concernId],concernText:match.concern,reason:`Matched to ${match.concern.toLowerCase()}`,matchId:match.id};
  }
  function regimen(report,sdkProducts,catalog,selected){
    const local=matches(report,catalog),chosen=local.find(m=>catalog[m.id].handle===catalog[selected]?.handle)||local[0];
    const primary=chosen?localProduct(chosen,catalog,selected&&catalog[selected]?.handle===catalog[chosen.id].handle?selected:chosen.id):null;
    const candidates=primary?[primary]:[],recommendations=local.map(m=>m===chosen?primary:localProduct(m,catalog)),covered=new Set(primary?.concerns||[]);
    for(const p of sdkProducts){
      if(Object.hasOwn(catalog,p.sku)&&catalog[p.sku].source!=='sdk'){
        const item=localProduct({id:p.sku,concern:p.concernText||'your skin report',concernId:p.concerns[0]},catalog);
        if(!candidates.some(product=>product.handle===item.handle))candidates.push(item);
        if(!recommendations.some(product=>product.handle===item.handle))recommendations.push(item);
        continue;
      }
      if(p.category==='serum'&&primary&&(!p.concerns.length||p.concerns.some(c=>covered.has(c))))continue;
      const item={...p,reason:p.concernText?`Recommended for ${p.concernText.toLowerCase()}`:p.description||'Recommended from your skin analysis'};
      candidates.push(item);recommendations.push(item);
    }
    // A recommendation grid can offer alternatives; the routine picks one product per role.
    const seen=new Set(),products=candidates.filter(p=>{
      const group=p.category==='other'||p.category==='serum'?p.category+':'+(p.concerns.join(',')||p.id):p.category;
      if(seen.has(group))return false;seen.add(group);return true;
    });
    const order={cleanser:0,toner:1,serum:2,eye:3,moisturiser:4,sunscreen:5,other:6};
    products.sort((a,b)=>order[a.category]-order[b.category]);
    return {products:products.slice(0,12),recommendations:recommendations.slice(0,24),local:local.map(m=>localProduct(m,catalog)),primary,alternatives:local.filter(m=>m!==chosen).map(m=>localProduct(m,catalog))};
  }
  function variants(product,catalog){
    if(product.source!=='lngvty')return [];
    const sizeOrder={'10ML':0,'30ML':1,'30+30ML':2};
    return Object.values(catalog).filter(p=>p.handle===product.handle&&p.source!=='sdk'&&Object.hasOwn(sizeOrder,p.variant_title?.replace(/\s/g,'').toUpperCase()))
      .sort((a,b)=>sizeOrder[a.variant_title.replace(/\s/g,'').toUpperCase()]-sizeOrder[b.variant_title.replace(/\s/g,'').toUpperCase()]);
  }
  function selectVariant(product,id,catalog){
    const variant=variants(product,catalog).find(p=>p.id===id);
    return variant?{...product,...variant,title:variant.product_title}:product;
  }
  root.LngSkin={normalize,matches,key,recommendations,regimen,variants,selectVariant,safeURL};
})(globalThis);
