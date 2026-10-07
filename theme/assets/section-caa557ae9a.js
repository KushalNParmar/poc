
  (function () {
    var section = document.getElementById('story-final-cta-template--23927395582067__story_cta_DyJcLd');
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
