
(() => {
  const section = document.getElementById('ingredient-reveal-template--23983099445363__ingredients');
  if (!section) return;

  /* ---------- SCROLL REVEAL ---------- */
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IO = 'IntersectionObserver' in window;
  const rv = Array.from(section.querySelectorAll('.ir-rv'));

  if (reduce || !IO) {
    rv.forEach((el) => el.classList.add('in'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    rv.forEach((el) => observer.observe(el));
  }

  /* ---------- SLIDER ---------- */
  const slider = section.querySelector('[data-bottle-slider]');
  if (!slider) return;

  const refreshSlider = () => {
    slider.getBoundingClientRect();
    slider.scrollWidth;
  };
  refreshSlider();

  /* ---------- ARROWS ---------- */
  const prevButton = section.querySelector('.ir-arrow--prev');
  const nextButton = section.querySelector('.ir-arrow--next');

  const getGap = () => {
    const styles = window.getComputedStyle(slider);
    return parseFloat(styles.columnGap) || parseFloat(styles.gap) || 0;
  };

  const getScrollAmount = () => {
    const firstItem = slider.querySelector('.ir-act');
    if (!firstItem) return slider.clientWidth * 0.8;
    const itemWidth = firstItem.getBoundingClientRect().width;
    return itemWidth + getGap();
  };

  const updateButtons = () => {
    if (!prevButton || !nextButton) return;
    const maxScroll = Math.max(0, slider.scrollWidth - slider.clientWidth);
    const currentScroll = slider.scrollLeft;
    prevButton.disabled = currentScroll <= 2;
    nextButton.disabled = currentScroll >= maxScroll - 2;
    if (maxScroll <= 2) {
      prevButton.style.visibility = 'hidden';
      nextButton.style.visibility = 'hidden';
    } else {
      prevButton.style.visibility = 'visible';
      nextButton.style.visibility = 'visible';
    }
  };

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
  }

  slider.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons, { passive: true });

  setTimeout(updateButtons, 50);
  setTimeout(updateButtons, 300);
  setTimeout(updateButtons, 800);

  slider.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', refreshSlider, { once: true });
  });

  window.addEventListener('resize', refreshSlider, { passive: true });

  document.addEventListener('shopify:section:load', (event) => {
    if (event.detail && event.detail.sectionId === 'template--23983099445363__ingredients') {
      refreshSlider();
      setTimeout(updateButtons, 100);
    }
  });
})();
