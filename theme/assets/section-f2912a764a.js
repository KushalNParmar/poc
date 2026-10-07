 
  (function () { 
 
    /* ========================================================
       REVEAL
       ======================================================== */ 
 
    function initReveal(root) { 
 
      var reduce = window.matchMedia && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches; 
 
      var IO = 'IntersectionObserver' in window; 
 
      var rv = [].slice.call( 
        root.querySelectorAll('.bnf-rv:not(.in)') 
      ); 
 
      if (!rv.length) return; 
 
      if (reduce || !IO) { 
 
        rv.forEach(function (element) { 
          element.classList.add('in'); 
        }); 
 
        return; 
      } 
 
      var observer = new IntersectionObserver( 
 
        function (entries) { 
 
          entries.forEach(function (entry) { 
 
            if (entry.isIntersecting) { 
 
              entry.target.classList.add('in'); 
 
              observer.unobserve(entry.target); 
            } 
 
          }); 
 
        }, 
 
        { 
          rootMargin: '0px 0px -8% 0px', 
          threshold: 0.12 
        } 
 
      ); 
 
      rv.forEach(function (element) { 
        observer.observe(element); 
      }); 
 
    } 
 
 
    /* ========================================================
       DESKTOP SLIDER ARROWS
       ======================================================== */ 
 
    function initSlider(root) { 
 
      var slider = root.querySelector( 
        '.bnf-track.bnf-slider' 
      ); 
 
      var prev = root.querySelector('[data-bnf-prev]'); 
 
      var next = root.querySelector('[data-bnf-next]'); 
 
      if (!slider || !prev || !next) return; 
 
      /* 
        Prevent duplicate event listeners if Shopify Theme Editor 
        re-initializes the section. 
      */ 
 
      if (slider.dataset.bnfSliderInit === 'true') return; 
 
      slider.dataset.bnfSliderInit = 'true'; 
 
 
      function getScrollAmount() { 
 
        var firstCard = slider.querySelector('.bnf-card'); 
 
        if (!firstCard) { 
          return slider.clientWidth * 0.8; 
        } 
 
        var styles = window.getComputedStyle(slider); 
 
        var gap = parseFloat( 
          styles.columnGap || styles.gap 
        ) || 0; 
 
        return firstCard.getBoundingClientRect().width + gap; 
      } 
 
 
      function updateButtons() { 
 
        var maxScroll = Math.max( 
          0, 
          slider.scrollWidth - slider.clientWidth 
        ); 
 
        var hasOverflow = maxScroll > 2; 
 
        /* 
          If all cards fit inside the visible area, hide arrows. 
        */ 
 
        prev.style.visibility = hasOverflow 
          ? 'visible' 
          : 'hidden'; 
 
        next.style.visibility = hasOverflow 
          ? 'visible' 
          : 'hidden'; 
 
        /* 
          Disable previous button at the beginning. 
        */ 
 
        prev.disabled = !hasOverflow || slider.scrollLeft <= 2; 
 
        /* 
          Disable next button at the end. 
        */ 
 
        next.disabled = 
          !hasOverflow || 
          slider.scrollLeft >= maxScroll - 2; 
 
        prev.setAttribute( 
          'aria-disabled', 
          prev.disabled ? 'true' : 'false' 
        ); 
 
        next.setAttribute( 
          'aria-disabled', 
          next.disabled ? 'true' : 'false' 
        ); 
 
      } 
 
 
      prev.addEventListener('click', function () { 
 
        slider.scrollBy({ 
          left: -getScrollAmount(), 
          behavior: 'smooth' 
        }); 
 
      }); 
 
 
      next.addEventListener('click', function () { 
 
        slider.scrollBy({ 
          left: getScrollAmount(), 
          behavior: 'smooth' 
        }); 
 
      }); 
 
 
      slider.addEventListener( 
        'scroll', 
        updateButtons, 
        { passive: true } 
      ); 
 
 
      window.addEventListener( 
        'resize', 
        updateButtons 
      ); 
 
 
      requestAnimationFrame(updateButtons); 
 
    } 
 
 
    /* ========================================================
       MAIN INITIALIZER
       ======================================================== */ 
 
    function initBenefitsRail(root) { 
 
      if (!root) return; 
 
      initReveal(root); 
 
      initSlider(root); 
 
    } 
 
 
    /* ========================================================
       INITIAL LOAD
       ======================================================== */ 
 
    function initAll() { 
 
      var sections = document.querySelectorAll( 
        '[data-benefits-section]' 
      ); 
 
      sections.forEach(function (section) { 
 
        initBenefitsRail(section); 
 
      }); 
 
    } 
 
 
    if (document.readyState === 'loading') { 
 
      document.addEventListener( 
        'DOMContentLoaded', 
        initAll 
      ); 
 
    } else { 
 
      initAll(); 
 
    } 
 
 
    /* ========================================================
       SHOPIFY THEME EDITOR
       ======================================================== */ 
 
    document.addEventListener( 
      'shopify:section:load', 
 
      function (event) { 
 
        var section = 
          event.target.querySelector && 
          event.target.querySelector( 
            '[data-benefits-section]' 
          ); 
 
        if (section) { 
 
          initBenefitsRail(section); 
 
        } 
 
      } 
 
    ); 
 
  })(); 
