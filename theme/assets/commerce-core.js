/* Pure cart operations shared by the local runtime and the Node test suite. */
(function(scope){
  'use strict';
  const clampQuantity=value=>Math.max(0,Math.min(99,Math.floor(Number(value)||0)));
  function normalize(lines,catalog){
    const merged=new Map();
    for(const line of Array.isArray(lines)?lines:[]) {
      const id=String(line.id);
      if(!catalog[id])continue;
      const quantity=clampQuantity((merged.get(id)||0)+clampQuantity(line.quantity));
      if(quantity)merged.set(id,quantity);
    }
    return [...merged].map(([id,quantity])=>({id,quantity}));
  }
  function add(lines,id,quantity,catalog){
    if(!catalog[String(id)])throw new Error('Please choose a product size.');
    return normalize([...lines,{id:String(id),quantity:Math.max(1,clampQuantity(quantity))}],catalog);
  }
  function update(lines,id,quantity,catalog){
    return normalize(lines.map(line=>line.id===String(id)?{...line,quantity:clampQuantity(quantity)}:line),catalog);
  }
  function totals(lines,catalog,coupon=''){
    const items=normalize(lines,catalog).map(line=>({...catalog[line.id],...line,key:line.id,final_line_price:catalog[line.id].price*line.quantity,line_price:catalog[line.id].price*line.quantity}));
    const subtotal=items.reduce((sum,line)=>sum+line.line_price,0);
    const discount=coupon==='LOCAL10'?Math.round(subtotal*.1):0;
    return {items,item_count:items.reduce((n,x)=>n+x.quantity,0),subtotal,total_price:subtotal-discount,total_discount:discount,currency:'INR',giftEligible:subtotal>=90000,freeShipping:subtotal>=90000,coupon};
  }
  scope.LngCommerce={normalize,add,update,totals};
})(globalThis);
