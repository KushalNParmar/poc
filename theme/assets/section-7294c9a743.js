
(() => {

  const sectionId =
    'lngvty-before-after-template--23927395876979__clicle_before_dEh34q';


  /* =====================================================
     MAIN INIT
  ===================================================== */

  const initBeforeAfter = () => {

    const section =
      document.getElementById(sectionId);

    if (!section) return;


    /*
     * Prevent duplicate initialization when
     * Shopify Customizer reloads the section.
     */

    if (
      section.dataset.baInitialized === 'true'
    ) {
      return;
    }


    const comparison =
      section.querySelector(
        '[data-before-after]'
      );

    const interaction =
      section.querySelector(
        '[data-before-interaction]'
      );


    if (
      !comparison ||
      !interaction
    ) {
      return;
    }


    section.dataset.baInitialized = 'true';


    const hoverEnabled =
      section.dataset.hover === 'true';


    const dragEnabled =
      section.dataset.drag === 'true';


    let position =
      50;


    let isDragging = false;


    /*
     * Cached comparison dimensions.
     *
     * This is important for mobile performance.
     *
     * We DON'T call getBoundingClientRect()
     * on every finger movement.
     */

    let rect = null;


    /*
     * requestAnimationFrame state.
     */

    let rafId = null;

    let pendingPosition = null;


    /* =====================================================
       CACHE RECT
    ===================================================== */

    const refreshRect = () => {

      rect =
        comparison.getBoundingClientRect();

    };


    /* =====================================================
       APPLY POSITION
    ===================================================== */

    const applyPosition = (value) => {

      value =
        Math.max(
          0,
          Math.min(
            100,
            value
          )
        );


      position = value;


      /*
       * Single CSS variable controls both:
       *
       * 1. Before clip
       * 2. Center handle
       */

      comparison.style.setProperty(
        '--lngvty-ba-position',
        `${value}%`
      );


      interaction.setAttribute(
        'aria-valuenow',
        Math.round(value)
      );

    };


    /* =====================================================
       SCHEDULE POSITION
    ===================================================== */

    const schedulePosition = (value) => {

      pendingPosition =
        Math.max(
          0,
          Math.min(
            100,
            value
          )
        );


      /*
       * If a frame is already scheduled,
       * don't schedule another one.
       */

      if (rafId !== null) {
        return;
      }


      rafId =
        requestAnimationFrame(() => {

          rafId = null;


          if (
            pendingPosition !== null
          ) {

            applyPosition(
              pendingPosition
            );


            pendingPosition = null;

          }

        });

    };


    /* =====================================================
       GET CLIENT X
    ===================================================== */

    const getClientX = (event) => {

      /*
       * Pointer Events
       */

      if (
        event.clientX !== undefined
      ) {

        return event.clientX;

      }


      /*
       * Touch fallback
       */

      if (
        event.touches &&
        event.touches.length
      ) {

        return event.touches[0].clientX;

      }


      if (
        event.changedTouches &&
        event.changedTouches.length
      ) {

        return event.changedTouches[0].clientX;

      }


      return null;

    };


    /* =====================================================
       MOVE SLIDER
    ===================================================== */

    const moveSlider = (event) => {

      const clientX =
        getClientX(event);


      if (clientX === null) {
        return;
      }


      /*
       * Only calculate the layout
       * when dimensions aren't cached.
       */

      if (!rect) {
        refreshRect();
      }


      if (
        !rect ||
        !rect.width
      ) {
        return;
      }


      const value =
        (
          (
            clientX -
            rect.left
          ) /
          rect.width
        ) * 100;


      /*
       * Don't immediately modify the DOM.
       *
       * Wait for the next animation frame.
       */

      schedulePosition(value);

    };


    /* =====================================================
       DESKTOP MOUSE HOVER
    ===================================================== */

    if (hoverEnabled) {

      interaction.addEventListener(
        'pointerenter',
        () => {

          refreshRect();

        },
        {
          passive: true
        }
      );


      interaction.addEventListener(
        'pointermove',
        (event) => {

          /*
           * While dragging,
           * drag handler handles movement.
           */

          if (isDragging) {
            return;
          }


          /*
           * Hover only for actual mouse.
           */

          if (
            event.pointerType === 'mouse'
          ) {

            moveSlider(event);

          }

        },
        {
          passive: true
        }
      );

    }


    /* =====================================================
       TOUCH / POINTER DRAG
    ===================================================== */

    if (dragEnabled) {

      interaction.addEventListener(
        'pointerdown',
        (event) => {

          isDragging = true;


          /*
           * Refresh dimensions once
           * at the beginning of the drag.
           */

          refreshRect();


          /*
           * Pointer capture keeps the slider
           * receiving movement even if the
           * finger moves outside the element.
           */

          if (
            interaction.setPointerCapture
          ) {

            try {

              interaction.setPointerCapture(
                event.pointerId
              );

            } catch (error) {}

          }


          moveSlider(event);


          event.preventDefault();

        },
        {
          passive: false
        }
      );


      interaction.addEventListener(
        'pointermove',
        (event) => {

          if (!isDragging) {
            return;
          }


          moveSlider(event);


          event.preventDefault();

        },
        {
          passive: false
        }
      );


      const stopDragging =
        (event) => {

          if (!isDragging) {
            return;
          }


          isDragging = false;


          /*
           * Release pointer capture.
           */

          if (
            interaction.releasePointerCapture &&
            event.pointerId !== undefined
          ) {

            try {

              if (
                interaction.hasPointerCapture &&
                interaction.hasPointerCapture(
                  event.pointerId
                )
              ) {

                interaction.releasePointerCapture(
                  event.pointerId
                );

              }

            } catch (error) {}

          }

        };


      interaction.addEventListener(
        'pointerup',
        stopDragging,
        {
          passive: true
        }
      );


      interaction.addEventListener(
        'pointercancel',
        stopDragging,
        {
          passive: true
        }
      );


      interaction.addEventListener(
        'lostpointercapture',
        () => {

          isDragging = false;

        },
        {
          passive: true
        }
      );

    }


    /* =====================================================
       RESIZE
    ===================================================== */

    const handleResize = () => {

      /*
       * Don't calculate layout during every
       * resize event.
       */

      rect = null;


      if (rafId !== null) {

        cancelAnimationFrame(
          rafId
        );

        rafId = null;

      }


      pendingPosition = null;


      applyPosition(
        position
      );

    };


    window.addEventListener(
      'resize',
      handleResize,
      {
        passive: true
      }
    );


    /* =====================================================
       KEYBOARD ACCESSIBILITY
    ===================================================== */

    interaction.addEventListener(
      'keydown',
      (event) => {

        let newPosition =
          position;


        if (
          event.key === 'ArrowLeft'
        ) {

          newPosition -= 2;

        }


        if (
          event.key === 'ArrowRight'
        ) {

          newPosition += 2;

        }


        if (
          event.key === 'Home'
        ) {

          newPosition = 0;

        }


        if (
          event.key === 'End'
        ) {

          newPosition = 100;

        }


        if (
          newPosition !== position
        ) {

          event.preventDefault();


          applyPosition(
            newPosition
          );

        }

      }
    );


    /* =====================================================
       INITIAL POSITION
    ===================================================== */

    applyPosition(
      position
    );


    /*
     * Mark JS as ready so letter animation
     * can start when section becomes visible.
     */

    section.classList.add(
      'is-ready'
    );

  };


  /* =====================================================
     SCROLL REVEAL
  ===================================================== */

  const initScrollReveal = () => {

    const section =
      document.getElementById(
        sectionId
      );


    if (!section) {
      return;
    }


    if (
      section.dataset.baRevealInitialized === 'true'
    ) {

      return;

    }


    section.dataset.baRevealInitialized =
      'true';


    const reduceMotion =
      window.matchMedia &&
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;


    if (
      reduceMotion ||
      !(
        'IntersectionObserver'
        in window
      )
    ) {

      section.classList.add(
        'is-visible'
      );

      return;

    }


    const observer =
      new IntersectionObserver(
        (entries, obs) => {

          entries.forEach(
            (entry) => {

              if (
                entry.isIntersecting
              ) {

                section.classList.add(
                  'is-visible'
                );


                obs.unobserve(
                  section
                );

              }

            }
          );

        },
        {
          threshold: 0.1,

          rootMargin:
            '0px 0px -8% 0px'
        }
      );


    observer.observe(
      section
    );

  };


  /* =====================================================
     INIT
  ===================================================== */

  const init = () => {

    initBeforeAfter();

    initScrollReveal();

  };


  if (
    document.readyState === 'loading'
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
     SHOPIFY CUSTOMIZER
  ===================================================== */

  document.addEventListener(
    'shopify:section:load',
    (event) => {

      if (
        event.detail &&
        event.detail.sectionId ===
          'template--23927395876979__clicle_before_dEh34q'
      ) {

        const section =
          document.getElementById(
            sectionId
          );


        if (section) {

          section.dataset.baInitialized =
            'false';


          section.dataset.baRevealInitialized =
            'false';

        }


        init();

      }

    }
  );

})();
