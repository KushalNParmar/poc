
(function(){
  // This mirrors, almost line for line, the actual working "Add to cart"
  // script already running on your Serums collection page (decoded straight
  // from that button's own onclick handler). The key difference from what I
  // had before: it does NOT reload or redirect on success. It just fetches
  // /cart/add.js, flips the button text to "Added", and resets it after
  // 1.5s. My earlier version called window.location.reload(), and inside
  // the Shopify theme editor's preview iframe that reload is almost
  // certainly what was bouncing you to the home page — this version never
  // navigates on success, so that can't happen anymore.
  [].slice.call(document.querySelectorAll('#serums .atc')).forEach(function(atc){
    atc.addEventListener('click', function(e){
      var card = atc.closest('.card');
      var variantId = card.getAttribute('data-variant');
      if(!variantId){ return; } // let the href handle it
      e.preventDefault();
      var originalText = atc.textContent;
      atc.textContent = 'Adding…';
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({items: [{id: variantId, quantity: 1}]})
      }).then(function(res){
        if(!res.ok){ throw new Error('add to cart failed'); }
        return res.json();
      }).then(function(){
        atc.textContent = 'Added';
        setTimeout(function(){ atc.textContent = originalText; }, 1500);
      }).catch(function(){
        atc.textContent = originalText;
        window.location.href = atc.href;
      });
    });
  });

  // Buy now is intentionally left with NO click handler of our own. Each
  // button now sits inside a real <form action="/cart/add" method="post">
  // with a proper hidden name="id" input — the same structure GoKwik's own
  // checkout accelerator looks for when it scans the page on load. With
  // that structure in place, GoKwik claims the button itself and runs its
  // real one-click checkout flow, instead of us bypassing it and sending
  // people to Shopify's plain checkout. (Wiring our own handler here would
  // just fight GoKwik's, the same problem as before.)

  // Mobile carousel dot sync
  var rail=document.getElementById('serums'),dots=document.getElementById('carddots');
  if(rail&&dots){
    var marks=dots.querySelectorAll('i');
    rail.addEventListener('scroll',function(){
      var i=Math.round(rail.scrollLeft/(rail.scrollWidth/marks.length));
      if(i>marks.length-1)i=marks.length-1;
      for(var k=0;k<marks.length;k++)marks[k].className=(k===i?'on':'');
    },{passive:true});
  }
})();
