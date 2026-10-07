
  (function () {

    var section = document.getElementById(
      'lngvty-receipt-template--23927395876979__conversion_fzPQV8'
    );

    if (!section) return;


    var reduceMotion =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;


    if (reduceMotion) {

      section.classList.add(
        'lngvty-receipt--loaded'
      );

      return;

    }


    if (!('IntersectionObserver' in window)) {

      section.classList.add(
        'lngvty-receipt--loaded'
      );

      return;

    }


    var observer = new IntersectionObserver(
      function (entries) {

        entries.forEach(function (entry) {

          if (entry.isIntersecting) {

            section.classList.add(
              'lngvty-receipt--loaded'
            );

            observer.unobserve(section);

          }

        });

      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -8% 0px'
      }
    );


    observer.observe(section);

  })();
