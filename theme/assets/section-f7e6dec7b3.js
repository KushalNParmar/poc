
  document.querySelectorAll('.pillars-wrap-template--23927395680371__logentity_pilllar_NLmCqB .pillar').forEach(function () {});

document.addEventListener('DOMContentLoaded', function () {

  const stats = document.querySelectorAll(
    '.pillars-wrap-template--23927395680371__logentity_pilllar_NLmCqB .p-stat'
  );

  function animateStat(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = "true";

    const original = el.dataset.value.trim();

    // Find first number (supports +38%, -43%, +74.7%, +132.4%)
    const match = original.match(/([+-]?)(\d+(\.\d+)?)/);

    if (!match) {
      el.childNodes[0].nodeValue = original;
      return;
    }

    const sign = match[1];
    const target = parseFloat(match[2]);
    const decimals = (match[2].split('.')[1] || '').length;

    const prefix = original.substring(0, match.index);
    const suffix = original.substring(match.index + match[0].length);

    const duration = 1800;
    let start = null;

    function frame(timestamp) {
      if (!start) start = timestamp;

      const progress = Math.min((timestamp - start) / duration, 1);

      const eased =
        1 - Math.pow(1 - progress, 3); // easeOutCubic

      const value = target * eased;

      el.childNodes[0].nodeValue =
        prefix +
        sign +
        value.toFixed(decimals) +
        suffix;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.childNodes[0].nodeValue = original;
      }
    }

    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateStat(entry.target);
      }
    });
  }, {
    threshold: 0.45
  });

  stats.forEach(function(stat) {
    observer.observe(stat);
  });

});
