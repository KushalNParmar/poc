
(function() {
  var sectionId = "skin-quiz-template--23927395516531__quiz_fiPRce";
  var root = document.getElementById(sectionId);
  if (!root) return;

  var SERUMS = {"acne": {
        key: "acne",
        name: "Acne • Blemish Control",
        color: "#7dc04c",
        url: "\/products\/acne-blemish-control-serum-30ml",
        variantId:48573386948765,
        img:"/assets/media/2_2b293fb2-0a55-4d2f-a70e-ee4b658e200f-5ab6335168.jpg",
        price: "Rs. 1,049.00",
        why: "Your barrier is being stripped faster than it can rebuild.",
        testi: {
          q: "\"My acne came back every cycle without fail. At day 47 it did not. I kept waiting for it.\"",
          who: "Ankita, Acne + Blemish serum"
        },
        stats: [
          {
            n: "-47.7%",
            l: "Acne lesions at 4 weeks. -26.2% by week 2."
          }
        ],
        otherDesc: "For skin that won't stay clear."
      },"dark": {
        key: "dark",
        name: "Dark Spots • Pore Control",
        color: "#e67e22",
        url: "\/products\/dark-spots-pore-control-serum-30ml",
        variantId:48573386588317,
        img:"/assets/media/3_fa6a5cd6-22de-4dbf-8e0d-907b39558c9a-337eb9960c.jpg",
        price: "Rs. 1,199.00",
        why: "Your barrier is being stripped faster than it can rebuild.",
        testi: {
          q: "\"I have tried every dark spot product sold in this country. Most stung, none stayed. This one does not promise a transformation and that is exactly why I trusted it. My pores look tighter and my skin reads calmer in photos now.\"",
          who: "Sneha K, Dark spots + Pore control serum"
        },
        stats: [
          {
            n: "- 43%",
            l: "Pore area reduced 43% versus placebo."
          }
        ],
        otherDesc: "For skin that won't stop spotting."
      },"hyd": {
        key: "hyd",
        name: "Deep Hydration • Glow",
        color: "#00a86b",
        url: "\/products\/deep-hydration-glow-serum-30ml",
        variantId:48573378461853,
        img:"/assets/media/1_ef230265-217e-44f3-a6ca-7bc74de77a11-f193d38a39.jpg",
        price: "Rs. 1,049.00",
        why: "Your barrier is being stripped faster than it can rebuild.",
        testi: {
          q: "\"I was skin cycling with four products to get any glow. This replaced all of them. The glow is not greasy, it is the lit-from-within kind. My makeup sits better and my skin just looks more alive.\"",
          who: "Nandini P, Deep hydration + Glow serum"
        },
        stats: [
          {
            n: "+ 254%",
            l: "Hyaluronic acid production up 254%. Glow improved 35.2% at 4 weeks. 17.8% by week 2."
          }
        ],
        otherDesc: "For skin that won't hold moisture."
      }};

  var answers = {};

  function getEl(id) {
    return document.getElementById(sectionId + '-' + id);
  }

  function hexToRgba(hex, a) {
    if (!hex) return 'rgba(255,255,255,' + a + ')';
    hex = hex.replace('#','');
    if (hex.length === 3) {
      hex = hex.split('').map(function(x) { return x + x; }).join('');
    }
    var r = parseInt(hex.substr(0,2),16);
    var g = parseInt(hex.substr(2,2),16);
    var b = parseInt(hex.substr(4,2),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function showStep(n) {
    root.querySelectorAll('.step').forEach(function(step) {
      step.classList.remove('on');
    });

    var el = n === 'result'
      ? getEl('step-result')
      : getEl('step-' + n);

    if (el) {
      el.classList.add('on');
      var qbox = getEl('qbox');
      if (qbox) {
        window.scrollTo({
          top: qbox.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    }
  }

  function totalSteps() {
    return root.querySelectorAll('.q-opts').length;
  }

  function computeScores() {
    var scores = {};
    Object.keys(SERUMS).forEach(function(key) {
      scores[key] = 0;
    });

    Object.keys(answers).forEach(function(step) {
      var key = answers[step];
      if (scores[key] === undefined) scores[key] = 0;
      scores[key]++;
    });

    return scores;
  }

  function showOtherResults(winnerKey) {
    var others = getEl('others');
    var grid = getEl('others-grid');
    if (!others || !grid) return;

    grid.innerHTML = '';

    Object.keys(SERUMS).forEach(function(key) {
      if (key === winnerKey) return;

      var s = SERUMS[key];
      var a = document.createElement('a');
      a.className = 'oc';
      a.href = s.url || '#';

      a.innerHTML =
        '<span class="oc-bar"></span>' +
        '<span class="oc-name"></span>' +
        '<span class="oc-desc"></span>' +
        '<span class="oc-link">View serum</span>';

      a.querySelector('.oc-bar').style.background = s.color || '#181818';
      a.querySelector('.oc-name').textContent = s.name || key;
      a.querySelector('.oc-desc').textContent = s.otherDesc || s.why || '';

      grid.appendChild(a);
    });

    others.style.display = grid.children.length ? 'block' : 'none';
  }

  function renderResult() {
    var keys = Object.keys(SERUMS);
    if (!keys.length) return;

    var scores = computeScores();
    var winner = keys[0];
    var max = -1;

    keys.forEach(function(key) {
      if (scores[key] > max) {
        max = scores[key];
        winner = key;
      }
    });

    var s = SERUMS[winner];
    if (!s) return;

    getEl('r-name').textContent = s.name || '';
    getEl('r-name').style.color = s.color || '#fff';
    getEl('r-why').textContent = s.why || '';

    getEl('r-stat').textContent = s.stats[0].n || '';
    getEl('r-stat').style.color = s.color || '#fff';
    getEl('r-stat-label').textContent = s.stats[0].l || '';

    getEl('r-from').textContent = s.price ?  s.price + ' for 30ml ~40 days ' : '';

    var ghost = getEl('rx-ghost');
    ghost.textContent = s.stats[0].n
      ? String(s.stats[0].n).replace('%','').replace('+','').replace('-','')
      : '';
    ghost.style.webkitTextStroke = '1px ' + hexToRgba(s.color, 0.14);

    var productWrap = getEl('rx-product');
    var pph = getEl('rx-product-ph');
    var oldImg = productWrap.querySelector('img');
    if (oldImg) oldImg.remove();

    if (s.img) {
      var img = document.createElement('img');
      img.src = s.img;
      img.alt = s.name || '';
      productWrap.appendChild(img);
      pph.style.display = 'none';
    } else {
      pph.style.display = 'flex';
    }

    getEl('r-testi-q').textContent = s.testi.q || '';
    getEl('r-testi-who').textContent = s.testi.who || '';
    getEl('r-view-btn').href = s.url || '#';

    var atc = getEl('r-atc-btn');
    atc.disabled = false;
    atc.textContent = "Add to cart";
    atc.style.background = '#fff';
    atc.style.color = '#181818';

    atc.onmouseenter = function() {
      if (!atc.disabled) {
        atc.style.background = s.color || '#B87330';
        atc.style.color = '#fff';
      }
    };

    atc.onmouseleave = function() {
      if (!atc.disabled) {
        atc.style.background = '#fff';
        atc.style.color = '#181818';
      }
    };

    atc.onclick = function() {
      if (!s.variantId) {
        window.location.href = s.url || '#';
        return;
      }

      atc.disabled = true;
      atc.textContent = "Adding...";

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          id: Number(s.variantId),
          quantity: 1
        })
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Cart add failed');
        return response.json();
      })
      .then(function() {window.location.href = '/cart';})
      .catch(function() {
        atc.disabled = false;
        atc.textContent = "Add to cart";
        window.location.href = s.url || '#';
      });
    };

    showOtherResults(winner);
    showStep('result');
  }

  root.querySelectorAll('.q-opts').forEach(function(opts) {
    var step = parseInt(opts.getAttribute('data-step'), 10);

    opts.querySelectorAll('.q-opt').forEach(function(btn) {
      btn.addEventListener('click', function() {
        opts.querySelectorAll('.q-opt').forEach(function(option) {
          option.classList.remove('sel');
        });

        btn.classList.add('sel');
        answers[step] = btn.getAttribute('data-score');

        setTimeout(function() {
          if (step >= totalSteps()) {
            renderResult();
          } else {
            showStep(step + 1);
          }
        }, 240);
      });
    });
  });

  root.querySelectorAll('.q-back').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var prev = parseInt(btn.getAttribute('data-prev'), 10);
      showStep(prev);
    });
  });

  var startBtn = getEl('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      showStep(1);
    });
  }

  var restartBtn = getEl('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      answers = {};
      root.querySelectorAll('.q-opt').forEach(function(option) {
        option.classList.remove('sel');
      });

      var others = getEl('others');
      if (others) others.style.display = 'none';

      showStep(false ? 0 : 1);
    });
  }

  showStep(false ? 0 : 1);
})();
