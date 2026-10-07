(function(){
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=POC.money;
  let toastTimer;
  function toast(message){const box=$('#poc-toast');box.textContent=message;box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.hidden=true,3500);}
  function openDialog(id){const dialog=$(id);if(!dialog)return;$$('dialog[open]').forEach(d=>d.close());dialog.showModal();document.documentElement.style.overflow='hidden';}
  function closeDialog(dialog){dialog.close();document.documentElement.style.overflow='';}
  $$('dialog').forEach(dialog=>{
    dialog.addEventListener('close',()=>document.documentElement.style.overflow='');
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
  });
  function profile(){try{return JSON.parse(sessionStorage.getItem('lngvty.poc2.profile')||'null');}catch{return null;}}
  function orders(){try{return JSON.parse(localStorage.getItem('lngvty.poc2.orders')||'[]');}catch{return [];}}

  function lineMarkup(item,{readonly=false,gift=false}={}){
    return `<article class="poc-cart-item ${gift?'poc-gift':''}"><a href="${escape(item.url)}"><img src="${escape(item.image)}" alt="${escape(item.product_title)}" referrerpolicy="no-referrer"></a><div><h3><a href="${escape(item.url)}" style="color:inherit;text-decoration:none">${escape(item.product_title)}</a></h3><p>${gift?'Complimentary gift':escape(item.variant_title)}</p>${item.preorder?'<p>Pre-order. Ships from 15 October.</p>':''}<strong>${gift?'FREE':money(item.line_price??item.price*item.quantity)}</strong>${!gift?`<div class="poc-cart-item-footer">${readonly?`<span>Quantity: ${item.quantity}</span>`:`<div class="poc-quantity"><button type="button" data-quantity="${item.quantity-1}" data-id="${item.id}" aria-label="Decrease ${escape(item.product_title)} quantity">−</button><span aria-live="polite">${item.quantity}</span><button type="button" data-quantity="${item.quantity+1}" data-id="${item.id}" aria-label="Increase ${escape(item.product_title)} quantity" ${item.quantity>=99?'disabled':''}>+</button></div><button class="poc-remove" type="button" data-remove="${item.id}">Remove</button>`}</div>`:''}</div></article>`;
  }
  function totalsMarkup(cart,{checkout=false}={}){
    return `<div class="poc-totals"><div class="poc-total-row"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>${cart.total_discount?`<div class="poc-total-row"><span>Discount · LOCAL10</span><span>−${money(cart.total_discount)}</span></div>`:''}<div class="poc-total-row"><span>Shipping</span><span>${cart.freeShipping?'FREE':checkout?'Free in this demo':'Calculated at checkout'}</span></div><div class="poc-total-row"><strong>Total</strong><strong>${money(cart.total_price)}</strong></div>${!checkout?'<a class="poc-primary" href="/checkout">Checkout →</a>':''}<small style="display:block;margin-top:10px;color:#777;text-align:center">Inclusive of all taxes</small></div>`;
  }
  function cartMarkup({readonly=false,checkout=false}={}){
    const cart=POC.cart();
    if(!cart.items.length)return '<div class="poc-empty"><p>Nothing here</p><a class="poc-primary" href="/collections/frontpage">Explore products</a></div>';
    const gift=Object.values(POC.catalog).find(p=>p.gift);
    return `<div class="poc-cart-items">${cart.items.map(item=>lineMarkup(item,{readonly})).join('')}${cart.giftEligible&&gift?lineMarkup({...gift,quantity:1},{gift:true}):''}</div>${!checkout?`<form class="poc-coupon" data-coupon-form><input name="code" aria-label="Discount code" placeholder="Enter coupon code" value="${escape(cart.coupon)}"><button type="submit">Apply</button></form><small class="poc-coupon-help">Try LOCAL10 for a demo discount.</small>`:''}${totalsMarkup(cart,{checkout})}`;
  }
  function renderCart(){
    const cart=POC.cart();
    for(const selector of ['#poc-cart-content','#poc-page-cart-content']){const el=$(selector);if(el)el.innerHTML=cartMarkup();}
    $$('[data-cart-count]').forEach(el=>el.textContent=cart.item_count?`(${cart.item_count})`:'');
    const bubble=$('#cart-icon-bubble');
    if(bubble){let count=$('.cart-count-bubble',bubble);if(cart.item_count){if(!count){count=document.createElement('div');count.className='cart-count-bubble';bubble.append(count);}count.innerHTML=`<span aria-hidden="true">${cart.item_count}</span><span class="visually-hidden">${cart.item_count} items</span>`;}else count?.remove();}
    const shipping=$('[data-shipping-message]');if(shipping)shipping.textContent=cart.freeShipping?'You’ve unlocked free shipping + a free gift!':'Get free shipping on orders above ₹900';
    const summary=$('[data-checkout-summary]');if(summary)summary.innerHTML=cartMarkup({readonly:true,checkout:true});
  }
  function openCart(){renderCart();openDialog('#poc-cart');}
  document.addEventListener('poc:cart-change',renderCart);
  document.addEventListener('poc:open-cart',openCart);
  window.openCartDrawer=openCart;
  window.openKwikCart=openCart;
  window.gokwikSdk={initCheckout:()=>location.assign('/checkout'),init:()=>{}};

  function variantFor(el){
    let id=el.dataset.variantId||el.dataset.variant;
    if(id&&POC.catalog[id])return id;
    const href=el.getAttribute('href')||'';
    let match=href.match(/\/cart\/(\d+):/);if(match)return match[1];
    if(href.includes('/cart/add')){id=new URL(href,location.origin).searchParams.get('id');if(id)return id;}
    const form=el.closest('form')||(el.getAttribute('form')&&document.getElementById(el.getAttribute('form')));
    id=form?.querySelector('[name="id"]')?.value;if(id)return id;
    const card=el.closest('.card,.xsc,.lng-serums__card,[data-lp-product]');
    id=card?.getAttribute('data-selected-variant')||card?.querySelector('[data-variant-input],[name="id"]')?.value;if(id)return id;
    if(el.matches('.rail-atc'))return $('.lngvty-hero__form [name="id"]')?.value;
    if(el.matches('.rx-atc')){const handle=$('[id$="-r-view-btn"]')?.getAttribute('href')?.split('/').pop();return Object.values(POC.catalog).find(p=>p.handle===handle)?.id;}
    return null;
  }
  const purchaseSelector='[data-add-button],[data-add-to-cart],[data-purchase-action],.btn-add,.btn-buy,.xsc-add,.xsc-buy2,.rail-atc,.lp-buy-k7x2m__atc,.lp-buy-q3n8r__atc,.atc[data-variant],.lp-buynow-form button,.rx-atc,[data-lp-buy-now],[data-lp-sticky-cta],[data-lp-buy-btn],[data-lp-sticky-btn]';
  document.addEventListener('click',event=>{
    const el=event.target.closest('button,a,input[type=submit]');if(!el)return;
    if(el.matches('[data-close-dialog]')){event.preventDefault();closeDialog(el.closest('dialog'));return;}
    if(el.matches('[data-quantity],[data-remove]')){event.preventDefault();POC.update(el.dataset.id||el.dataset.remove,el.dataset.remove?0:el.dataset.quantity);return;}
    if(el.matches('[data-local-account],[data-login]')){event.preventDefault();event.stopImmediatePropagation();if(profile()){location.assign('/pages/kp-account');}else {otpStep=false;$('#poc-login-form').reset();$('#poc-otp-field').hidden=true;$('#poc-otp').required=false;$('#poc-phone').readOnly=false;$('#poc-login-submit').textContent='Continue';$('#poc-change-phone').hidden=true;$('#poc-login-error').textContent='';openDialog('#poc-login');}return;}
    if(el.matches('[data-reset-demo]')){for(const key of Object.keys(localStorage))if(key.startsWith('lngvty.poc2.'))localStorage.removeItem(key);sessionStorage.removeItem('lngvty.poc2.profile');POC.clear();renderAccount();toast('Demo data has been reset.');return;}
    if(el.matches('[data-logout]')){sessionStorage.removeItem('lngvty.poc2.profile');renderAccount();toast('You have been logged out.');return;}
    if(el.matches(purchaseSelector)){
      const id=variantFor(el);
      if(id){
        event.preventDefault();event.stopImmediatePropagation();
        const isBuy=el.matches('[data-purchase-action],.btn-buy,.xsc-buy2,[data-buy-now],.lp-buynow-form button,[data-lp-buy-now],[data-lp-sticky-cta],[data-lp-buy-btn],[data-lp-sticky-btn]');
        try{const qty=el.closest('form')?.querySelector('[name="quantity"]')?.value||1;POC.add(id,qty);if(isBuy)location.assign('/checkout');else openCart();}catch(error){toast(error.message);}
        return;
      }
    }
    if(el.matches('a[href="/cart"],#cart-icon-bubble')){event.preventDefault();event.stopImmediatePropagation();openCart();return;}
    if(el.matches('[data-review-photo]')){event.preventDefault();$('#poc-media-image').src=el.dataset.reviewPhoto;$('#poc-media-image').alt=el.dataset.alt||'Customer review photo';openDialog('#poc-media');}
    if(el.matches('[data-write-review]')){event.preventDefault();openDialog('#poc-review');}
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target;
    if(form.matches('[data-coupon-form]')){event.preventDefault();try{POC.applyCoupon(new FormData(form).get('code'));toast('Discount applied.');}catch(error){toast(error.message);}return;}
    if(form.id.startsWith('poc-'))return;
    if(form.matches('[action*="/cart/add"]')){event.preventDefault();event.stopImmediatePropagation();const data=new FormData(form);try{POC.add(data.get('id'),data.get('quantity')||1);if(event.submitter?.name==='checkout')location.assign('/checkout');else openCart();}catch(error){toast(error.message);}return;}
    if(form.matches('[data-local-form],form[action*="contact"]')){
      event.preventDefault();event.stopImmediatePropagation();if(!form.reportValidity())return;
      let message=$('.poc-contact-success',form);if(!message){message=document.createElement('div');message.className='poc-contact-success';message.setAttribute('role','status');form.prepend(message);}
      message.textContent='Thank you! Your message has been received in this demo. No message was sent.';
      form.reset();message.scrollIntoView({behavior:'smooth',block:'center'});
    }
  },true);

  let otpStep=false;
  $('#poc-login-form')?.addEventListener('submit',event=>{
    event.preventDefault();const error=$('#poc-login-error');error.textContent='';
    if(!otpStep){otpStep=true;$('#poc-otp-field').hidden=false;$('#poc-otp').required=true;$('#poc-login-submit').textContent='Verify & continue';$('#poc-change-phone').hidden=false;$('#poc-phone').readOnly=true;$('#poc-otp').focus();return;}
    if($('#poc-otp').value!=='123456'){error.textContent='Use the demo code 123456.';return;}
    sessionStorage.setItem('lngvty.poc2.profile',JSON.stringify({name:'LNGVTY Member',phone:$('#poc-phone').value}));
    closeDialog($('#poc-login'));renderAccount();toast('You’re logged in to your demo account.');document.dispatchEvent(new CustomEvent('poc:login'));
  });
  $('#poc-change-phone')?.addEventListener('click',()=>{otpStep=false;$('#poc-otp-field').hidden=true;$('#poc-otp').required=false;$('#poc-otp').value='';$('#poc-phone').readOnly=false;$('#poc-login-submit').textContent='Continue';$('#poc-change-phone').hidden=true;$('#poc-login-error').textContent='';$('#poc-phone').focus();});
  function renderAccount(){
    const root=$('#poc-account-content');if(!root)return;const user=profile();
    if(!user){root.innerHTML='<p>Log in to see your orders and manage your account.</p><button class="poc-primary" type="button" data-login>Log in</button><p><button class="poc-text-button" type="button" data-reset-demo>Reset demo data</button></p>';return;}
    root.innerHTML=`<p>Welcome back, ${escape(user.name)}.</p><p>+91 ${escape(user.phone)}</p><button type="button" class="poc-text-button" data-logout>Log out</button> · <button type="button" class="poc-text-button" data-reset-demo>Reset demo data</button><div class="poc-account-card"><h2>Your orders</h2>${orders().length?orders().map(o=>`<div class="poc-order"><div><strong>${escape(o.id)}</strong><p>${new Date(o.date).toLocaleDateString('en-IN')} · Demo order confirmed</p><p>${o.count} ${o.count===1?'item':'items'}</p></div><strong>${money(o.total)}</strong></div>`).join(''):'<p>No orders yet. Find the serum that works for you.</p><a href="/collections/frontpage" class="poc-primary">Shop serums</a>'}</div>`;
  }
  function renderCheckout(){
    const root=$('#poc-checkout-content');if(!root)return;
    if(!POC.cart().items.length){root.innerHTML=cartMarkup();return;}
    root.innerHTML=`<div class="poc-checkout-grid"><form id="poc-checkout-form"><a href="/cart" style="color:inherit">← Return to cart</a><h1>Checkout</h1><h2>Contact</h2><label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label><h2>Delivery</h2><div class="poc-row"><label>First name<input name="firstName" autocomplete="given-name" required></label><label>Last name<input name="lastName" autocomplete="family-name" required></label></div><label>Address<input name="address" autocomplete="street-address" required></label><div class="poc-row"><label>City<input name="city" autocomplete="address-level2" required></label><label>PIN code<input name="pincode" inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" autocomplete="postal-code" required></label></div><div class="poc-row"><label>State<input name="state" autocomplete="address-level1" required></label><label>Country<input name="country" value="India" readonly></label></div><label>Mobile number<input name="phone" type="tel" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel-national" required></label><h2>Payment</h2><p>Simulated payment — no card or bank details required.</p><button class="poc-primary" type="submit">Place demo order · ${money(POC.cart().total_price)}</button></form><aside class="poc-checkout-summary" data-checkout-summary>${cartMarkup({readonly:true,checkout:true})}</aside></div>`;
    $('#poc-checkout-form').addEventListener('submit',event=>{
      event.preventDefault();if(!event.target.reportValidity())return;
      const cart=POC.cart(),order={id:'LNG-DEMO-'+Date.now().toString().slice(-7),date:new Date().toISOString(),count:cart.item_count,total:cart.total_price,items:cart.items.map(({id,quantity})=>({id,quantity}))};
      localStorage.setItem('lngvty.poc2.orders',JSON.stringify([order,...orders()].slice(0,25)));POC.clear();
      root.innerHTML=`<div class="poc-complete"><span class="poc-complete-mark">✓</span><h1>Thank you.</h1><p>Your demo order <strong>${order.id}</strong> is confirmed.</p><p>No payment was collected and no shipment will be created.</p><a class="poc-primary" href="/collections/frontpage">Continue shopping</a></div>`;window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  const reviews=window.LNGVTY_REVIEWS||{};
  function imageModal(src,alt){$('#poc-media-image').src=src;$('#poc-media-image').alt=alt;openDialog('#poc-media');}
  function enhanceCarousels(){
    const all=Object.values(reviews).flat().filter(r=>r.image&&r.image!=='').sort((a,b)=>b.date.localeCompare(a.date));
    $$('.jdgm-cards-carousel').forEach(carousel=>{
      carousel.classList.remove('jdgm-hidden');carousel.classList.add('poc-carousel');
      const track=$('.jdgm-videos-container',carousel),wrapper=$('.jdgm-cards-wrapper',carousel);if(!track||!wrapper)return;
      track.innerHTML=all.slice(0,20).map(r=>`<button type="button" class="poc-review-tile" data-review-photo="${escape(r.image)}" data-alt="${escape(r.name)} review photo"><img src="${escape(r.image)}" alt="${escape(r.name)} review" loading="lazy"><div><span class="poc-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span><p>${escape(r.body)}</p><b>${escape(r.name)}</b><small>${escape(r.product)}</small></div></button>`).join('');
      $$('.jdgm-arrow',carousel).forEach((button,i)=>{button.removeAttribute('onclick');button.addEventListener('click',()=>wrapper.scrollBy({left:(i?1:-1)*wrapper.clientWidth*.8,behavior:'smooth'}));});
    });
  }
  function enhanceReviews(){
    const original=$('#judgeme_product_reviews');if(!original)return;
    const handle=location.pathname.split('/').pop();let local=[];try{local=JSON.parse(localStorage.getItem('lngvty.poc2.reviews.'+handle)||'[]');}catch{}
    let rows=[...local,...(reviews[handle]||[])];let sort='newest',filter='all',page=1;
    original.innerHTML='';original.removeAttribute('style');original.className='poc-reviews';
    function render(){
      const count=rows.length,average=count?rows.reduce((s,r)=>s+r.rating,0)/count:0;
      let list=rows.filter(r=>filter==='all'||filter==='media'&&r.image||Number(filter)===r.rating);
      list.sort((a,b)=>sort==='highest'?b.rating-a.rating:sort==='lowest'?a.rating-b.rating:b.date.localeCompare(a.date));
      const pages=Math.max(1,Math.ceil(list.length/5));page=Math.min(page,pages);
      original.innerHTML=`<h2>Customer Reviews</h2><div class="poc-review-summary"><div class="poc-rating"><span class="poc-stars">★★★★★</span><strong>${average.toFixed(2)} out of 5</strong><p>Based on ${count} reviews</p></div><div class="poc-histogram">${[5,4,3,2,1].map(n=>{const c=rows.filter(r=>r.rating===n).length;return `<button type="button" data-rating-filter="${n}" aria-label="Show ${n}-star reviews"><span>${'★'.repeat(n)}${'☆'.repeat(5-n)}</span><i><span style="width:${count?c/count*100:0}%"></span></i><span>${c}</span></button>`;}).join('')}</div><button type="button" class="poc-primary" data-write-review>Write a review</button></div><div class="poc-review-controls"><select aria-label="Filter reviews" id="poc-review-filter"><option value="all">All reviews</option><option value="media">With photos</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${n} stars</option>`).join('')}</select><select aria-label="Sort reviews" id="poc-review-sort"><option value="newest">Most recent</option><option value="highest">Highest rating</option><option value="lowest">Lowest rating</option></select></div><div>${list.slice((page-1)*5,page*5).map(r=>`<article class="poc-review-card"><time datetime="${escape(r.date)}">${new Date(r.date).toLocaleDateString('en-IN')}</time><span class="poc-stars" aria-label="${r.rating} stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span><header><span class="poc-review-avatar">${escape(r.name.charAt(0))}</span><span>${escape(r.name)}${r.local?' · Demo review':''}</span></header>${r.title?`<h3>${escape(r.title)}</h3>`:''}<p>${escape(r.body)}</p>${r.image?`<button type="button" class="poc-review-image" data-review-photo="${escape(r.image)}" data-alt="${escape(r.name)} review photo"><img src="${escape(r.image)}" loading="lazy" alt="${escape(r.name)} review photo"></button>`:''}</article>`).join('')||'<p>No reviews match this filter.</p>'}</div><nav class="poc-review-pagination" aria-label="Review pages">${Array.from({length:pages},(_,i)=>`<button type="button" data-review-page="${i+1}" aria-current="${i+1===page}">${i+1}</button>`).join('')}</nav>`;
      $('#poc-review-filter').value=filter;$('#poc-review-sort').value=sort;
      $('#poc-review-filter').addEventListener('change',e=>{filter=e.target.value;page=1;render();});
      $('#poc-review-sort').addEventListener('change',e=>{sort=e.target.value;page=1;render();});
      $$('[data-rating-filter]',original).forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.ratingFilter;page=1;render();}));
      $$('[data-review-page]',original).forEach(b=>b.addEventListener('click',()=>{page=Number(b.dataset.reviewPage);render();original.scrollIntoView({behavior:'smooth',block:'start'});}));
    }
    render();
    $$('.jdgm-preview-badge').forEach(b=>{b.setAttribute('role','button');b.tabIndex=0;const go=()=>original.scrollIntoView({behavior:'smooth'});b.addEventListener('click',go);b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
    $('#poc-review-form').addEventListener('submit',event=>{
      event.preventDefault();if(!event.target.reportValidity())return;const data=new FormData(event.target);
      const review={id:'local-'+Date.now(),name:data.get('name'),title:data.get('title'),body:data.get('body'),rating:Number(data.get('rating')),date:new Date().toISOString(),image:'',local:true};
      local.unshift(review);localStorage.setItem('lngvty.poc2.reviews.'+handle,JSON.stringify(local));rows=[...local,...(reviews[handle]||[])];page=1;sort='newest';filter='all';render();closeDialog($('#poc-review'));event.target.reset();toast('Your demo review has been saved locally.');
    });
  }
  // Browser lazy media must be initialized without the removed app loader.
  $$('img[data-src]:not([src])').forEach(img=>{img.src=img.dataset.src;img.loading='lazy';});
  $$('source[type="application/x-mpegURL"]').forEach(el=>el.remove());
  renderCart();renderAccount();renderCheckout();enhanceCarousels();enhanceReviews();
})();
