 
(() => { 
 
  const root = document.querySelector( 
    '#lvg-rtb-depth-template--23927395549299__believe_process_wwfnMj' 
  ); 
 
  if (!root) return; 
 
  const revealElements = Array.from( 
    root.querySelectorAll('.lvg-rtb-reveal') 
  ); 
 
  root.classList.add('lvg-rtb-js'); 
 
  const revealAll = () => { 
    revealElements.forEach((element, index) => { 
      element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`; 
      element.classList.add('is-revealed'); 
    }); 
  }; 
 
  if ( 
    revealElements.length && 
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  ) { 
    if ('IntersectionObserver' in window) { 
      const revealObserver = new IntersectionObserver( 
        (entries, observer) => { 
          entries.forEach((entry) => { 
            if (!entry.isIntersecting) return; 
            entry.target.classList.add('is-revealed'); 
            observer.unobserve(entry.target); 
          }); 
        }, 
        { threshold: 0.12, rootMargin: '0px 0px -10% 0px' } 
      ); 
 
      revealElements.forEach((element) => revealObserver.observe(element)); 
    } else { 
      revealAll(); 
    } 
  } else { 
    revealAll(); 
  } 
 
  const stage = root.querySelector( 
    '.lvg-rtb-ch3-timeline-wrap' 
  ); 
 
  const timeline = root.querySelector( 
    '.lvg-rtb-ch3-timeline' 
  ); 
 
  const heading = root.querySelector( 
    '.lvg-rtb-ch3-heading' 
  ); 
 
  const label = root.querySelector( 
    '.lvg-rtb-ch3-label' 
  ); 
 
  if (!stage || !timeline) return; 
 
  const items = Array.from( 
    timeline.querySelectorAll( 
      '.lvg-rtb-ch3-timeline__item' 
    ) 
  ); 
 
  if (!items.length) return; 
 
 
  /* ===================================================== 
     REDUCED MOTION 
  ===================================================== */ 
 
  const reducedMotion = window.matchMedia( 
    '(prefers-reduced-motion: reduce)' 
  ).matches; 
 
  if (reducedMotion) { 
 
    if (label) { 
      label.classList.add('is-heading-visible'); 
    } 
 
    if (heading) { 
      heading.classList.add('is-heading-visible'); 
    } 
 
    items.forEach((item, index) => { 
 
      item.style.setProperty( 
        '--ch3-content', 
        '1' 
      ); 
 
      item.style.setProperty( 
        '--ch3-node', 
        '1' 
      ); 
 
      item.style.setProperty( 
        '--ch3-line', 
        index < items.length - 1 ? '1' : '0' 
      ); 
 
    }); 
 
    return; 
  } 
 
 
  /* ===================================================== 
     HEADING REVEAL 
  ===================================================== */ 
 
  let headingVisible = false; 
 
  const revealHeading = () => { 
 
    if (headingVisible) return; 
 
    headingVisible = true; 
 
    if (label) { 
      label.classList.add('is-heading-visible'); 
    } 
 
    if (heading) { 
      heading.classList.add('is-heading-visible'); 
    } 
 
  }; 
 
 
  /* 
   * Reveal heading when the Chapter 3 heading 
   * starts entering the viewport. 
   */ 
 
  if ('IntersectionObserver' in window) { 
 
    const headingObserver = new IntersectionObserver( 
      (entries) => { 
 
        entries.forEach((entry) => { 
 
          if (entry.isIntersecting) { 
 
            revealHeading(); 
 
            headingObserver.disconnect(); 
 
          } 
 
        }); 
 
      }, 
      { 
        threshold: 0.15, 
        rootMargin: '0px 0px -8% 0px' 
      } 
    ); 
 
    if (heading || label) { 
 
      headingObserver.observe( 
        heading || label 
      ); 
 
    } 
 
  } else { 
 
    revealHeading(); 
 
  } 
 
 
  /* ===================================================== 
     TIMELINE 
  ===================================================== */ 
 
  let raf = null; 
 
 
  const clamp = (value) => { 
 
    return Math.max( 
      0, 
      Math.min( 
        1, 
        value 
      ) 
    ); 
 
  }; 
 
 
  const ease = (value) => { 
 
    value = clamp(value); 
 
    return ( 
      value * 
      value * 
      (3 - 2 * value) 
    ); 
 
  }; 
 
 
  /* ===================================================== 
     UPDATE TIMELINE 
  ===================================================== */ 
 
  const update = () => { 
 
    raf = null; 
 
    const mobile = window.matchMedia( 
      '(max-width: 900px)' 
    ).matches; 
 
 
    /* ----------------------------------------------- 
       MOBILE 
    ------------------------------------------------ */ 
 
    if (mobile) { 
 
      items.forEach((item, index) => { 
 
        item.style.setProperty( 
          '--ch3-content', 
          '1' 
        ); 
 
        item.style.setProperty( 
          '--ch3-node', 
          '1' 
        ); 
 
        item.style.setProperty( 
          '--ch3-line', 
          index < items.length - 1 ? '1' : '0' 
        ); 
 
      }); 
 
      return; 
    } 
 
 
    /* ----------------------------------------------- 
       DESKTOP 
    ------------------------------------------------ */ 
 
    const rect = stage.getBoundingClientRect(); 
 
    const viewportHeight = window.innerHeight; 
 
    const totalDistance = Math.max( 
      1, 
      viewportHeight * 0.65 
    ); 
 
    const travelled = 
      viewportHeight - rect.top; 
 
    const progress = clamp( 
      travelled / totalDistance 
    ); 
 
 
    const usable = clamp( 
      (progress - 0.04) / 0.92 
    ); 
 
 
    const sequence = 
      usable * 
      Math.max( 
        1, 
        items.length - 1 
      ); 
 
 
    /* ================================================= 
       EACH CARD 
    ================================================= */ 
 
    items.forEach((item, index) => { 
 
      /* --------------------------------------------- 
         FIRST CARD 
      --------------------------------------------- */ 
 
      if (index === 0) { 
 
        const firstProgress = ease( 
          clamp(sequence) 
        ); 
 
        item.style.setProperty( 
          '--ch3-content', 
          '1' 
        ); 
 
        item.style.setProperty( 
          '--ch3-node', 
          '1' 
        ); 
 
        item.style.setProperty( 
          '--ch3-line', 
          firstProgress.toFixed(3) 
        ); 
 
        return; 
      } 
 
 
      /* --------------------------------------------- 
         FOLLOWING CARDS 
      --------------------------------------------- */ 
 
      const segment = 
        sequence - 
        (index - 1); 
 
 
      /* Connector */ 
 
      const line = ease( 
        clamp(segment) 
      ); 
 
 
      /* Content */ 
 
      const content = ease( 
        clamp( 
          (segment - 0.52) / 0.48 
        ) 
      ); 
 
 
      /* Node */ 
 
      const node = ease( 
        clamp( 
          (segment - 0.72) / 0.28 
        ) 
      ); 
 
 
      item.style.setProperty( 
        '--ch3-line', 
        line.toFixed(3) 
      ); 
 
      item.style.setProperty( 
        '--ch3-content', 
        content.toFixed(3) 
      ); 
 
      item.style.setProperty( 
        '--ch3-node', 
        node.toFixed(3) 
      ); 
 
    }); 
 
  }; 
 
 
  /* ===================================================== 
     RAF SCROLL HANDLER 
  ===================================================== */ 
 
  const requestUpdate = () => { 
 
    if (raf !== null) return; 
 
    raf = window.requestAnimationFrame( 
      update 
    ); 
 
  }; 
 
 
  window.addEventListener( 
    'scroll', 
    requestUpdate, 
    { 
      passive: true 
    } 
  ); 
 
 
  window.addEventListener( 
    'resize', 
    requestUpdate, 
    { 
      passive: true 
    } 
  ); 
 
 
  /* Initial */ 
 
  update(); 
 
 
  /* ===================================================== 
     SHOPIFY THEME EDITOR CLEANUP 
  ===================================================== */ 
 
  document.addEventListener( 
    'shopify:section:unload', 
    (event) => { 
 
      if ( 
        event.target && 
        event.target.id === root.id 
      ) { 
 
        window.removeEventListener( 
          'scroll', 
          requestUpdate 
        ); 
 
        window.removeEventListener( 
          'resize', 
          requestUpdate 
        ); 
 
        if (raf !== null) { 
 
          cancelAnimationFrame(raf); 
 
          raf = null; 
 
        } 
 
      } 
 
    }, 
    { 
      once: true 
    } 
  ); 
 
})(); 
