
(function(){
  function initReveal(){
    document.documentElement.classList.add('js');
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var items=[].slice.call(document.querySelectorAll('.rv'));
    if(!('IntersectionObserver' in window)||reduce){items.forEach(function(e){e.classList.add('in');});}
    else{
      var io=new IntersectionObserver(function(en){en.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},
        {rootMargin:'0px 0px -6% 0px',threshold:.1});
      items.forEach(function(e){io.observe(e);});
    }

    var bar=document.getElementById('bar'),end=document.getElementById('pick'),first=document.querySelector('.fullbanner');
    if(bar&&end&&first&&'IntersectionObserver' in window){
      var past=false,atEnd=false;
      function paint(){var on=past&&!atEnd;bar.classList.toggle('show',on);
        bar.setAttribute('aria-hidden',on?'false':'true');
        var b=bar.querySelector('.btn');if(b)b.tabIndex=on?0:-1;}
      new IntersectionObserver(function(e){past=!e[0].isIntersecting;paint();},{threshold:0}).observe(first);
      new IntersectionObserver(function(e){atEnd=e[0].isIntersecting;paint();},{threshold:.15}).observe(end);
    }
  }

  // Custom Liquid blocks on a page don't always finish being added to the
  // DOM in the order their file numbers suggest — it depends on how they
  // were dragged into place in the theme editor. Querying for .rv elements
  // too early can miss ones that haven't rendered yet, and they'd then stay
  // invisible forever (opacity:0, no scroll-reveal listener watching them).
  // Waiting for the full page load removes that ordering dependency.
  if(document.readyState==='complete'){initReveal();}
  else{window.addEventListener('load', initReveal);}
})();
