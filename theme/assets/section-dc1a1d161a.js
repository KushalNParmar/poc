
  // Shared scroll engine — guarded so it only initializes once even if
  // this section is placed on the page more than once. Each render just
  // asks the engine to pick up any new [data-rs-root] elements.
  (function () {
    "use strict";
    var d = document, W = window;

    if (!window.__rsScrollRoutine) {
      var reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
      function seg(p, a, b) { return cl((p - a) / (b - a)); }

      var instances = [];
      var fillEls = [];
      var ticking = false;

      function initRoot(root) {
        if (root.__rsInit) return;
        root.__rsInit = true;

        var wantsPin = root.getAttribute('data-rs-pin') !== 'false';
        var canAnimate = wantsPin && !reduce;

        // `root` itself carries the `.rs-cx` class (it's the element with
        // the 210vh height + sticky-range math), so querySelector('.rs-cx')
        // on root never matches anything — root has to be used directly.
        var cx = root;
        var stage = root.querySelector('[data-rs-stage]');
        var one = root.querySelector('[data-rs-one]');
        var num = root.querySelector('[data-rs-num]');
        var tag = root.querySelector('[data-rs-tag]');

        if (canAnimate) root.classList.add('rs-is-animated');

        var cards = (stage && canAnimate) ? [].slice.call(stage.children) : [];
        var last = -1, phase = '';

        var labelGrowing = tag ? tag.textContent : '';
        var labelFalling = root.getAttribute('data-label-falling') || labelGrowing;

        function paint() {
          if (!cards.length || !cx) return;
          var span = cx.offsetHeight - W.innerHeight;
          if (span <= 0) return;
          var p = cl(-cx.getBoundingClientRect().top / span);
          var GROW = .48, GO = .84, n, i;
          if (p < GROW) {
            var g = p / GROW, crowd = g * g;
            n = Math.min(cards.length, Math.floor(g * (cards.length + .6)) + 1);
            for (i=0;i<cards.length;i++) {
              var onC=i<n,c=cards[i]; c.style.opacity=onC?'1':'0';
              c.style.transform='translate(-50%,-50%) rotate(var(--r)) scale('+(onC ? (.96*(1+crowd*.16)).toFixed(3) : '.9')+')';
            }
            if(one) one.style.opacity='0'; root.classList.remove('one');
            if(phase!=='grow'){phase='grow';if(tag)tag.textContent=labelGrowing;}
          } else {
            var k=cl((p-GROW)/(GO-GROW)), ease=1-Math.pow(1-k,3);
            n=Math.max(1,Math.round(cards.length-(cards.length-1)*ease));
            for(i=0;i<cards.length;i++){
              var c2=cards[i];
              var dx=(50-parseFloat(c2.style.getPropertyValue('--x')))*ease;
              var dy=(50-parseFloat(c2.style.getPropertyValue('--y')))*ease;
              c2.style.transform='translate(-50%,-50%) translate('+dx+'vw,'+dy+'vh) rotate(calc(var(--r) * '+(1-ease).toFixed(3)+')) scale('+(0.96-ease*.72).toFixed(3)+')';
              c2.style.opacity=String(cl(1-ease*1.35));
            }
            if(one) one.style.opacity=String(seg(p,GO-.10,GO+.05));
            root.classList.toggle('one',n===1);
            if(phase!=='fall'){phase='fall';if(tag)tag.textContent=labelFalling;}
          }
          if(n!==last){last=n;if(num)num.textContent=String(n).padStart(2,'0');}
        }

        instances.push(paint);
      }

      function collectFillEls() {
        fillEls = [].slice.call(d.querySelectorAll('.rs-fu'));
      }

      function paintFills() {
        var vh = W.innerHeight;
        for (var i = 0; i < fillEls.length; i++) {
          var el = fillEls[i], r = el.getBoundingClientRect();
          if (r.bottom < -40 || r.top > vh + 40) continue;
          el.style.setProperty('--fill', ((1 - cl((vh - r.top) / (vh * .62))) * 100).toFixed(2) + '%');
        }
      }

      function frame() {
        ticking = false;
        paintFills();
        for (var i = 0; i < instances.length; i++) instances[i]();
      }

      function requestFrame() {
        if (!ticking) { ticking = true; requestAnimationFrame(frame); }
      }

      function setup() {
        [].slice.call(d.querySelectorAll('[data-rs-root]')).forEach(initRoot);
        collectFillEls();
        frame();
      }

      W.addEventListener('scroll', requestFrame, { passive: true });
      W.addEventListener('resize', requestFrame, { passive: true });
      W.addEventListener('load', frame);
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(frame);

      d.addEventListener('shopify:section:load', function (e) {
        var root = e.target.querySelector && e.target.querySelector('[data-rs-root]');
        if (root) initRoot(root);
        collectFillEls();
        frame();
      });

      window.__rsScrollRoutine = { refresh: setup };
    }

    window.__rsScrollRoutine.refresh();
  })();
