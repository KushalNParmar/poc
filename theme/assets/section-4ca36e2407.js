 
  (() => { 
    const root = document.getElementById( 
      "lngvty-sx-template--23927395221619__story_lngvty_9mdQCP" 
    ); 
 
    const rail = root?.querySelector('[data-sx-rail]'); 
 
    const cards = [ 
      ...root.querySelectorAll('[data-sx-card]') 
    ]; 
 
    const segments = [ 
      ...root.querySelectorAll('.sx-seg b') 
    ]; 
 
    if (!rail || !cards.length) return; 
 
    let active = 0; 
 
    const set = ( 
      n, 
      behavior = 'smooth' 
    ) => { 
 
      active = 
        (n + cards.length) % 
        cards.length; 
 
      rail.scrollTo({ 
        left: cards[active].offsetLeft, 
        behavior 
      }); 
 
      segments.forEach((segment, index) => { 
        segment.classList.toggle( 
          'on', 
          index === active 
        ); 
      }); 
    }; 
 
 
    root 
      .querySelector('[data-sx-prev]') 
      ?.addEventListener( 
        'click', 
        () => set(active - 1) 
      ); 
 
 
    root 
      .querySelector('[data-sx-next]') 
      ?.addEventListener( 
        'click', 
        () => set(active + 1) 
      ); 
 
 
    let wait; 
 
    rail.addEventListener( 
      'scroll', 
      () => { 
 
        clearTimeout(wait); 
 
        wait = setTimeout(() => { 
 
          const n = cards.reduce( 
            (best, card, index) => { 
 
              return Math.abs( 
                card.offsetLeft - 
                rail.scrollLeft 
              ) < 
              Math.abs( 
                cards[best].offsetLeft - 
                rail.scrollLeft 
              ) 
                ? index 
                : best; 
 
            }, 
            0 
          ); 
 
          if (n !== active) { 
            set(n, 'auto'); 
          } 
 
        }, 80); 
 
      }, 
      { 
        passive: true 
      } 
    ); 
 
 
    /* ---------------------------------
       Card click handler
       ---------------------------------

       IMPORTANT:
       The Read This link is a real <a>.
       We must NOT call preventDefault()
       when that link is clicked.
    --------------------------------- */ 
 
    cards.forEach((card, index) => { 
 
      card.addEventListener( 
        'click', 
        (event) => { 
 
          /*
           * If the user clicked the actual
           * Read This link, let the browser
           * follow the URL normally.
           */
          if (event.target.closest('a')) { 
            return; 
          } 
 
 
          /*
           * Keep the original mobile/tablet
           * carousel behavior for card clicks.
           */
          if ( 
            window.innerWidth < 1100 && 
            Math.abs( 
              card.offsetLeft - 
              rail.scrollLeft 
            ) > 4 
          ) { 
 
            event.preventDefault(); 
 
            set(index); 
          } 
 
        } 
      ); 
 
    }); 
 
  })(); 
