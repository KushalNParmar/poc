
  (function () {
    var bar = document.querySelector('[data-lp-sticky]');
    if (!bar) return;

    var buyPanel = document.getElementById('lp-buy-panel-q3n8r');
    var explore = document.querySelector('.lp-explore-q3n8r');
    var stickyCta = bar.querySelector('[data-lp-sticky-cta]');
    var stickyPrice = bar.querySelector('[data-lp-sticky-price]');

    // No hero on this page ; sticky bar hides while the buy panel itself is on screen
    // (its CTA is already right there), and shows once the user scrolls past it.
    var buyPanelInView = true;
    var hidingSections = 0;   // count of other "conflict" sections currently visible

    function updateVisibility() {
      var shouldShow = !buyPanelInView && hidingSections === 0;
      bar.classList.toggle('is-visible', shouldShow);
    }

    if (buyPanel && 'IntersectionObserver' in window) {
      var buyIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          buyPanelInView = e.isIntersecting;
          updateVisibility();
        });
      }, { threshold: 0.05 });
      buyIo.observe(buyPanel);
    } else {
      buyPanelInView = false;
      updateVisibility();
    }

    // Hide when explore-further section is on screen (has its own CTAs)
    if ('IntersectionObserver' in window) {
      var conflictIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) hidingSections++;
          else hidingSections = Math.max(0, hidingSections - 1);
        });
        updateVisibility();
      }, { threshold: 0.15 });
      if (explore) conflictIo.observe(explore);
    }

    // Sync CTA + price with size selector on the buy panel
    var buyPanelRadios = document.querySelectorAll('input[name="lp-size-q3n8r"]');
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
