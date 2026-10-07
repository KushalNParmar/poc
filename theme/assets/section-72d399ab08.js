
(function () {

  var section = document.getElementById(
    'lvg-truth-scorecard-template--23927395582067__pair_card_Mcc7TY'
  );

  if (!section) return;


  var baseline = section.querySelector(
    '.lvg-truth-scorecard__baseline'
  );

  if (!baseline) return;


  var hasScrolled = false;
  var observerStarted = false;


  function revealWhenVisible() {

    if (observerStarted) return;

    observerStarted = true;


    if (!('IntersectionObserver' in window)) {

      baseline.classList.add('is-visible');

      return;
    }


    var observer = new IntersectionObserver(
      function (entries, observerInstance) {

        entries.forEach(function (entry) {

          if (!entry.isIntersecting) return;


          baseline.classList.add('is-visible');


          observerInstance.unobserve(
            entry.target
          );

        });

      },
      {
        root: null,
        rootMargin: '0px 0px -15% 0px',
        threshold: 0.05
      }
    );


    observer.observe(baseline);

  }


  function handleFirstScroll() {

    if (hasScrolled) return;

    hasScrolled = true;

    revealWhenVisible();

    window.removeEventListener(
      'scroll',
      handleFirstScroll
    );

  }


  window.addEventListener(
    'scroll',
    handleFirstScroll,
    {
      passive: true
    }
  );


})();
