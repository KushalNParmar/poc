
    (function(){
      var bar=document.getElementById('lvg-sticky-serum-bar-template--23927395221619__serum_bar_beG438');
      if(!bar)return;
      var cta=bar.querySelector('.ssb-cta'), body=document.body;
      var hero=document.querySelector('.hero'), footer=document.querySelector('footer');
      var story=document.querySelector('[id*="lngvty-story-story"]'), consistency=document.querySelector('[id*="skinmaxxing-consistency"]');
      var pastHero=!hero, atFooter=false, atStory=false, atConsistency=false;
      function paint(){
        var show=pastHero&&!atFooter&&!atStory&&!atConsistency;
        bar.classList.toggle('lvg-sticky-bar-show',show);
        bar.setAttribute('aria-hidden',show?'false':'true');
        if(cta)cta.setAttribute('tabindex',show?'0':'-1');
        body.classList.toggle('lvg-sticky-bar-active',show);
      }
      if('IntersectionObserver' in window){
        if(hero)new IntersectionObserver(function(entries){pastHero=!entries[0].isIntersecting;paint()},{threshold:0}).observe(hero);
        if(footer)new IntersectionObserver(function(entries){atFooter=entries[0].isIntersecting;paint()},{threshold:.12}).observe(footer);
        if(story)new IntersectionObserver(function(entries){atStory=entries[0].isIntersecting;paint()},{threshold:.55}).observe(story);
        if(consistency)new IntersectionObserver(function(entries){atConsistency=entries[0].isIntersecting;paint()},{threshold:.2}).observe(consistency);
      }else{
        var ticking=false;
        window.addEventListener('scroll',function(){
          if(ticking)return;ticking=true;requestAnimationFrame(function(){
            ticking=false;pastHero=window.scrollY>window.innerHeight*.7;
            atFooter=footer&&footer.getBoundingClientRect().top<window.innerHeight*.88;
            paint();
          });
        },{passive:true});
      }
      document.addEventListener('visibilitychange',function(){if(!document.hidden)paint()});
      paint();
    })();
  