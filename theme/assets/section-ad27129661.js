
(function () {

  const sectionId = 'lvg-rtb-chapters-template--23927395549299__chapters_Ri6Pn9';

  function initRTBChapters() {

    const section = document.getElementById(sectionId);

    if (!section) return;


    /* ---------------------------------------------
       Prevent duplicate initialization
    --------------------------------------------- */

    if (section.dataset.rtbInitialized === 'true') {
      return;
    }

    section.dataset.rtbInitialized = 'true';


    const chapters = section.querySelectorAll(
      '.lvg-rtb-chapter'
    );


    if (!chapters.length) return;


    /* ---------------------------------------------
       Reveal disabled
    --------------------------------------------- */

    if (section.dataset.reveal !== 'true') {

      chapters.forEach(function (chapter) {
        chapter.classList.add('is-visible');
      });

      return;
    }


    /* ---------------------------------------------
       Reduced motion
    --------------------------------------------- */

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;


    if (prefersReducedMotion) {

      chapters.forEach(function (chapter) {
        chapter.classList.add('is-visible');
      });

      return;
    }


    /* ---------------------------------------------
       Intersection Observer
    --------------------------------------------- */

    if (!('IntersectionObserver' in window)) {

      chapters.forEach(function (chapter) {
        chapter.classList.add('is-visible');
      });

      return;
    }


    const observer = new IntersectionObserver(
      function (entries) {

        entries.forEach(function (entry) {

          if (!entry.isIntersecting) return;


          const chapter = entry.target;


          requestAnimationFrame(function () {
            chapter.classList.add('is-visible');
          });


          /*
            Animate only once.
          */

          observer.unobserve(chapter);

        });

      },
      {
        threshold: 0.12,

        rootMargin:
          '0px 0px -10% 0px'
      }
    );


    chapters.forEach(function (chapter) {
      observer.observe(chapter);
    });

  }


  /* ---------------------------------------------
     Initial load
  --------------------------------------------- */

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      initRTBChapters,
      { once: true }
    );

  } else {

    initRTBChapters();

  }


  /* ---------------------------------------------
     Shopify Theme Editor
  --------------------------------------------- */

  document.addEventListener(
    'shopify:section:load',
    function (event) {

      if (
        event.detail &&
        event.detail.sectionId === 'template--23927395549299__chapters_Ri6Pn9'
      ) {

        const section =
          document.getElementById(sectionId);

        if (section) {

          section.dataset.rtbInitialized = 'false';

        }

        initRTBChapters();
      }

    }
  );


})();
