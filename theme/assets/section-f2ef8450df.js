
(function () {

  var root = document.getElementById(
    'chapter-loop-template--23927395745907__tension_chapter2_JJ6Ddb'
  );

  if (!root) return;

  var doc = document;
  var win = window;
  var html = doc.documentElement;

  html.classList.add('has-js');

  var reduce =
    win.matchMedia &&
    win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hasIO =
    'IntersectionObserver' in win;

  if (!reduce && hasIO) {
    html.classList.add('has-anim');
  }


  /* =========================
     MASK HEADING
  ========================= */

  root.querySelectorAll('.mask-reveal').forEach(function (el) {

    if (el.querySelector('i')) return;

    var i = doc.createElement('i');

    while (el.firstChild) {
      i.appendChild(el.firstChild);
    }

    el.appendChild(i);

  });


  /* =========================
     REVEAL
  ========================= */

  function reveal(selector, margin, threshold) {

    var elements = root.querySelectorAll(selector);

    if (reduce || !hasIO) {

      elements.forEach(function (el) {
        el.classList.add('is-visible');
      });

      return;
    }

    var observer = new IntersectionObserver(
      function (entries, observerInstance) {

        entries.forEach(function (entry) {

          if (!entry.isIntersecting) return;

          entry.target.classList.add('is-visible');

          observerInstance.unobserve(
            entry.target
          );

        });

      },
      {
        rootMargin: margin,
        threshold: threshold
      }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });

  }


  reveal(
    '.reveal',
    '0px 0px -8% 0px',
    .1
  );


  reveal(
    '.mask-reveal',
    '0px 0px -12% 0px',
    .15
  );


  /* =========================
     LIST STAGGER
  ========================= */

  root.querySelectorAll('.ruled-list').forEach(function (list) {

    Array.prototype.forEach.call(
      list.children,
      function (li, index) {

        li.style.setProperty(
          '--d',
          (index * 95) + 'ms'
        );

      }
    );

  });

})();
