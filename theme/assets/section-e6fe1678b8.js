
    (function(){
      var root=document.getElementById('lvg-skinmaxxing-consistency-template--23927395221619__consistent_model_4tN8VB');
      if(!root)return;

      (function initScrollReveal(){
        root.classList.add('js');

        var revealEls=[].slice.call(
          root.querySelectorAll('.sm-rv')
        );

        if(!revealEls.length)return;

        var reduceMotion=
          window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if(
          reduceMotion ||
          !('IntersectionObserver' in window)
        ){
          revealEls.forEach(function(el){
            el.classList.add('on')
          });
          return;
        }

        var revealObserver=new IntersectionObserver(
          function(entries,obs){
            entries.forEach(function(entry){
              if(entry.isIntersecting){
                entry.target.classList.add('on');
                obs.unobserve(entry.target)
              }
            });
          },
          {
            threshold:.1,
            rootMargin:'0px 0px -8% 0px'
          }
        );

        revealEls.forEach(function(el){
          revealObserver.observe(el)
        });
      })();

      var svg=root.querySelector('.sm-plot svg');
      var tread=root.querySelector('[data-sm-tread]');
      var maxx=root.querySelector('[data-sm-maxx]');

      if(!svg||!tread||!maxx)return;

      var reduce=
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;

      var IO='IntersectionObserver' in window;

      var area=root.querySelector('.sm-area');
      var head=root.querySelector('.sm-head');
      var treadHead=root.querySelector('.sm-thead');
      var ring=root.querySelector('.sm-ring');
      var drop=root.querySelector('.sm-drop');
      var peak=root.querySelector('.sm-peak');

      var vertices=[].slice.call(
        root.querySelectorAll('.sm-v')
      );

      var ticks=[].slice.call(
        root.querySelectorAll('.sm-gl,.sm-base,.sm-tick')
      );

      var labels=[].slice.call(
        root.querySelectorAll('.sm-fl')
      );

      var by=function(k){
        return labels.filter(function(e){
          return e.getAttribute('data-sm-f')===k;
        })
      };

      var flA=by('a');
      var flB=by('b');
      var flY=by('y');
      var flC=by('cyc');
      var flMid=by('mid');
      var flX=by('xo');

      var lT=0;
      var lM=0;
      var cross=.45;
      var pts=[];
      var raf=0;
      var played=false;
      var DUR=3300;

      function clamp(v){
        return v<0?0:v>1?1:v
      }

      function seg(p,a,b){
        return clamp((p-a)/(b-a))
      }

      function ease(x){
        return x<.5
          ?4*x*x*x
          :1-Math.pow(-2*x+2,3)/2
      }

      function op(list,v){
        list.forEach(function(e){
          e.style.opacity=String(v)
        })
      }

      function clear(list){
        list.forEach(function(e){
          e.style.opacity=''
        })
      }

      function treadY(x){
        for(var i=1;i<pts.length;i++){
          if(x<=pts[i].x){
            var a=pts[i-1];
            var b=pts[i];
            var t=(x-a.x)/((b.x-a.x)||1);

            return a.y+(b.y-a.y)*t
          }
        }

        return pts.length
          ?pts[pts.length-1].y
          :0
      }

      function arm(){
        try{
          lT=tread.getTotalLength();
          lM=maxx.getTotalLength();

          pts=tread
            .getAttribute('points')
            .trim()
            .split(/\s+/)
            .map(function(q){
              var a=q.split(',');
              return{
                x:+a[0],
                y:+a[1]
              }
            });

          for(var k=1;k<=280;k++){
            var f=k/280;
            var p=maxx.getPointAtLength(lM*f);

            if(p.y<treadY(p.x)){
              cross=f;
              break
            }
          }

          var x=maxx.getPointAtLength(lM*cross);

          ring.setAttribute('cx',x.x);
          ring.setAttribute('cy',x.y);

          drop.setAttribute('x1',x.x);
          drop.setAttribute('x2',x.x);
          drop.setAttribute('y1',x.y+10);

          return true
        }catch(e){
          return false
        }
      }

      function hide(){
        tread.style.strokeDasharray=lT+'px';
        tread.style.strokeDashoffset=lT+'px';

        maxx.style.strokeDasharray=lM+'px';
        maxx.style.strokeDashoffset=lM+'px';

        op(vertices,0);
        op(ticks,0);
        op(labels,0);

        [
          area,
          ring,
          drop,
          peak,
          head,
          treadHead
        ].forEach(function(e){
          if(e)e.style.opacity='0'
        })
      }

      function finish(){
        if(raf)cancelAnimationFrame(raf);

        tread.style.strokeDasharray='none';
        tread.style.strokeDashoffset='0';

        maxx.style.strokeDasharray='none';
        maxx.style.strokeDashoffset='0';

        clear(vertices);
        clear(ticks);
        clear(labels);

        [
          area,
          ring,
          drop,
          peak
        ].forEach(function(e){
          if(e)e.style.opacity=''
        });

        if(head)head.style.opacity='0';
        if(treadHead)treadHead.style.opacity='0'
      }

      function play(){
        if(reduce||!arm()){
          finish();
          return
        }

        hide();

        var start=0;

        function step(ts){
          if(!start)start=ts;

          var p=clamp((ts-start)/DUR);

          op(
            ticks,
            seg(p,0,.10)
          );

          op(
            flY,
            seg(p,0,.10)
          );

          op(
            flC,
            seg(p,.02,.14)
          );

          op(
            flMid,
            seg(p,.05,.26)
          );

          var t=ease(
            seg(p,.06,.60)
          );

          tread.style.strokeDashoffset=
            (lT*(1-t))+'px';

          var n=Math.floor(
            t*vertices.length+.0001
          );

          vertices.forEach(function(e,i){
            e.style.opacity=i<n?'1':'0'
          });

          if(treadHead){
            if(t>.002&&t<.999){
              var q=tread.getPointAtLength(lT*t);

              treadHead.setAttribute('cx',q.x);
              treadHead.setAttribute('cy',q.y);
              treadHead.style.opacity='1'
            }else{
              treadHead.style.opacity='0'
            }
          }

          op(
            flB,
            seg(p,.30,.48)
          );

          var m=ease(
            seg(p,.10,.80)
          );

          maxx.style.strokeDashoffset=
            (lM*(1-m))+'px';

          if(area){
            area.style.opacity=String(
              seg(p,.28,.94)*.085
            )
          }

          if(head){
            if(m>.002&&m<.999){
              var q2=maxx.getPointAtLength(lM*m);

              head.setAttribute('cx',q2.x);
              head.setAttribute('cy',q2.y);
              head.style.opacity='1'
            }else{
              head.style.opacity='0'
            }
          }

          var xo=clamp(
            (m-cross)/.07
          );

          if(ring){
            ring.style.opacity=String(xo);

            ring.setAttribute(
              'r',
              String(9+(1-xo)*14)
            )
          }

          if(drop){
            drop.style.opacity=String(xo*.3)
          }

          op(flX,xo);

          op(
            flA,
            seg(p,.66,.86)
          );

          if(peak){
            peak.style.opacity=String(
              seg(p,.80,.96)
            )
          }

          if(p<1){
            raf=requestAnimationFrame(step)
          }else{
            finish()
          }
        }

        raf=requestAnimationFrame(step)
      }

      if(!reduce&&IO&&arm()){
        hide()
      }else{
        finish()
      }

      function start(){
        if(played)return;

        played=true;
        play()
      }

      if(!reduce&&IO){
        var observer=new IntersectionObserver(
          function(entries){
            if(entries[0].isIntersecting){
              start();
              observer.disconnect()
            }
          },
          {
            threshold:.28,
            rootMargin:'0px 0px -6% 0px'
          }
        );

        observer.observe(
          root.querySelector('.sm-figure')
        )
      }else{
        start()
      }
    })();
  