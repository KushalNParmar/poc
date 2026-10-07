

  (function () {

    var section = document.getElementById(
      'faq-tabs-template--23927395876979__group_faq_WdDQnK'
    );

    if (!section) return;


    /* =========================================================
       FAQ TABS
       ========================================================= */

    var tabs = [].slice.call(
      section.querySelectorAll('.tab')
    );


    var groups = [].slice.call(
      section.querySelectorAll('.faq-group')
    );


    function show(g) {

      tabs.forEach(function (t) {

        t.setAttribute(
          'aria-selected',
          t.dataset.t === g
            ? 'true'
            : 'false'
        );

      });


      groups.forEach(function (group) {

        var on =
          group.dataset.g === g;


        group.style.display =
          on ? '' : 'none';


        if (!on) {

          var details =
            group.querySelectorAll('details');


          details.forEach(function (detail) {

            detail.open = false;

          });

        }

      });

    }


    tabs.forEach(function (t) {

      t.addEventListener(
        'click',
        function () {

          show(t.dataset.t);

        }
      );

    });


    if (tabs.length) {

      show(
        tabs[0].dataset.t
      );

    }


    /* =========================================================
       REVEAL
       ========================================================= */

    var reduce =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;


    var IO =
      'IntersectionObserver' in window;


    var rv = [].slice.call(
      section.querySelectorAll('.rv')
    );


    if (reduce || !IO) {

      rv.forEach(function (e) {

        e.classList.add('in');

      });

    } else {

      var o =
        new IntersectionObserver(
          function (en) {

            en.forEach(function (x) {

              if (x.isIntersecting) {

                x.target.classList.add('in');

                o.unobserve(x.target);

              }

            });

          },
          {
            rootMargin:
              '0px 0px -8% 0px',

            threshold: 0.12
          }
        );


      rv.forEach(function (e) {

        o.observe(e);

      });

    }

  })();

