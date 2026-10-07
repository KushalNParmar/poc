 
  (() => { 
    const section = document.getElementById( 
      "lngvty-sx-template--23927395221619__story_lngvty_9mdQCP" 
    ); 
 
    if (!section) return; 
 
    const show = () => { 
      section.classList.add('is-visible'); 
    }; 
 
    if (!('IntersectionObserver' in window)) { 
      show(); 
      return; 
    } 
 
    const observer = new IntersectionObserver( 
      (entries, instance) => { 
        if (entries[0].isIntersecting) { 
          show(); 
          instance.disconnect(); 
        } 
      }, 
      { 
        threshold: 0.15 
      } 
    ); 
 
    observer.observe(section); 
  })(); 
