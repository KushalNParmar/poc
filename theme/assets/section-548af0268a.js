

  document.addEventListener('DOMContentLoaded', function () {

    const shelf =
      document.querySelector(
        '#lngvty-shelf-template--23927395582067__belief_relief_mVD46E .lngvty-shelf__reveal'
      );

    if (!shelf) return;


    if (!('IntersectionObserver' in window)) {

      shelf.classList.add('is-visible');

      return;

    }


    const observer = new IntersectionObserver(
      function (entries) {

        entries.forEach(function (entry) {

          if (entry.isIntersecting) {

            shelf.classList.add('is-visible');

            observer.unobserve(entry.target);

          }

        });

      },
      {
        threshold: 0.15
      }
    );


    observer.observe(shelf);

  });

