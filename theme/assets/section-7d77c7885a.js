
  (function () {
    var section = document.getElementById('story-final-cta-template--23927395745907__story_cta_Mpk8Qa');
    if (!section) return;

    if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              section.classList.add('is-visible');
              observer.unobserve(section);
            }
          });
        }, { threshold: 0.2 });

        observer.observe(section);
      } else {
        section.classList.add('is-visible');
      }
    } else {
      section.classList.add('is-visible');
    }
  })();
