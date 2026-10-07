
(function () {

  const section = document.getElementById(
    'lvg-truth-chapters-template--23927395811443__truth_chapter_YE3gzP'
  );

  if (!section) return;


  const revealType =
    'fade-up';


  /* =====================================================
     NO REVEAL
  ===================================================== */

  if (revealType === 'none') {

    section
      .querySelectorAll('.lvg-truth-reveal')
      .forEach(function (el) {

        el.classList.add('is-revealed');

      });

    return;
  }


  const chapters =
    section.querySelectorAll(
      '.lvg-truth-reveal'
    );


  if (!chapters.length) return;


  /* =====================================================
     REDUCED MOTION
  ===================================================== */

  if (
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) {

    chapters.forEach(function (chapter) {

      chapter.classList.add(
        'is-revealed'
      );

    });

    return;
  }


  /* =====================================================
     INTERSECTION OBSERVER
  ===================================================== */

  if (
    !('IntersectionObserver' in window)
  ) {

    chapters.forEach(function (chapter) {

      chapter.classList.add(
        'is-revealed'
      );

    });

    return;
  }


  const observer =
    new IntersectionObserver(
      function (
        entries,
        observerInstance
      ) {

        entries.forEach(function (entry) {

          if (!entry.isIntersecting) return;

          entry.target.classList.add(
            'is-revealed'
          );

          observerInstance.unobserve(
            entry.target
          );

        });

      },
      {
        threshold: 0.12,

        rootMargin:
          '0px 0px -8% 0px'
      }
    );


  chapters.forEach(function (chapter) {

    observer.observe(chapter);

  });

})();
