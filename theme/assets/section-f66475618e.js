

(() => {

  const section =
    document.getElementById(
      'shop-other-serums-template--23927395876979__lates_crossell_q6keEA'
    );

  if (!section) return;


  /* ==================================================
     REVEAL
  ================================================== */

  const revealItems =
    Array.from(
      section.querySelectorAll('.rv')
    );


  const reduceMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  if (
    reduceMotion ||
    !('IntersectionObserver' in window)
  ) {

    revealItems.forEach(
      (element) => {

        element.classList.add('in');

      }
    );

  } else {

    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                entry.isIntersecting
              ) {

                entry.target.classList.add(
                  'in'
                );

                observer.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          rootMargin:
            '0px 0px -8% 0px',

          threshold: 0.12
        }
      );


    revealItems.forEach(
      (element) => {

        observer.observe(element);

      }
    );

  }


  /* ==================================================
     VARIANT SWITCHING
  ================================================== */

  const cards =
    section.querySelectorAll('.xsc');


  cards.forEach(
    (card) => {

      const variantButtons =
        card.querySelectorAll('.xsc-b');


      const variantInput =
        card.querySelector(
          '[data-variant-input]'
        );


      const priceDisplay =
        card.querySelector(
          '[data-price-display]'
        );


      const comparePriceDisplay =
        card.querySelector(
          '[data-compare-price-display]'
        );


      const imageDisplay =
        card.querySelector(
          '.xsc-image'
        );


      if (
        !variantButtons.length
      ) return;


      variantButtons.forEach(
        (button) => {

          button.addEventListener(
            'click',
            () => {

              variantButtons.forEach(
                (item) => {

                  item.classList.remove(
                    'is-active'
                  );

                  item.setAttribute(
                    'aria-pressed',
                    'false'
                  );

                }
              );


              button.classList.add(
                'is-active'
              );


              button.setAttribute(
                'aria-pressed',
                'true'
              );


              const variantId =
                button.dataset.variantId;


              const price =
                button.dataset.price;


              const comparePrice =
                button.dataset.comparePrice;


              if (variantInput) {

                variantInput.value =
                  variantId;

              }


              if (
                priceDisplay &&
                price
              ) {

                priceDisplay.textContent =
                  price;

              }


              /* ========================================
                 UPDATE COMPARE AT PRICE
              ======================================== */

              if (comparePriceDisplay) {

                if (
                  comparePrice &&
                  comparePrice.trim() !== ''
                ) {

                  comparePriceDisplay.textContent =
                    comparePrice;

                  comparePriceDisplay.hidden =
                    false;

                } else {

                  comparePriceDisplay.textContent =
                    '';

                  comparePriceDisplay.hidden =
                    true;

                }

              }


              /* ========================================
                 UPDATE PRODUCT IMAGE
              ======================================== */

              const imageUrl =
                button.dataset.image;


              if (
                imageDisplay &&
                imageUrl &&
                imageUrl.trim() !== '' &&
                imageDisplay.src !== imageUrl
              ) {

                const imageAlt =
                  button.dataset.alt;


                const applyImage =
                  () => {

                    imageDisplay.removeAttribute(
                      'srcset'
                    );

                    imageDisplay.removeAttribute(
                      'sizes'
                    );

                    imageDisplay.src =
                      imageUrl;


                    if (imageAlt) {

                      imageDisplay.alt =
                        imageAlt;

                    }


                    requestAnimationFrame(
                      () => {

                        imageDisplay.classList.remove(
                          'is-swapping'
                        );

                      }
                    );

                  };


                const preloadImage =
                  new Image();

                preloadImage.src =
                  imageUrl;


                imageDisplay.classList.add(
                  'is-swapping'
                );


                if (preloadImage.decode) {

                  preloadImage
                    .decode()
                    .then(applyImage)
                    .catch(applyImage);

                } else {

                  preloadImage.onload =
                    applyImage;

                }

              }

            }
          );

        }
      );


      /* ==============================================
         BUY NOW
      ============================================== */

      const buyNow =
        card.querySelector(
          '[data-buy-now]'
        );


      if (buyNow) {

        buyNow.addEventListener(
          'click',
          async () => {

            const selected =
              card.querySelector(
                '.xsc-b.is-active'
              );


            if (!selected) return;


            const variantId =
              selected.dataset.variantId;


            if (!variantId) return;


            buyNow.disabled = true;


            const originalText =
              buyNow.textContent;


            buyNow.textContent =
              'Loading...';


            try {

              const response =
                await fetch(
                  '/cart/add.js',
                  {
                    method: 'POST',

                    headers: {
                      'Content-Type':
                        'application/json',

                      'Accept':
                        'application/json'
                    },

                    body: JSON.stringify({
                      items: [
                        {
                          id:
                            Number(variantId),

                          quantity: 1
                        }
                      ]
                    })
                  }
                );


              if (!response.ok) {

                throw new Error(
                  'Unable to add product'
                );

              }


              window.location.href =
                '/checkout';

            } catch (error) {

              console.error(
                'Buy now error:',
                error
              );


              buyNow.disabled = false;

              buyNow.textContent =
                originalText;

            }

          }
        );

      }

    }
  );

})();

