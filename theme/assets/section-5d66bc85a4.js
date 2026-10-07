
    (function () {
      var PO = { "48573378461853":1,"48573378494621":1,"48794738983069":1, "_": 0 };
      var SHIP = "15 October";
      var NOTE = 'Pre-order. Ships from ' + SHIP + '.';
      var PROP_NAME = 'properties[Pre-order]';
      var PROP_VALUE = 'Ships from ' + SHIP;
      var PO_LABEL = 'Pre-order now';
      var PREVIEW = /[?&]preorder_preview=1/.test(window.location.search);

      function isPO(id) {
        if (!id || !(String(id) in PO)) return false;
        return PO[String(id)] === 1 || PREVIEW;
      }

      /* Sets a button's visible label. keepBuyNow adds a hidden "Buy now" so GoKwik still claims it. */
      function setLabel(btn, label, keepBuyNow, sub) {
        if (!btn) return;
        if (btn.dataset.lngvtyPoLabel === label && btn.querySelector('.lngvty-po-label')) return;
        btn.textContent = '';
        var s = document.createElement('span');
        s.className = 'lngvty-po-label';
        s.textContent = label;
        btn.appendChild(s);
        if (sub) {
          var u = document.createElement('span');
          u.className = 'lngvty-po-sub';
          u.textContent = sub;
          btn.appendChild(u);
        }
        if (keepBuyNow) {
          var k = document.createElement('span');
          k.className = 'lngvty-po-kw';
          k.setAttribute('aria-hidden', 'true');
          k.textContent = 'Buy now';
          btn.appendChild(k);
        }
        btn.dataset.lngvtyPoLabel = label;
        if (keepBuyNow) return reclaimForGoKwik(btn);
        return btn;
      }

      /* GoKwik only takes over buttons that read "Buy now" when it first sees them.
         A pre-order button that loaded as "Sold out" was never taken over, so we hand
         GoKwik a fresh copy of it once it carries the hidden "Buy now". Done once per button. */
      function reclaimForGoKwik(btn) {
        if (typeof window.gkBtnConfig !== 'object' || !btn.parentNode) return btn;
        if (btn.dataset.gokwikFunction === 'buyNow' || btn.dataset.lngvtyReclaimed) return btn;
        var c = btn.cloneNode(true);
        c.dataset.lngvtyReclaimed = '1';
        delete c.dataset.gokwikProcessed;
        delete c.dataset.gokwikFunction;
        delete c.dataset.function;
        delete c.dataset.gkDecorated;
        c.classList.remove('gokwik-marge');
        btn.parentNode.replaceChild(c, btn);
        return c;
      }

      function clearLabel(btn, original) {
        if (!btn || !btn.dataset.lngvtyPoLabel) return;
        delete btn.dataset.lngvtyPoLabel;
        btn.textContent = original;
      }

      function setInput(form, name, value, marker, on) {
        if (!form) return;
        var input = form.querySelector('input[' + marker + ']');
        if (on && !input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          input.setAttribute(marker, '');
          form.appendChild(input);
        } else if (!on && input) {
          input.remove();
        }
      }
      function setProp(form, on) { setInput(form, PROP_NAME, PROP_VALUE, 'data-lngvty-po', on); }
      function setCheckout(form, on) { setInput(form, 'checkout', '1', 'data-lngvty-po-checkout', on); }

      function makeNote(ref, where) {
        if (!ref) return null;
        var note = ref.parentNode.querySelector(':scope > .lngvty-po-note');
        if (!note) {
          note = document.createElement('p');
          note.className = 'lngvty-po-note';
          note.hidden = true;
          note.textContent = NOTE;
          ref.insertAdjacentElement(where || 'afterend', note);
        }
        return note;
      }

      function each(sel, fn) {
        Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(fn);
      }

      /* ================= PDP hero + sticky bar ================= */
      function initHero() {
        var root = document.querySelector('.lngvty-hero');
        if (!root) return;
        var btns = Array.prototype.slice.call(root.querySelectorAll('.lngvty-hero__variant'));
        if (!btns.length) return;
        var form = root.querySelector('form.lngvty-hero__form') || root.querySelector('form[action*="/cart/add"]');
        var note = makeNote(root.querySelector('.lngvty-hero__price'));
        var railAtc = document.getElementById('railAtc');
        var railForm = railAtc ? railAtc.closest('form') : null;
        var railLabel = (railAtc && !railAtc.disabled) ? railAtc.textContent.trim() : 'Add to cart';

        btns.forEach(function (b) {
          if (!isPO(b.dataset.variantId)) return;
          b.dataset.available = 'true';
          b.dataset.buyNowAvailable = 'true';
        });

        var heroPO = false;

        function fixBuy() {
          var bn = root.querySelector('[data-purchase-action]');
          if (!bn || !heroPO) return;
          if (bn.disabled) bn.disabled = false;
          if (bn.getAttribute('data-out-of-stock') !== 'false') bn.setAttribute('data-out-of-stock', 'false');
          bn = setLabel(bn, PO_LABEL, true) || bn;
          if (bn.disabled) bn.disabled = false;
          if (bn.getAttribute('data-out-of-stock') !== 'false') bn.setAttribute('data-out-of-stock', 'false');
        }

        function apply(b) {
          if (!b) return;
          var po = isPO(b.dataset.variantId);
          heroPO = po;
          root.classList.toggle('lngvty-po-on', po);
          if (note) note.hidden = !po;
          setProp(form, po);
          var bn = root.querySelector('[data-purchase-action]');
          if (po) fixBuy();
          else if (bn) clearLabel(bn, bn.dataset.buyNowLabel || 'Buy now');
          setTimeout(function () {
            if (railAtc) {
              railAtc.textContent = po ? PO_LABEL : railLabel;
              if (po) railAtc.disabled = false;
            }
            setProp(railForm, po);
            setCheckout(railForm, po);
          }, 300);
        }

        if (window.MutationObserver) {
          var actions = root.querySelector('.lngvty-hero__actions') || root;
          new MutationObserver(function () { fixBuy(); }).observe(actions, { childList: true, subtree: true, characterData: true });
        }

        btns.forEach(function (b) {
          b.addEventListener('click', function () { apply(b); });
        });

        apply(root.querySelector('.lngvty-hero__variant[aria-pressed="true"]'));
      }

      /* ================= PDP "Shop other serums" cards ================= */
      function initCrossSell() {
        each('.shop-other-serums .xsc', function (card) {
          if (!card.querySelector('.xsc-b')) return;
          var form = card.querySelector('.xsc-cart-form');
          var note = makeNote(card.querySelector('.xsc-price-wrap'));
          var buyLabel = (card.querySelector('[data-buy-now]') || {}).textContent;
          buyLabel = (buyLabel || 'Buy now').trim();

          function active() { return card.querySelector('.xsc-b.is-active'); }

          function apply() {
            var b = active();
            var po = !!b && isPO(b.dataset.variantId);
            var buy = card.querySelector('[data-buy-now]');
            if (note) note.hidden = !po;
            setProp(form, po);
            card.classList.toggle('lngvty-po-on', po);
            if (po) setLabel(buy, PO_LABEL, true);
            else clearLabel(buy, buyLabel);
          }

          card.addEventListener('click', function (e) {
            if (e.target.closest('.xsc-b')) setTimeout(apply, 0);
          });

          /* Pre-order Buy now: add with the pre-order note, then open checkout */
          card.addEventListener('click', function (e) {
            var buy = e.target.closest('[data-buy-now]');
            if (!buy) return;
            var b = active();
            if (!b || !isPO(b.dataset.variantId)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            buy.disabled = true;
            var props = {};
            props['Pre-order'] = PROP_VALUE;
            fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ items: [{ id: Number(b.dataset.variantId), quantity: 1, properties: props }] })
            }).then(function (r) {
              if (!r.ok) throw new Error('add failed');
              if (window.gokwikSdk && window.merchantInfo && typeof window.gokwikSdk.initCheckout === 'function') {
                buy.disabled = false;
                window.gokwikSdk.initCheckout(window.merchantInfo);
              } else {
                window.location.href = '/checkout';
              }
            }).catch(function () {
              buy.disabled = false;
            });
          }, true);

          apply();
        });
      }

      /* ================= Collection serum cards ================= */
      function initCollection() {
        each('.lp-serums-sx7mq .card', function (card) {
          var boxes = Array.prototype.slice.call(card.querySelectorAll('.size-box'));
          if (!boxes.length) return;
          var form = card.querySelector('form.lp-buynow-form');

          boxes.forEach(function (bx) {
            if (isPO(bx.dataset.variantId)) bx.setAttribute('data-available', '1');
          });

          function apply() {
            var id = card.getAttribute('data-selected-variant');
            var po = isPO(id);
            var buy = card.querySelector('.btn-buy');
            setProp(form, po);
            card.classList.toggle('lngvty-po-on', po);
            if (po && buy) {
              buy.disabled = false;
              setLabel(buy, PO_LABEL, true, 'Ships from ' + SHIP);
            } else if (buy) {
              clearLabel(buy, buy.disabled ? 'Sold out' : 'Buy now');
            }
          }

          card.addEventListener('click', function (e) {
            if (e.target.closest('.size-box')) setTimeout(apply, 0);
          });

          var activeBox = card.querySelector('.size-box.is-active');
          if (activeBox && isPO(activeBox.dataset.variantId)) activeBox.click();
          apply();
        });
      }

      /* ================= Homepage serum cards ================= */
      function initHome() {
        each('.lng-serums__card', function (card) {
          var variants = Array.prototype.slice.call(card.querySelectorAll('.lng-serums__variant'));
          var buy = card.querySelector('[data-add-button]');
          if (!buy) return;
          var label = buy.querySelector('[data-button-label]');
          var note = makeNote(buy);
          var buttonText = buy.dataset.buttonText || 'Add to bag';

          variants.forEach(function (v) {
            if (!isPO(v.dataset.variantId)) return;
            v.dataset.available = 'true';
            v.disabled = false;
          });

          function apply() {
            var po = isPO(buy.dataset.variantId);
            if (note) note.hidden = !po;
            card.classList.toggle('lngvty-po-on', po);
            if (po) {
              buy.disabled = false;
              if (label) label.textContent = PO_LABEL + ' →';
            } else if (label && label.textContent.indexOf(PO_LABEL) === 0) {
              label.textContent = buy.disabled ? (buy.dataset.soldOutText || 'Sold out') : buttonText;
            }
          }

          card.addEventListener('click', function (e) {
            if (e.target.closest('.lng-serums__variant')) setTimeout(apply, 0);
          });

          /* Pre-order add to bag: same as the section's own add, plus the pre-order note */
          card.addEventListener('click', function (e) {
            if (!e.target.closest('[data-add-button]')) return;
            if (!isPO(buy.dataset.variantId)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (buy.classList.contains('is-loading')) return;
            buy.classList.add('is-loading');
            var cart = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
            var sections = cart && typeof cart.getSectionsToRender === 'function'
              ? cart.getSectionsToRender().map(function (s) { return s.id; }) : [];
            if (sections.indexOf('cart-icon-bubble') === -1) sections.push('cart-icon-bubble');
            var body = new FormData();
            body.append('id', buy.dataset.variantId);
            body.append('quantity', 1);
            body.append(PROP_NAME, PROP_VALUE);
            body.append('sections', sections.join(','));
            body.append('sections_url', window.location.pathname);
            fetch((window.routes && window.routes.cart_add_url) || '/cart/add.js', {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
              body: body
            }).then(function (r) { return r.json(); }).then(function (result) {
              if (result.status) throw new Error(result.description || 'add failed');
              if (cart && typeof cart.renderContents === 'function') {
                cart.renderContents(result);
              } else if (result.sections && result.sections['cart-icon-bubble']) {
                var target = document.getElementById('cart-icon-bubble');
                var parsed = new DOMParser().parseFromString(result.sections['cart-icon-bubble'], 'text/html');
                var fresh = parsed.querySelector('.shopify-section') || parsed.body.firstElementChild;
                if (target && fresh) target.innerHTML = fresh.innerHTML;
              }
              if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
                publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form', productVariantId: buy.dataset.variantId, cartData: result });
              }
            }).catch(function (err) {
              console.error('[LNGVTY pre-order]', err);
            }).then(function () {
              buy.classList.remove('is-loading');
            });
          }, true);

          var activeVariant = card.querySelector('.lng-serums__variant.is-active');
          if (activeVariant && isPO(activeVariant.dataset.variantId)) activeVariant.click();
          apply();
        });
      }

      function initAll() {
        initHero();
        initCrossSell();
        initCollection();
        initHome();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(initAll, 50); });
      } else {
        setTimeout(initAll, 50);
      }
    })();
  