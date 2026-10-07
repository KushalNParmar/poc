

(function () {

  var section = document.getElementById(
    'lngvty-pictures-template--23927395876979__rai_compatible_wdQBXz'
  );

  if (!section) return;


  /* ==========================================================
     SCROLL REVEAL
  ========================================================== */

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  if (
    reduceMotion ||
    !('IntersectionObserver' in window)
  ) {

    section.classList.add(
      'lngvty-pictures--loaded'
    );

  } else {

    var revealObserver =
      new IntersectionObserver(
        function (entries) {

          entries.forEach(
            function (entry) {

              if (entry.isIntersecting) {

                section.classList.add(
                  'lngvty-pictures--loaded'
                );

                revealObserver.unobserve(
                  section
                );

              }

            }
          );

        },
        {
          threshold: 0.12,

          rootMargin: '0px 0px -8% 0px'
        }
      );


    revealObserver.observe(section);

  }


  /* ==========================================================
     ELEMENTS
  ========================================================== */

  var rail = section.querySelector(
    '.lngvty-pictures__rail'
  );

  var prevButton = section.querySelector(
    '.lngvty-pictures__arrow--prev'
  );

  var nextButton = section.querySelector(
    '.lngvty-pictures__arrow--next'
  );

  var imageButtons = section.querySelectorAll(
    '.lngvty-pictures__image-button'
  );

  var popup = section.querySelector(
    '.lngvty-pictures__popup'
  );

  var popupImage = section.querySelector(
    '.lngvty-pictures__popup-image'
  );

  var closeButton = section.querySelector(
    '.lngvty-pictures__popup-close'
  );


  if (!rail) return;


  /* ==========================================================
     GET GAP
  ========================================================== */

  var getGap = function () {

    var styles =
      window.getComputedStyle(rail);

    return (
      parseFloat(styles.columnGap) ||
      parseFloat(styles.gap) ||
      0
    );

  };


  /* ==========================================================
     ONE CARD SCROLL DISTANCE
  ========================================================== */

  var getScrollAmount = function () {

    var firstItem =
      rail.querySelector(
        '.lngvty-pictures__item'
      );


    if (!firstItem) {

      return rail.clientWidth * 0.8;

    }


    var itemWidth =
      firstItem.getBoundingClientRect().width;


    return itemWidth + getGap();

  };


  /* ==========================================================
     BUTTON STATE
  ========================================================== */

  var updateButtons = function () {

    if (!prevButton || !nextButton) return;


    var maxScroll =
      Math.max(
        0,
        rail.scrollWidth -
        rail.clientWidth
      );


    var currentScroll =
      rail.scrollLeft;


    prevButton.disabled =
      currentScroll <= 2;


    nextButton.disabled =
      currentScroll >= maxScroll - 2;


    if (maxScroll <= 2) {

      prevButton.style.visibility =
        'hidden';

      nextButton.style.visibility =
        'hidden';

    } else {

      prevButton.style.visibility =
        'visible';

      nextButton.style.visibility =
        'visible';

    }

  };


  /* ==========================================================
     NEXT
  ========================================================== */

  if (nextButton) {

    nextButton.addEventListener(
      'click',
      function () {

        rail.scrollBy({

          left: getScrollAmount(),

          behavior: 'smooth'

        });

      }
    );

  }


  /* ==========================================================
     PREVIOUS
  ========================================================== */

  if (prevButton) {

    prevButton.addEventListener(
      'click',
      function () {

        rail.scrollBy({

          left: -getScrollAmount(),

          behavior: 'smooth'

        });

      }
    );

  }


  /* ==========================================================
     HOVER
  ========================================================== */

  imageButtons.forEach(
    function (button) {

      button.addEventListener(
        'mouseenter',
        function () {

          if (
            !window.matchMedia(
              '(hover: hover) and (pointer: fine)'
            ).matches
          ) {
            return;
          }


          rail.classList.add(
            'has-hover'
          );


          var item =
            button.closest(
              '.lngvty-pictures__item'
            );


          imageButtons.forEach(
            function (otherButton) {

              var otherItem =
                otherButton.closest(
                  '.lngvty-pictures__item'
                );


              if (otherItem) {

                otherItem.classList.remove(
                  'is-hovered'
                );

              }

            }
          );


          if (item) {

            item.classList.add(
              'is-hovered'
            );

          }

        }
      );


      button.addEventListener(
        'mouseleave',
        function () {

          var item =
            button.closest(
              '.lngvty-pictures__item'
            );


          if (item) {

            item.classList.remove(
              'is-hovered'
            );

          }

        }
      );

    }
  );


  rail.addEventListener(
    'mouseleave',
    function () {

      rail.classList.remove(
        'has-hover'
      );


      var items =
        rail.querySelectorAll(
          '.lngvty-pictures__item'
        );


      items.forEach(
        function (item) {

          item.classList.remove(
            'is-hovered'
          );

        }
      );

    }
  );


  /* ==========================================================
     POPUP
  ========================================================== */

  var openPopup = function (button) {

    if (!popup || !popupImage) return;


    var image =
      button.querySelector(
        '.lngvty-pictures__image'
      );


    if (!image) return;


    var largeImage =
      image.currentSrc ||
      image.src;


    popupImage.src = largeImage;

    popupImage.alt =
      image.alt || '';


    popup.classList.add(
      'is-open'
    );


    popup.setAttribute(
      'aria-hidden',
      'false'
    );


    document.body.classList.add(
      'lngvty-pictures-popup-open'
    );


    if (closeButton) {

      setTimeout(
        function () {

          closeButton.focus();

        },
        50
      );

    }

  };


  /* ==========================================================
     CLOSE POPUP
  ========================================================== */

  var closePopup = function () {

    if (!popup) return;


    popup.classList.remove(
      'is-open'
    );


    popup.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body.classList.remove(
      'lngvty-pictures-popup-open'
    );


    if (popupImage) {

      setTimeout(
        function () {

          if (
            !popup.classList.contains(
              'is-open'
            )
          ) {

            popupImage.src = '';

            popupImage.alt = '';

          }

        },
        250
      );

    }

  };


  /* ==========================================================
     IMAGE CLICK
  ========================================================== */

  imageButtons.forEach(
    function (button) {

      button.addEventListener(
        'click',
        function () {

          openPopup(button);

        }
      );

    }
  );


  /* ==========================================================
     CLOSE BUTTON
  ========================================================== */

  if (closeButton) {

    closeButton.addEventListener(
      'click',
      function (event) {

        event.preventDefault();

        closePopup();

      }
    );

  }


  /* ==========================================================
     BACKDROP CLICK
  ========================================================== */

  if (popup) {

    popup.addEventListener(
      'click',
      function (event) {

        if (
          event.target === popup
        ) {

          closePopup();

        }

      }
    );

  }


  /* ==========================================================
     ESCAPE KEY
  ========================================================== */

  document.addEventListener(
    'keydown',
    function (event) {

      if (
        event.key === 'Escape' &&
        popup &&
        popup.classList.contains(
          'is-open'
        )
      ) {

        closePopup();

      }

    }
  );


  /* ==========================================================
     SCROLL
  ========================================================== */

  rail.addEventListener(
    'scroll',
    updateButtons,
    {
      passive: true
    }
  );


  /* ==========================================================
     RESIZE
  ========================================================== */

  var resizeTimer;


  window.addEventListener(
    'resize',
    function () {

      clearTimeout(
        resizeTimer
      );


      resizeTimer =
        setTimeout(
          updateButtons,
          100
        );

    }
  );


  /* ==========================================================
     IMAGE LOAD
  ========================================================== */

  imageButtons.forEach(
    function (button) {

      var image =
        button.querySelector(
          '.lngvty-pictures__image'
        );


      if (image) {

        if (image.complete) {

          updateButtons();

        } else {

          image.addEventListener(
            'load',
            updateButtons
          );

        }

      }

    }
  );


  /* ==========================================================
     SHOPIFY THEME EDITOR
  ========================================================== */

  document.addEventListener(
    'shopify:section:load',
    function (event) {

      if (
        event.detail &&
        event.detail.sectionId ===
          'template--23927395876979__rai_compatible_wdQBXz'
      ) {

        setTimeout(
          updateButtons,
          100
        );

      }

    }
  );


  /* ==========================================================
     INITIAL STATE
  ========================================================== */

  setTimeout(
    updateButtons,
    50
  );


  setTimeout(
    updateButtons,
    300
  );


  setTimeout(
    updateButtons,
    800
  );

})();

