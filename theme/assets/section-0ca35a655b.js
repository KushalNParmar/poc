
    (function(){
      var root=document.getElementById('lvg-skinmaxxing-wordmark-sections--23927389945971__closing_wordmark_GCarKH');
      if(!root)return;
      var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function reveal(){root.classList.add('lvg-wordmark-on')}
      if(reduce||!('IntersectionObserver' in window)){reveal();return}
      var observer=new IntersectionObserver(function(entries){
        if(entries.some(function(entry){return entry.isIntersecting})){reveal();observer.disconnect()}
      },{threshold:.25});
      observer.observe(root);
    })();
  