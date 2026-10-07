
  (function () {
    var bar = document.querySelector('[data-lp-sticky]');
    if (!bar) return;

    var buyPanel = document.getElementById('lp-buy-panel-k7x2m');
    var hero = document.querySelector('.lp-hero-k7x2m');
    var explore = document.querySelector('.lp-explore-k7x2m');
    var stickyCta = bar.querySelector('[data-lp-sticky-cta]');
    var stickyPrice = bar.querySelector('[data-lp-sticky-price]');

    // Visibility state
    var scrolledPastHero = false;
    var hidingSections = 0;   // count of "conflict" sections currently visible

    function updateVisibility() {
      var shouldShow = scrolledPastHero && hidingSections === 0;
      bar.classList.toggle('is-visible', shouldShow);
    }

    // Show once user has scrolled past hero
    if (hero && 'IntersectionObserver' in window) {
      var heroIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          scrolledPastHero = !e.isIntersecting;
          updateVisibility();
        });
      }, { threshold: 0.05 });
      heroIo.observe(hero);
    } else {
      scrolledPastHero = true;
      updateVisibility();
    }

    // Hide when buy panel or explore-further section is on screen
    if ('IntersectionObserver' in window) {
      var conflictIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) hidingSections++;
          else hidingSections = Math.max(0, hidingSections - 1);
        });
        updateVisibility();
      }, { threshold: 0.15 });
      if (buyPanel) conflictIo.observe(buyPanel);
      if (explore) conflictIo.observe(explore);
    }

    // Sync CTA + price with size selector on the buy panel
    var buyPanelRadios = document.querySelectorAll('input[name="lp-size-k7x2m"]');
    buyPanelRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        if (!this.checked) return;
        var id = this.value;
        var price = this.getAttribute('data-price') || '';
        if (stickyCta) stickyCta.setAttribute('href', '/cart/' + id + ':1?checkout');
        if (stickyPrice) stickyPrice.textContent = price;
      });
    });
  })();
