
(function () {

  'use strict';

  document.documentElement.classList.add('js');


  /* =====================================================
     REDUCED MOTION
  ===================================================== */

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  /* =====================================================
     BANNER SCROLL REVEAL
  ===================================================== */

  function initRTBScrollReveal() {

    var root =
      document.getElementById(
        'lvg-rtb-banner-template--23927395811443__believe_banner_FRnK6L'
      );

    if (!root) return;


    if (
      root.dataset.scrollInitialized === 'true'
    ) {
      return;
    }

    root.dataset.scrollInitialized = 'true';


    var enabled =
      root.dataset.scrollReveal === 'true';


    var distance =
      root.dataset.revealDistance || '35';

    var duration =
      root.dataset.revealDuration || '900';

    var delay =
      root.dataset.revealDelay || '80';


    root.style.setProperty(
      '--rtb-reveal-distance',
      distance + 'px'
    );

    root.style.setProperty(
      '--rtb-reveal-duration',
      duration + 'ms'
    );

    root.style.setProperty(
      '--rtb-reveal-delay',
      delay + 'ms'
    );


    if (!enabled || reduceMotion) {

      root.classList.add(
        'is-scroll-visible'
      );

      return;
    }


    /* ===================================================
       HEADING WORD SPLIT
    =================================================== */

    var heading =
      root.querySelector('h1');


    if (
      heading &&
      !heading.dataset.wordsReady
    ) {

      heading.dataset.wordsReady = 'true';

      var rawHTML =
        heading.innerHTML;

      var lines =
        rawHTML.split(/<br\s*\/?>/i);

      heading.textContent = '';

      var globalIndex = 0;

      lines.forEach(function (lineHTML, lineIndex) {

        var tempEl =
          document.createElement('div');

        tempEl.innerHTML =
          lineHTML;

        var lineText =
          tempEl.textContent
            .trim()
            .replace(/\s+/g, ' ');

        var words =
          lineText.length
            ? lineText.split(' ')
            : [];

        words.forEach(function (word, wordIndex) {

          var mask =
            document.createElement('span');

          mask.className =
            'rtb-word';

          mask.style.setProperty(
            '--rtb-delay',
            (globalIndex * 65) + 'ms'
          );


          var inner =
            document.createElement('i');

          inner.textContent =
            word;


          mask.appendChild(inner);

          heading.appendChild(mask);


          if (
            wordIndex <
            words.length - 1
          ) {

            heading.appendChild(
              document.createTextNode('\u00A0')
            );

          }

          globalIndex++;

        });


        if (
          lineIndex <
          lines.length - 1
        ) {

          heading.appendChild(
            document.createElement('br')
          );

        }

      });

    }


    /* ===================================================
       INTERSECTION OBSERVER
    =================================================== */

    if (
      !('IntersectionObserver' in window)
    ) {

      root.classList.add(
        'is-scroll-visible'
      );

      return;
    }


    var observer =
      new IntersectionObserver(
        function (entries) {

          entries.forEach(
            function (entry) {

              if (
                !entry.isIntersecting
              ) {
                return;
              }


              root.classList.add(
                'is-scroll-visible'
              );


              observer.unobserve(
                root
              );

            }
          );

        },
        {
          threshold: 0.18,

          rootMargin:
            '0px 0px -10% 0px'
        }
      );


    observer.observe(root);

  }


  /* =====================================================
     STORY RAIL
  ===================================================== */

  function initRTBRail() {

    document
      .querySelectorAll(
        '.lvg-rtb-story-rail'
      )
      .forEach(function (rail) {

        if (
          rail.dataset.railInitialized === 'true'
        ) {
          return;
        }

        rail.dataset.railInitialized = 'true';


        var placeholder =
          document.createElement('div');

        placeholder.className =
          'lvg-rtb-story-rail-placeholder';

        placeholder.style.display =
          'none';


        rail.parentNode.insertBefore(
          placeholder,
          rail.nextSibling
        );


        var originalTop = 0;
        var railHeight = 0;
        var ticking = false;


        function calculate() {

          rail.classList.remove(
            'is-fixed'
          );

          placeholder.style.display =
            'none';


          originalTop =
            rail.getBoundingClientRect().top +
            window.scrollY;


          railHeight =
            rail.offsetHeight;

        }


        function update() {

          if (
            window.scrollY >= originalTop
          ) {

            rail.classList.add(
              'is-fixed'
            );

            placeholder.style.display =
              'block';

            placeholder.style.height =
              railHeight + 'px';

          } else {

            rail.classList.remove(
              'is-fixed'
            );

            placeholder.style.display =
              'none';

          }

          ticking = false;

        }


        window.addEventListener(
          'scroll',
          function () {

            if (ticking) return;

            ticking = true;

            requestAnimationFrame(
              update
            );

          },
          {
            passive: true
          }
        );


        window.addEventListener(
          'resize',
          function () {

            calculate();

            update();

          }
        );


        calculate();

        update();

      });

  }


  /* =====================================================
     STORY RAIL SCROLL PROGRESS
  ===================================================== */

  function initRTBProgress() {

    document
      .querySelectorAll(
        '.lvg-rtb-story-rail__progress'
      )
      .forEach(function (bar) {

        if (
          bar.dataset.progressInitialized === 'true'
        ) {
          return;
        }

        bar.dataset.progressInitialized = 'true';

        var ticking = false;

        function update() {

          var doc = document.documentElement;

          var scrollTop =
            window.scrollY || doc.scrollTop;

          var height =
            doc.scrollHeight - doc.clientHeight;

          var pct =
            height > 0
              ? (scrollTop / height) * 100
              : 0;

          bar.style.width = pct + '%';

          ticking = false;

        }

        window.addEventListener(
          'scroll',
          function () {

            if (ticking) return;

            ticking = true;

            requestAnimationFrame(update);

          },
          { passive: true }
        );

        window.addEventListener(
          'resize',
          update
        );

        update();

      });

  }


  /* =====================================================
     DESKTOP MOUSE PARALLAX
  ===================================================== */

  function initRTBParallax() {

    var root =
      document.getElementById(
        'lvg-rtb-banner-template--23927395811443__believe_banner_FRnK6L'
      );


    if (
      !root ||
      reduceMotion ||
      root.dataset.imageMotion === 'false'
    ) {
      return;
    }


    var media =
      root.querySelector(
        '.lvg-rtb-banner__media'
      );


    if (
      !media ||
      !window.matchMedia(
        '(hover: hover)'
      ).matches
    ) {
      return;
    }


    if (
      media.dataset.parallaxInitialized ===
      'true'
    ) {
      return;
    }

    media.dataset.parallaxInitialized =
      'true';


    var queued = false;


    window.addEventListener(
      'mousemove',
      function (event) {

        var x =
          (
            event.clientX /
            window.innerWidth -
            .5
          ) * -14;


        var y =
          (
            event.clientY /
            window.innerHeight -
            .5
          ) * -10;


        if (queued) return;


        queued = true;


        requestAnimationFrame(
          function () {

            queued = false;


            media.style.setProperty(
              '--rtb-x',
              x.toFixed(1) + 'px'
            );


            media.style.setProperty(
              '--rtb-y',
              y.toFixed(1) + 'px'
            );

          }
        );

      },
      {
        passive: true
      }
    );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function init() {

    initRTBScrollReveal();

    initRTBRail();

    initRTBProgress();

    initRTBParallax();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }


  /* =====================================================
     SHOPIFY THEME EDITOR
  ===================================================== */

  document.addEventListener(
    'shopify:section:load',
    function (event) {

      if (
        event.detail &&
        event.detail.sectionId ===
        'template--23927395811443__believe_banner_FRnK6L'
      ) {

        var root =
          document.getElementById(
            'lvg-rtb-banner-template--23927395811443__believe_banner_FRnK6L'
          );


        if (root) {

          root.dataset.scrollInitialized =
            'false';

        }


        init();

      }

    }
  );

})();
