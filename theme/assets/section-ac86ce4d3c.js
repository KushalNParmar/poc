
  (function () {
    var section = document.getElementById('story-skin-diagram-template--23927395811443__truth_spicemen_EXeGwq');
    if (!section) return;

    var trigger = section.querySelector('[data-replay-trigger]');
    var fillItems = section.querySelectorAll('.fill-up');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function paintFill() {
      var vh = window.innerHeight;
      fillItems.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -40 || rect.top > vh + 40) return;
        var fill = (1 - clamp((vh - rect.top) / (vh * 0.62), 0, 1)) * 100;
        el.style.setProperty('--fill', fill.toFixed(2) + '%');
      });
    }

    function play() {
      section.classList.remove('is-playing');
      void section.offsetWidth;
      section.classList.add('is-playing');
    }

    if (reduced) {
      section.classList.add('is-playing');
      fillItems.forEach(function (el) {
        el.style.setProperty('--fill', '0%');
      });
      if (trigger) trigger.remove();
      return;
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            play();
          } else {
            section.classList.remove('is-playing');
          }
        });
      }, { threshold: 0.28 });

      observer.observe(section);
    } else {
      section.classList.add('is-playing');
    }

    if (trigger) {
      trigger.addEventListener('click', play);
    }

    var tick = false;
    function onScrollFrame() {
      tick = false;
      paintFill();
    }

    window.addEventListener('scroll', function () {
      if (!tick) {
        tick = true;
        requestAnimationFrame(onScrollFrame);
      }
    }, { passive: true });

    window.addEventListener('resize', paintFill);
    paintFill();
  })();
