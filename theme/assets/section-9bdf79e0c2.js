
  (function() {

    var root = document.getElementById(
      'lvg-skin-reels-template--23927395221619__skin_reels_P9i3te'
    );

    if (!root) return;


    /* ------------------------------------
       SCROLL REVEAL
    ------------------------------------ */

    (function initScrollReveal() {

      root.classList.add('js');

      var revealEls = [].slice.call(
        root.querySelectorAll('.sr-rv')
      );

      if (!revealEls.length) return;


      var reduceMotion =
        window.matchMedia &&
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;


      if (
        reduceMotion ||
        !('IntersectionObserver' in window)
      ) {

        revealEls.forEach(function(el) {
          el.classList.add('on');
        });

        return;

      }


      var revealObserver =
        new IntersectionObserver(
          function(entries, obs) {

            entries.forEach(function(entry) {

              if (entry.isIntersecting) {

                entry.target.classList.add('on');

                obs.unobserve(
                  entry.target
                );

              }

            });

          },
          {
            threshold: .1,
            rootMargin: '0px 0px -8% 0px'
          }
        );


      revealEls.forEach(function(el) {

        revealObserver.observe(el);

      });

    })();


    var rail =
      root.querySelector('[data-sr-rail]');

    var cards = [].slice.call(
      root.querySelectorAll('.sr-card')
    );

    var counter =
      root.querySelector('[data-sr-counter]');

    var prev =
      root.querySelector('[data-sr-prev]');

    var next =
      root.querySelector('[data-sr-next]');


    if (!rail || !cards.length) return;


    /* ------------------------------------
       STATE
    ------------------------------------ */

    var activeCard = null;
    var activeVideo = null;

    var hoverCard = null;

    var soundEnabled = false;
    var soundVideo = null;

    var ticking = false;
    var resizeTimer = null;


    /* ------------------------------------
       HELPERS
    ------------------------------------ */

    function isMobile() {

      return window.matchMedia(
        '(max-width: 860px)'
      ).matches;

    }


    function getVideo(card) {

      if (!card) return null;

      return card.querySelector('video');

    }


    function step() {

      if (cards.length < 2) {

        return rail.clientWidth || 1;

      }


      var firstRect =
        cards[0].getBoundingClientRect();

      var secondRect =
        cards[1].getBoundingClientRect();


      return Math.max(
        1,
        Math.round(
          secondRect.left -
          firstRect.left
        )
      );

    }


    function view() {

      return Math.max(
        1,
        Math.round(
          rail.clientWidth /
          step()
        )
      );

    }


    function end() {

      return (
        rail.scrollLeft >=
        rail.scrollWidth -
        rail.clientWidth -
        2
      );

    }


    /* ------------------------------------
       VIDEO CONTROL
    ------------------------------------ */

    function pauseAllVideos(exceptVideo) {

      cards.forEach(function(card) {

        var video = getVideo(card);

        if (
          !video ||
          video === exceptVideo
        ) return;


        video.pause();

        video.muted = true;
        video.defaultMuted = true;

      });

    }


    function playOnly(video) {

      pauseAllVideos(video);

      if (!video) return;


      if (
        soundEnabled &&
        soundVideo === video
      ) {

        video.muted = false;
        video.defaultMuted = false;
        video.volume = 1;

      } else {

        video.muted = true;
        video.defaultMuted = true;
        video.volume = 1;

      }


      var promise =
        video.play();


      if (
        promise &&
        typeof promise.catch ===
          'function'
      ) {

        promise.catch(function() {

          video.muted = true;
          video.defaultMuted = true;

          video.play().catch(
            function() {}
          );

        });

      }

    }


    function updateVideoState() {

      if (!activeCard) {

        pauseAllVideos(null);

        return;

      }


      var video =
        getVideo(activeCard);

      activeVideo = video;

      playOnly(video);

    }


    function setSoundVideo(video) {

      if (
        !soundEnabled ||
        !video
      ) return;


      soundVideo = video;


      if (
        activeCard &&
        getVideo(activeCard) === video
      ) {

        playOnly(video);

      }

    }


    /* ------------------------------------
       ACTIVE CARD
    ------------------------------------ */

    function highlightCard(card) {

      if (!card) return;


      cards.forEach(function(item) {

        item.classList.toggle(
          'sr-center',
          item === card
        );

      });

    }


    function setActiveCard(card) {

      if (!card) return;


      var video =
        getVideo(card);

      activeCard = card;

      activeVideo = video;

      highlightCard(card);


      if (
        isMobile() &&
        soundEnabled &&
        video
      ) {

        soundVideo = video;

      }


      updateVideoState();

    }


    /* ------------------------------------
       DESKTOP HOVER
    ------------------------------------ */

    function desktopHoverStart(card) {

      if (isMobile()) return;


      var video =
        getVideo(card);

      hoverCard = card;


      cards.forEach(function(item) {

        item.classList.remove(
          'sr-hover'
        );

      });


      card.classList.add(
        'sr-hover'
      );


      activeCard = card;

      activeVideo = video;

      highlightCard(card);


      if (
        soundEnabled &&
        video
      ) {

        soundVideo = video;

      }


      updateVideoState();

    }


    function desktopHoverEnd(card) {

      if (isMobile()) return;

      if (hoverCard !== card) return;


      hoverCard = null;


      cards.forEach(function(item) {

        item.classList.remove(
          'sr-hover'
        );

      });


      updateVideoState();

    }


    /* ------------------------------------
       MOBILE ACTIVE INDEX
    ------------------------------------ */

    function getMobileIndex() {

      var s = step();

      if (!s) return 0;


      var index =
        Math.round(
          rail.scrollLeft / s
        );


      return Math.max(
        0,
        Math.min(
          cards.length - 1,
          index
        )
      );

    }


    /* ------------------------------------
       DESKTOP ACTIVE INDEX
    ------------------------------------ */

    function getDesktopIndex() {

      var s = step();

      if (!s) return 0;


      var first =
        Math.round(
          rail.scrollLeft / s
        );

      var visible =
        view();


      return Math.max(
        0,
        Math.min(
          cards.length - 1,
          first +
          Math.floor(
            visible / 2
          )
        )
      );

    }


    /* ------------------------------------
       MOBILE ACTIVE
    ------------------------------------ */

    function updateMobileActive() {

      if (!isMobile()) return;


      var index =
        getMobileIndex();

      var card =
        cards[index];


      if (!card) return;


      if (
        card !== activeCard
      ) {

        setActiveCard(card);

      } else {

        updateVideoState();

      }

    }


    /* ------------------------------------
       DESKTOP ACTIVE
    ------------------------------------ */

    function updateDesktopActive() {

      if (isMobile()) return;


      if (hoverCard) return;


      var index =
        getDesktopIndex();

      var card =
        cards[index];


      if (!card) return;


      if (
        card !== activeCard
      ) {

        setActiveCard(card);

      } else {

        updateVideoState();

      }

    }


    /* ------------------------------------
       ACTIVE UPDATE
    ------------------------------------ */

    function updateActive() {

      if (isMobile()) {

        updateMobileActive();

      } else {

        updateDesktopActive();

      }

    }


    /* ------------------------------------
       COUNTER
    ------------------------------------ */

    function paintCounter() {

      var s = step();

      if (!s) return;


      var first =
        Math.round(
          rail.scrollLeft / s
        );

      var last =
        Math.min(
          cards.length,
          first + view()
        );


      if (counter) {

        counter.textContent =
          cards.length
            ? String(
                first + 1
              ).padStart(2, '0') +
              '–' +
              String(
                last
              ).padStart(2, '0') +
              ' of ' +
              String(
                cards.length
              ).padStart(2, '0')
            : '';

      }


      if (prev) {

        prev.disabled =
          rail.scrollLeft <= 2;

      }


      if (next) {

        next.disabled =
          end();

      }

    }


    /* ------------------------------------
       CARD EVENTS
    ------------------------------------ */

    cards.forEach(function(card) {

      var video =
        getVideo(card);


      if (video) {

        video.muted = true;

        video.defaultMuted = true;

        video.volume = 1;

        video.setAttribute(
          'playsinline',
          ''
        );

        video.setAttribute(
          'webkit-playsinline',
          ''
        );

        video.pause();

      }


      card.addEventListener(
        'mouseenter',
        function() {

          if (isMobile()) return;

          desktopHoverStart(card);

        }
      );


      card.addEventListener(
        'mouseleave',
        function() {

          if (isMobile()) return;

          desktopHoverEnd(card);

        }
      );


      card.addEventListener(
        'click',
        function(e) {

          e.preventDefault();


          soundEnabled = true;

          root.classList.add(
            'sr-sound-on'
          );


          hoverCard = null;


          cards.forEach(
            function(item) {

              item.classList.remove(
                'sr-hover'
              );

            }
          );


          activeCard = card;

          activeVideo = video;


          highlightCard(card);


          if (video) {

            soundVideo = video;

          }


          updateVideoState();

        }
      );

    });


    /* ------------------------------------
       SCROLL
    ------------------------------------ */

    rail.addEventListener(
      'scroll',
      function() {

        paintCounter();


        if (!ticking) {

          ticking = true;


          requestAnimationFrame(
            function() {

              ticking = false;

              updateActive();

            }
          );

        }

      },
      {
        passive: true
      }
    );


    /* ------------------------------------
       ARROW NAVIGATION
    ------------------------------------ */

    function page(dir) {

      var s = step();


      var amount =
        isMobile()
          ? s
          : s * view();


      var behavior =
        isMobile()
          ? 'auto'
          : (
              window.matchMedia(
                '(prefers-reduced-motion: reduce)'
              ).matches
                ? 'auto'
                : 'smooth'
            );


      rail.scrollTo({

        left:
          rail.scrollLeft +
          dir * amount,

        behavior: behavior

      });


      if (isMobile()) {

        requestAnimationFrame(
          function() {

            updateMobileActive();

            paintCounter();

          }
        );

      }

    }


    if (prev) {

      prev.addEventListener(
        'click',
        function() {

          page(-1);

        }
      );

    }


    if (next) {

      next.addEventListener(
        'click',
        function() {

          page(1);

        }
      );

    }


    /* ------------------------------------
       KEYBOARD
    ------------------------------------ */

    rail.addEventListener(
      'keydown',
      function(e) {

        if (
          e.key ===
          'ArrowRight'
        ) {

          e.preventDefault();

          page(1);

        }


        if (
          e.key ===
          'ArrowLeft'
        ) {

          e.preventDefault();

          page(-1);

        }

      }
    );


    /* ------------------------------------
       RESIZE
    ------------------------------------ */

    window.addEventListener(
      'resize',
      function() {

        clearTimeout(
          resizeTimer
        );


        resizeTimer =
          setTimeout(
            function() {

              hoverCard = null;


              cards.forEach(
                function(card) {

                  card.classList.remove(
                    'sr-hover'
                  );

                }
              );


              updateActive();

              paintCounter();

              updateVideoState();

            },
            80
          );

      },
      {
        passive: true
      }
    );


    /* ------------------------------------
       INITIAL LOAD
    ------------------------------------ */

    function initialize() {

      var index;


      if (isMobile()) {

        index =
          getMobileIndex();

      } else {

        index =
          getDesktopIndex();

      }


      var firstCard =
        cards[index] ||
        cards[0];


      if (firstCard) {

        activeCard =
          firstCard;

        activeVideo =
          getVideo(
            firstCard
          );

        highlightCard(
          firstCard
        );

      }


      cards.forEach(
        function(card) {

          var video =
            getVideo(card);

          if (!video) return;


          video.muted = true;

          video.defaultMuted = true;

          video.volume = 1;

          video.pause();

        }
      );


      updateVideoState();

      paintCounter();

    }


    requestAnimationFrame(
      function() {

        initialize();

      }
    );

  })();
