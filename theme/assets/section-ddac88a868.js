
  (function () {
    var section = document.getElementById('lp-buy-panel-q3n8r');
    if (!section) return;

    // Size selector logic
    var radios = section.querySelectorAll('input[name="lp-size-q3n8r"]');
    var variantInput = section.querySelector('[data-lp-variant-input]');
    var buyNow = section.querySelector('[data-lp-buy-now]');
    var priceOut = section.querySelector('[data-lp-price]');
    var options = section.querySelectorAll('.lp-buy-q3n8r__size-option');

    var shippingChip = section.querySelector('[data-lp-shipping]');
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (!this.checked) return;
        var id = this.value;
        var price = this.getAttribute('data-price') || '';
        var freeShip = this.getAttribute('data-free-shipping') === 'true';
        if (variantInput) variantInput.value = id;
        if (buyNow) buyNow.setAttribute('href', '/cart/' + id + ':1?checkout');
        if (priceOut) priceOut.textContent = price;
        if (shippingChip) shippingChip.style.display = freeShip ? '' : 'none';
        options.forEach(function (o) {
          var input = o.querySelector('input');
          o.setAttribute('data-selected', input && input.checked ? 'true' : 'false');
        });
      });
    });
    options.forEach(function (o) {
      o.addEventListener('click', function () {
        var input = o.querySelector('input');
        if (input && !input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    // Gallery dots
    var viewport = section.querySelector('[data-lp-viewport]');
    var dotsWrap = section.querySelector('[data-lp-dots]');
    if (!viewport || !dotsWrap) return;
    var slides = viewport.querySelectorAll('.lp-buy-q3n8r__slide');
    if (slides.length < 2) return;

    var dots = [];
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lp-buy-q3n8r__dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', 'Go to image ' + (i + 1));
      b.addEventListener('click', function () {
        var target = slides[i];
        if (!target) return;
        var isVertical = window.matchMedia('(min-width: 900px)').matches;
        if (isVertical) {
          viewport.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        } else {
          viewport.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
        }
      });
      dotsWrap.appendChild(b);
      dots.push(b);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          var i = Array.prototype.indexOf.call(slides, e.target);
          if (i < 0) return;
          dots.forEach(function (d, di) { d.classList.toggle('is-active', di === i); });
        }
      });
    }, { root: viewport, threshold: [0.6] });
    slides.forEach(function (s) { io.observe(s); });
  })();
