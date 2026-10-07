
  (function () {
    var root = document.getElementById('relief-principles-template--23927395582067__relief_chapter2_bgt39Y');
    if (!root) return;

    var items = root.querySelectorAll('.relief-principles__item');

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px'
    });

    items.forEach(function (item) {
      observer.observe(item);
    });
  })();
