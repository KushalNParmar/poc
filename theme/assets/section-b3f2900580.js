
(function(){
  function init(){
    var root = document.getElementById('rfdHero');
    if(!root || root.dataset.inited) return;
    root.dataset.inited = '1';

    var track = root.querySelector('.track');
    var slides= root.querySelectorAll('.slide');
    var dots  = root.querySelectorAll('.dots button');
    var prev  = root.querySelector('.arrow.prev');
    var next  = root.querySelector('.arrow.next');
    if(!track || slides.length === 0) return;

    var i = 0, timer = null;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var INTERVAL = 3000;

    function goTo(n){
      i = (n + slides.length) % slides.length;
      var left = slides[i].offsetLeft;
      if(track.scrollTo){
        track.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
      } else {
        track.scrollLeft = left;
      }
      for(var x=0;x<dots.length;x++){
        dots[x].setAttribute('aria-current', x === i ? 'true' : 'false');
      }
    }
    function start(){ if(reduced) return; stop(); timer = setInterval(function(){ goTo(i+1); }, INTERVAL); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }

    for(var k=0;k<dots.length;k++){
      (function(idx){ dots[idx].addEventListener('click', function(){ goTo(idx); start(); }); })(k);
    }
    if(prev) prev.addEventListener('click', function(){ goTo(i-1); start(); });
    if(next) next.addEventListener('click', function(){ goTo(i+1); start(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    track.addEventListener('touchstart', stop, {passive:true});
    track.addEventListener('touchend',   start, {passive:true});

    var swipeTimer;
    track.addEventListener('scroll', function(){
      clearTimeout(swipeTimer);
      swipeTimer = setTimeout(function(){
        var idx = Math.round(track.scrollLeft / track.clientWidth);
        if(idx !== i){
          i = idx;
          for(var x=0;x<dots.length;x++){
            dots[x].setAttribute('aria-current', x === i ? 'true' : 'false');
          }
        }
      }, 90);
    }, {passive:true});

    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });

    if(document.readyState === 'complete'){ start(); }
    else { window.addEventListener('load', start); }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
