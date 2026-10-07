
(function() {

  'use strict';

  var root = document.getElementById('lngvty-hero-template--23927395876979__new_pdp_9jwWKL');

  if (!root) return;

  var infinite = root.dataset.infinite === 'true';
  var showPagination = root.dataset.showPagination === 'true';

  var track = root.querySelector('.lngvty-hero__track');
  var prev = root.querySelector('[data-slider-prev]');
  var next = root.querySelector('[data-slider-next]');
  var slider = root.querySelector('.lngvty-hero__slider');

  var paginationCurrent = root.querySelector('[data-pagination-current]');
  var paginationTotal = root.querySelector('[data-pagination-total]');

  var allRealSlides = track
    ? Array.prototype.slice.call(
        track.querySelectorAll('.lngvty-hero__frame')
      )
    : [];

  var slides = allRealSlides.slice();

  var currentSlide = 0;
  var totalSlides = slides.length;
  var isAnimating = false;
  var animationTimer = null;

  function cleanImageUrl(url) {

    if (!url) return '';

    return String(url).split('?')[0];

  }

  function getSlideImageUrl(slide) {

    if (!slide) return '';

    var image = slide.querySelector('img');

    if (!image) return '';

    return cleanImageUrl(
      image.currentSrc ||
      image.src ||
      image.getAttribute('data-src') ||
      ''
    );

  }

  function imagesMatch(firstUrl, secondUrl) {

    var first = cleanImageUrl(firstUrl);
    var second = cleanImageUrl(secondUrl);

    if (!first || !second) return false;

    return (
      first.indexOf(second) !== -1 ||
      second.indexOf(first) !== -1
    );

  }

  function updateArrows() {

    if (!prev || !next) return;

    if (infinite && totalSlides > 1) {
      prev.classList.remove('is-hidden');
      next.classList.remove('is-hidden');
      return;
    }

    prev.classList.toggle(
      'is-hidden',
      currentSlide <= 0
    );

    next.classList.toggle(
      'is-hidden',
      currentSlide >= totalSlides - 1
    );

  }

  function getRealSlideIndex() {

    if (!infinite || totalSlides <= 1) {
      return currentSlide;
    }

    var realIndex = currentSlide - 1;

    if (realIndex < 0) {
      realIndex = totalSlides - 1;
    }

    if (realIndex >= totalSlides) {
      realIndex = 0;
    }

    return realIndex;

  }

  function updatePagination() {

    if (!showPagination || !paginationCurrent) return;

    paginationCurrent.textContent =
      totalSlides ? getRealSlideIndex() + 1 : 0;

    if (paginationTotal) {
      paginationTotal.textContent = totalSlides;
    }

  }

  function finishAnimation() {

    isAnimating = false;

    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }

  }

  function rebuildInfiniteClones() {

    if (!track) return;

    Array.prototype.slice.call(
      track.querySelectorAll('[data-clone]')
    ).forEach(function(clone) {
      clone.remove();
    });

    if (!infinite || totalSlides <= 1) {
      return;
    }

    var firstClone = slides[0].cloneNode(true);
    var lastClone = slides[totalSlides - 1].cloneNode(true);

    firstClone.setAttribute('data-clone', 'first');
    lastClone.setAttribute('data-clone', 'last');

    track.insertBefore(lastClone, slides[0]);
    track.appendChild(firstClone);

  }

  function applyVariantGalleryFilter(activeVariantImage, animate) {

    if (!track) return;

    finishAnimation();

    Array.prototype.slice.call(
      track.querySelectorAll('[data-clone]')
    ).forEach(function(clone) {
      clone.remove();
    });

    allRealSlides.forEach(function(slide) {
      slide.remove();
    });

    var variantImages = [];

    variants.forEach(function(variantButton) {

      var image = variantButton.dataset.image || '';

      if (image) {
        variantImages.push(cleanImageUrl(image));
      }

    });

    var visibleSlides = [];

    allRealSlides.forEach(function(slide) {

      var slideImage = getSlideImageUrl(slide);
      var belongsToVariant = false;

      for (var i = 0; i < variantImages.length; i++) {

        if (imagesMatch(slideImage, variantImages[i])) {
          belongsToVariant = true;
          break;
        }

      }

      var shouldShow = !belongsToVariant;

      if (activeVariantImage && imagesMatch(slideImage, activeVariantImage)) {
        shouldShow = true;
      }

      if (shouldShow) {
        visibleSlides.push(slide);
      }

    });

    if (!visibleSlides.length) {
      visibleSlides = allRealSlides.slice();
    }

    /* The selected variant's own image always becomes slide 1,
       wherever it sits in the product's media order. */
    if (activeVariantImage) {

      for (var k = 0; k < visibleSlides.length; k++) {

        if (imagesMatch(
          getSlideImageUrl(visibleSlides[k]),
          activeVariantImage
        )) {
          visibleSlides.unshift(visibleSlides.splice(k, 1)[0]);
          break;
        }

      }

    }

    slides = visibleSlides;
    totalSlides = slides.length;

    slides.forEach(function(slide) {
      track.appendChild(slide);
    });

    rebuildInfiniteClones();

    var activeIndex = 0;

    if (activeVariantImage) {

      for (var j = 0; j < slides.length; j++) {

        if (imagesMatch(
          getSlideImageUrl(slides[j]),
          activeVariantImage
        )) {
          activeIndex = j;
          break;
        }

      }

    }

    currentSlide =
      infinite && totalSlides > 1
        ? activeIndex + 1
        : activeIndex;

    updateSlider(
      currentSlide,
      animate === true
    );

  }

  function handleInfiniteBoundary() {

    if (!infinite || totalSlides <= 1 || !track) {
      finishAnimation();
      return;
    }

    if (currentSlide === totalSlides + 1) {

      track.style.transition = 'none';

      currentSlide = 1;

      track.style.transform =
        'translate3d(-' + currentSlide * 100 + '%, 0, 0)';

      updatePagination();

      track.offsetHeight;

      track.style.transition =
        'transform .45s cubic-bezier(.22,.61,.36,1)';

    } else if (currentSlide === 0) {

      track.style.transition = 'none';

      currentSlide = totalSlides;

      track.style.transform =
        'translate3d(-' + currentSlide * 100 + '%, 0, 0)';

      updatePagination();

      track.offsetHeight;

      track.style.transition =
        'transform .45s cubic-bezier(.22,.61,.36,1)';

    }

    finishAnimation();

  }

  function updateSlider(index, animate) {

    if (!track || !totalSlides) return;

    if (totalSlides === 1) {

      currentSlide = 0;
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0, 0, 0)';
      updatePagination();
      updateArrows();
      finishAnimation();
      return;

    }

    if (animate === undefined) {
      animate = true;
    }

    if (!infinite) {

      if (index < 0) {
        index = 0;
      }

      if (index >= totalSlides) {
        index = totalSlides - 1;
      }

    }

    currentSlide = index;

    track.style.transition = animate
      ? 'transform .45s cubic-bezier(.22,.61,.36,1)'
      : 'none';

    track.style.transform =
      'translate3d(-' + currentSlide * 100 + '%, 0, 0)';

    updatePagination();
    updateArrows();

    if (animate) {

      isAnimating = true;

      if (animationTimer) {
        clearTimeout(animationTimer);
      }

      animationTimer = setTimeout(function() {
        handleInfiniteBoundary();
      }, 500);

    } else {
      finishAnimation();
    }

  }

  var variants = Array.prototype.slice.call(
    root.querySelectorAll('.lngvty-hero__variant')
  );

  var input = root.querySelector('input[data-variant-id]');
  var price = root.querySelector('[data-current-price]');
  var comparePrice = root.querySelector('[data-current-compare-price]');
  var title = root.querySelector('[data-current-title]');
  var label = root.querySelector('[data-current-title-label]');

  /* ==========================================================
     OUT-OF-STOCK CLICK GUARD

     Some 3rd-party checkout apps (e.g. GoKwik) re-decorate the
     Buy Now button after page load, stripping the native
     "disabled" attribute and attaching their own click
     handler. To make sure an out-of-stock variant can never be
     bought, we attach our own capture-phase click listener
     directly on the button that blocks the event before any
     later-attached handler can run, and we keep re-attaching
     it if the app clones/replaces the button node.
  ========================================================== */

  function guardBuyNowClick(event) {

    if (this.getAttribute('data-out-of-stock') === 'true') {

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      return false;

    }

  }

  function attachBuyNowGuards() {

    var buyNowButtons = Array.prototype.slice.call(
      root.querySelectorAll('[data-purchase-action]')
    );

    buyNowButtons.forEach(
      function(btn) {

        if (btn.dataset.guardAttached === 'true') {
          return;
        }

        btn.addEventListener('click', guardBuyNowClick, true);

        btn.dataset.guardAttached = 'true';

      }
    );

  }

  attachBuyNowGuards();

  if (window.MutationObserver) {

    var buyNowObserver = new MutationObserver(
      function() {
        attachBuyNowGuards();
      }
    );

    buyNowObserver.observe(
      root,
      {
        childList: true,
        subtree: true
      }
    );

  }

  variants.forEach(
    function(button) {

      button.addEventListener(
        'click',
        function() {

          var variantId = button.dataset.variantId;
          var variantTitle = button.dataset.title || '';
          var variantPrice = button.dataset.price || '';
          var variantComparePrice = button.dataset.comparePrice || '';
          var available = button.dataset.available === 'true';
          var buyNowAvailable = button.dataset.buyNowAvailable === 'true';

          variants.forEach(
            function(item) {
              item.setAttribute('aria-pressed', 'false');
            }
          );

          button.setAttribute('aria-pressed', 'true');

          if (input) {
            input.value = variantId;
          }

          if (price) {
            price.textContent = variantPrice;
          }

          if (comparePrice) {

            if (variantComparePrice) {

              comparePrice.textContent = variantComparePrice;
              comparePrice.style.display = '';

            } else {

              comparePrice.textContent = '';
              comparePrice.style.display = 'none';

            }

          }

          if (title) {
            title.textContent = variantTitle;
          }

          if (label) {
            label.textContent = variantTitle;
          }

          var currentPurchaseActions = Array.prototype.slice.call(
            root.querySelectorAll(
              '[data-purchase-action], [data-add-to-cart]'
            )
          );

          currentPurchaseActions.forEach(
            function(action) {

              if (action.hasAttribute('data-purchase-action')) {

                var buyNowLabel = action.dataset.buyNowLabel || '';

                action.disabled = !buyNowAvailable;
                action.textContent = buyNowAvailable ? buyNowLabel : 'Out of Stock';
                action.setAttribute(
                  'data-out-of-stock',
                  buyNowAvailable ? 'false' : 'true'
                );

              } else {

                action.disabled = !available;

              }

            }
          );

          var variantImage = button.dataset.image || '';

          applyVariantGalleryFilter(
            variantImage,
            false
          );

        }
      );

    }
  );

  if (slider) {

    slider.addEventListener(
      'keydown',
      function(event) {

        if (isAnimating) {
          return;
        }

        if (event.key === 'ArrowLeft') {

          event.preventDefault();

          updateSlider(
            currentSlide - 1,
            true
          );

        }

        if (event.key === 'ArrowRight') {

          event.preventDefault();

          updateSlider(
            currentSlide + 1,
            true
          );

        }

      }
    );

  }

  if (prev) {

    prev.addEventListener(
      'click',
      function(event) {

        event.preventDefault();

        if (isAnimating) return;

        updateSlider(
          currentSlide - 1,
          true
        );

      }
    );

  }

  if (next) {

    next.addEventListener(
      'click',
      function(event) {

        event.preventDefault();

        if (isAnimating) return;

        updateSlider(
          currentSlide + 1,
          true
        );

      }
    );

  }

  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;

  if (slider) {

    slider.addEventListener(
      'touchstart',
      function(event) {

        if (!event.touches || !event.touches.length) {
          return;
        }

        if (isAnimating) {
          return;
        }

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartTime = Date.now();

      },
      {
        passive: true
      }
    );

    slider.addEventListener(
      'touchend',
      function(event) {

        if (!event.changedTouches || !event.changedTouches.length) {
          return;
        }

        if (isAnimating) {
          return;
        }

        var touchEndX = event.changedTouches[0].clientX;
        var touchEndY = event.changedTouches[0].clientY;

        var deltaX = touchStartX - touchEndX;
        var deltaY = touchStartY - touchEndY;

        var duration = Date.now() - touchStartTime;

        if (duration > 800) {
          return;
        }

        if (Math.abs(deltaX) < Math.abs(deltaY)) {
          return;
        }

        if (Math.abs(deltaX) < 40) {
          return;
        }

        if (deltaX > 0) {

          updateSlider(
            currentSlide + 1,
            true
          );

        } else {

          updateSlider(
            currentSlide - 1,
            true
          );

        }

      },
      {
        passive: true
      }
    );

  }

  if (track) {

    track.addEventListener(
      'transitionend',
      function(event) {

        if (event.propertyName !== 'transform') {
          return;
        }

        if (infinite && totalSlides > 1) {
          handleInfiniteBoundary();
        } else {
          finishAnimation();
        }

      }
    );

  }

  var initialVariant = root.querySelector(
    '.lngvty-hero__variant[aria-pressed="true"]'
  );

  var initialVariantImage = initialVariant
    ? initialVariant.dataset.image || ''
    : '';

  if (variants.length) {

    applyVariantGalleryFilter(
      initialVariantImage,
      false
    );

  } else {

    rebuildInfiniteClones();

    currentSlide = infinite && totalSlides > 1 ? 1 : 0;

    updateSlider(
      currentSlide,
      false
    );

  }

})();
