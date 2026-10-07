
    (function () {
      var DATA = { "acne-blemish-control-serum-30ml":[{"id":48573386948765,"t":"30 ML","p":"Rs. 1,049.00","c":"","i":"/assets/media/2_2b293fb2-0a55-4d2f-a70e-ee4b658e200f-5ab6335168.jpg","a":true},
{"id":48573386981533,"t":"10 ML","p":"Rs. 499.00","c":"","i":"/assets/media/11-a5f4b79ce2.jpg","a":true},
{"id":48794741473437,"t":"30 + 30 ML","p":"Rs. 1,888.20","c":"Rs. 2,098.00","i":"/assets/media/acne_bundle-9e1cbe1564.webp","a":true}
],"dark-spots-pore-control-serum-30ml":[{"id":48573386588317,"t":"30 ML","p":"Rs. 1,199.00","c":"","i":"/assets/media/3_fa6a5cd6-22de-4dbf-8e0d-907b39558c9a-337eb9960c.jpg","a":true},
{"id":48573386621085,"t":"10 ML","p":"Rs. 549.00","c":"Rs. 599.00","i":"/assets/media/21_44fe2aa8-e354-4c39-a43a-04eada18fedc-f23e85c4e5.jpg","a":true},
{"id":48794739441821,"t":"30 + 30 ML","p":"Rs. 2,158.20","c":"Rs. 2,398.00","i":"/assets/media/dark_spots_bundle-3401ee241e.webp","a":true}
],"deep-hydration-glow-serum-30ml":[{"id":48573378461853,"t":"30 ML","p":"Rs. 1,049.00","c":"","i":"/assets/media/1_ef230265-217e-44f3-a6ca-7bc74de77a11-f193d38a39.jpg","a":true},
{"id":48573378494621,"t":"10 ML","p":"Rs. 499.00","c":"","i":"/assets/media/10_26eaafeb-697f-4a44-a89f-35202e17ad0b-b0e7c92b72.jpg","a":true},
{"id":48794738983069,"t":"30 + 30 ML","p":"Rs. 1,888.20","c":"Rs. 2,098.00","i":"/assets/media/deep_hydration_bundle-d24824286f.webp","a":true}
],"dust-bag-twill":[{"id":48422012846237,"t":"Default Title","p":"Rs. 499.00","c":"","i":"/assets/media/LNGVTYdustbagtwill-2977febacf.jpg","a":true}
], "_": [] };
      var ORDER = ['10', '30', '30+30'];
      var LABELS = { '10': '10ml', '30': '30ml', '30+30': '30 + 30ml' };

      function norm(t) {
        return String(t || '').toLowerCase().replace(/\s+/g, '').replace(/ml/g, '');
      }

      function handleOf(card) {
        var a = card.querySelector('a.xsc-fig, a.xsc-more');
        if (!a) return null;
        var m = (a.getAttribute('href') || '').match(/\/products\/([^/?#]+)/);
        return m ? decodeURIComponent(m[1]) : null;
      }

      function select(card, btn) {
        var all = card.querySelectorAll('.xsc-b');
        Array.prototype.forEach.call(all, function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var input = card.querySelector('[data-variant-input]');
        if (input) input.value = btn.dataset.variantId;
        var price = card.querySelector('[data-price-display]');
        if (price && btn.dataset.price) price.textContent = btn.dataset.price;
        var cmp = card.querySelector('[data-compare-price-display]');
        if (cmp) {
          var c = btn.dataset.comparePrice || '';
          cmp.textContent = c;
          cmp.hidden = !c;
        }
        var img = card.querySelector('.xsc-image');
        var src = btn.dataset.image;
        if (img && src && img.getAttribute('src') !== src) {
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
          img.src = src;
        }
        card.classList.toggle('lngvty-cs-soldout', btn.dataset.soldout === 'true');
      }

      function init() {
        Array.prototype.slice.call(document.querySelectorAll('.shop-other-serums .xsc')).forEach(function (card) {
          var handle = handleOf(card);
          var variants = handle && DATA[handle];
          if (!variants || !variants.length) return;

          var groups = card.querySelectorAll('.xsc-sz');
          var group = null;
          Array.prototype.forEach.call(groups, function (g) {
            if (g.classList.contains('single-variant')) {
              g.remove();
            } else if (!group) {
              group = g;
            }
          });
          if (!group) return;

          var bySize = {};
          variants.forEach(function (v) { bySize[norm(v.t)] = v; });
          var known = ORDER.filter(function (s) { return bySize[s]; });
          if (!known.length) return;

          var existing = {};
          Array.prototype.forEach.call(group.querySelectorAll('.xsc-b'), function (b) {
            existing[norm(b.textContent)] = b;
          });

          known.forEach(function (s) {
            var v = bySize[s];
            var b = existing[s];
            if (!b) {
              b = document.createElement('button');
              b.type = 'button';
              b.className = 'xsc-b';
              b.setAttribute('aria-pressed', 'false');
              b.dataset.variantId = v.id;
              b.dataset.price = v.p;
              b.dataset.comparePrice = v.c;
              b.dataset.image = v.i;
              b.dataset.lngvtyAdded = 'true';
              b.textContent = LABELS[s];
            }
            b.dataset.soldout = v.a ? 'false' : 'true';
            group.appendChild(b); /* keeps 10 / 30 / 30 + 30 order */
          });

          /* One handler for every size button (original and added) so only one is ever active */
          group.addEventListener('click', function (e) {
            var btn = e.target.closest('.xsc-b');
            if (!btn || !group.contains(btn)) return;
            select(card, btn);
          });

          var input = card.querySelector('[data-variant-input]');
          var current = input && group.querySelector('.xsc-b[data-variant-id="' + input.value + '"]');
          var active = group.querySelector('.xsc-b.is-active') || current ||
            group.querySelector('.xsc-b[data-soldout="false"]') || group.querySelector('.xsc-b');
          if (active) select(card, active);
        });
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  