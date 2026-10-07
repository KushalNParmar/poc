
  (() => {
    const section = document.querySelector('#lng-serums-template--23927395221619__lng_serums_NkgdtY');
    if (!section) return;

    // ── scroll reveal: title + cards sit hidden (see .is-visible rules
    // above) until the section first scrolls into view, then reveal once ──
    const initReveal = () => {
      const reduceMotion =
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        section.classList.add('is-visible');
        return;
      }

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              section.classList.add('is-visible');
              obs.unobserve(section);
            }
          });
        },
        {
          threshold: .1,
          rootMargin: '0px 0px -8% 0px',
        }
      );

      observer.observe(section);
    };

    initReveal();

    document.addEventListener('shopify:section:load', (event) => {
      if (event.detail && event.detail.sectionId === 'template--23927395221619__lng_serums_NkgdtY') {
        initReveal();
      }
    });

    const cards = section.querySelectorAll('.lng-serums__card');

    cards.forEach((card) => {
      const variants = card.querySelectorAll('.lng-serums__variant');
      const buy = card.querySelector('[data-add-button]');
      if (!buy) return;

      // scoped to the buy button itself — these attribute names used to be
      // shared with the variant buttons, which meant querySelector on the
      // card picked up the wrong element (a variant button) instead
      const priceElement = buy.querySelector('[data-price]');
      const comparePriceElement = buy.querySelector('[data-compare-price]');
      const label = buy.querySelector('[data-button-label]');
      if (!priceElement || !label) return;

      const buttonText = buy.dataset.buttonText;
      const soldOutText = buy.dataset.soldOutText;
      const addedText = 'Added \u2713';

      // ── variant selection: only swaps price + the id the buy button
      // will add — it never touches navigation ──
      variants.forEach((variant) => {
        variant.addEventListener('click', () => {
          if (variant.disabled) return;

          variants.forEach((item) => {
            item.classList.remove('is-active');
            item.setAttribute('aria-pressed', 'false');
          });
          variant.classList.add('is-active');
          variant.setAttribute('aria-pressed', 'true');

          const variantId = variant.dataset.variantId;
          const price = variant.dataset.variantPrice;
          const comparePrice = variant.dataset.variantComparePrice || '';
          const available = variant.dataset.available === 'true';

          priceElement.textContent = price;
          priceElement.classList.remove('tick');
          void priceElement.offsetWidth;
          priceElement.classList.add('tick');

          if (comparePriceElement) {
            if (comparePrice) {
              comparePriceElement.textContent = comparePrice;
              comparePriceElement.hidden = false;
            } else {
              comparePriceElement.hidden = true;
            }
          }

          buy.dataset.variantId = variantId;
          buy.disabled = !available;
          buy.classList.remove('is-added');
          label.textContent = available ? buttonText : soldOutText;
        });
      });

      // ── add to cart: posts to Shopify's Cart API and hands the response
      // to Dawn's own cart-drawer / cart-notification component so the
      // header bubble (and drawer, if present) update the way Dawn expects ──
      buy.addEventListener('click', async () => {
        if (buy.disabled || buy.classList.contains('is-loading')) return;

        const variantId = buy.dataset.variantId;
        if (!variantId) return;

        buy.classList.add('is-loading');
        const previousLabel = label.textContent;

        // Dawn's cart-drawer / cart-notification custom elements already
        // know which sections they need to re-render themselves — reuse
        // that instead of guessing section ids ourselves.
        const cartComponent =
          document.querySelector('cart-drawer') || document.querySelector('cart-notification');

        const sectionsToRender = cartComponent && typeof cartComponent.getSectionsToRender === 'function'
          ? cartComponent.getSectionsToRender().map((section) => section.id)
          : [];
        if (!sectionsToRender.includes('cart-icon-bubble')) sectionsToRender.push('cart-icon-bubble');

        const body = new FormData();
        body.append('id', variantId);
        body.append('quantity', 1);
        body.append('sections', sectionsToRender.join(','));
        body.append('sections_url', window.location.pathname);

        const addUrl = (window.routes && window.routes.cart_add_url) || '/cart/add.js';

        try {
          const response = await fetch(addUrl, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
            body,
          });

          const result = await response.json();
          if (result.status) throw new Error(result.description || 'Could not add to cart');

          if (cartComponent && typeof cartComponent.renderContents === 'function') {
            // Dawn's own method — updates the icon bubble, live region and
            // (for cart-drawer) opens the drawer with the new contents.
            cartComponent.renderContents(result);
          } else if (result.sections && result.sections['cart-icon-bubble']) {
            // no drawer/notification on this page — patch the header bubble by hand
            const bubbleTarget = document.getElementById('cart-icon-bubble');
            const parsed = new DOMParser().parseFromString(result.sections['cart-icon-bubble'], 'text/html');
            const freshBubble = parsed.querySelector('.shopify-section') || parsed.body.firstElementChild;
            if (bubbleTarget && freshBubble) bubbleTarget.innerHTML = freshBubble.innerHTML;
          }

          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'product-form',
              productVariantId: variantId,
              cartData: result,
            });
          }

          label.textContent = addedText;
          buy.classList.add('is-added');
          window.setTimeout(() => {
            label.textContent = previousLabel;
            buy.classList.remove('is-added');
          }, 1800);
        } catch (error) {
          label.textContent = 'Try again';
          window.setTimeout(() => {
            label.textContent = previousLabel;
          }, 1800);
        } finally {
          buy.classList.remove('is-loading');
        }
      });
    });
  })();
