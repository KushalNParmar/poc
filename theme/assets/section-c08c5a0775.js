
(function () {

  var sectionId =
    'lvg-rtb-provenance-template--23927395549299__rtb_provence_pqf3E9';


  function initRTBProvenance() {

    var root =
      document.getElementById(sectionId);

    if (!root) return;


    /*
     * Prevent duplicate initialization.
     */

    if (
      root.dataset.rtbInitialized === 'true'
    ) {
      return;
    }

    root.dataset.rtbInitialized = 'true';


    var reduced =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;


    var revealEnabled =
      root.dataset.scrollReveal === 'true';


    var replay =
      root.querySelector(
        '[data-lvg-rtb-replay]'
      );


    /*
     * =====================================================
     * START FIGURE ANIMATION
     * =====================================================
     */

    function startFigure() {

      /*
       * Reduced motion:
       * show everything immediately.
       */

      if (reduced) {

        root.classList.remove(
          'is-animating'
        );

        root.classList.add(
          'is-visible'
        );

        return;

      }


      /*
       * Reset animation.
       */

      root.classList.remove(
        'is-animating'
      );

      root.classList.remove(
        'is-visible'
      );


      /*
       * Force browser reflow.
       *
       * This is important for Replay.
       */

      void root.offsetWidth;


      /*
       * Start animation.
       */

      root.classList.add(
        'is-animating'
      );


      /*
       * Allow the animation to begin.
       */

      requestAnimationFrame(function () {

        root.classList.add(
          'is-visible'
        );

      });

    }


    /*
     * =====================================================
     * SCROLL REVEAL
     * =====================================================
     */

    function showSection() {

      root.classList.add(
        'is-scroll-visible'
      );


      /*
       * Start the SVG animation after
       * the section starts appearing.
       */

      window.setTimeout(
        startFigure,
        revealEnabled ? 180 : 0
      );

    }


    /*
     * =====================================================
     * IF SCROLL REVEAL DISABLED
     * =====================================================
     */

    if (!revealEnabled) {

      root.classList.add(
        'is-scroll-visible'
      );

      startFigure();

    }

    /*
     * =====================================================
     * INTERSECTION OBSERVER
     * =====================================================
     */

    else if (
      !reduced &&
      'IntersectionObserver' in window
    ) {

      var observer =
        new IntersectionObserver(
          function (entries) {

            entries.forEach(function (entry) {

              if (
                !entry.isIntersecting
              ) {
                return;
              }


              showSection();


              /*
               * Run only once on scroll.
               */

              observer.unobserve(
                entry.target
              );

            });

          },
          {
            threshold: 0.18,

            rootMargin:
              '0px 0px -8% 0px'
          }
        );


      observer.observe(root);

    }

    else {

      /*
       * Fallback if IntersectionObserver
       * isn't supported or reduced motion
       * is enabled.
       */

      showSection();

    }


    /*
     * =====================================================
     * REPLAY BUTTON
     * =====================================================
     */

    if (replay) {

      replay.addEventListener(
        'click',
        function () {

          /*
           * Make sure section itself is visible.
           */

          root.classList.add(
            'is-scroll-visible'
          );


          /*
           * Restart SVG animation.
           */

          startFigure();

        }
      );

    }

  }


  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initRTBProvenance,
      {
        once: true
      }
    );

  } else {

    initRTBProvenance();

  }


  /*
   * =====================================================
   * SHOPIFY THEME EDITOR
   * =====================================================
   */

  document.addEventListener(
    'shopify:section:load',
    function (event) {

      if (
        event.detail &&
        event.detail.sectionId ===
          'template--23927395549299__rtb_provence_pqf3E9'
      ) {

        var section =
          document.getElementById(
            sectionId
          );

        if (section) {

          section.dataset.rtbInitialized =
            'false';

        }

        initRTBProvenance();

      }

    }
  );

})();
