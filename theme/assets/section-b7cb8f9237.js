
  (function() {
    "use strict";

    var fig = document.getElementById("fig-template--23927395745907__triangle_iQQh4T");
    if (!fig || fig.dataset.triangleInitialized === "true") return;

    fig.dataset.triangleInitialized = "true";

    var root = document.documentElement;
    var replay = document.getElementById("figRep-template--23927395745907__triangle_iQQh4T");
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var IO = "IntersectionObserver" in window;

    root.classList.add("has-js");

    if (!reduce && IO) {
      root.classList.add("has-anim");
    }

    /* Preserve the supplied mask-reveal behavior, but scope it to this section. */
    var mask = fig.querySelector(".mask-reveal");

    if (mask && !mask.querySelector("i")) {
      var inner = document.createElement("i");
      while (mask.firstChild) inner.appendChild(mask.firstChild);
      mask.appendChild(inner);
    }

    function onceVisible(el) {
      if (!el) return;

      if (reduce || !IO) {
        el.classList.add("is-visible");
        return;
      }

      var io = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.15
      });

      io.observe(el);
    }

    onceVisible(mask);

    function play() {
      if (!fig) return;

      fig.classList.remove("is-playing");
      void fig.offsetWidth;
      fig.classList.add("is-playing");
    }

    if (!root.classList.contains("has-anim")) {
      if (replay) replay.remove();
      return;
    }

    var figureObserver = new IntersectionObserver(function(entries) {
      if (!entries.length) return;

      if (entries[0].isIntersecting) {
        play();
      } else {
        fig.classList.remove("is-playing");
      }
    }, {
      threshold: 0.28
    });

    figureObserver.observe(fig);

    if (replay) {
      replay.addEventListener("click", play);
    }
  })();
