
  document.addEventListener('DOMContentLoaded', function () {
    var rail = document.querySelector('.rail-template--23927395876979__mainfootersticky_YFaeN7');
    if (!rail) return;

    var priceEl = rail.querySelector('#railPrice');
    var sizeEl = rail.querySelector('#railSize');
    var variantInput = rail.querySelector('#railVariantId');
    var atcBtn = rail.querySelector('#railAtc');

    function toggleRail() {
      if (window.scrollY > 500) {
        rail.classList.add('show');
      } else {
        rail.classList.remove('show');
      }
    }

    function syncVariant() {
      var mainVariantInput =
        document.querySelector('form[action*="/cart/add"] [name="id"]') ||
        document.querySelector('[name="id"]');

      if (mainVariantInput && variantInput) {
        variantInput.value = mainVariantInput.value;
      }
    }

    window.addEventListener('scroll', toggleRail);
    document.addEventListener('change', syncVariant);
    document.addEventListener('click', function () {
      setTimeout(syncVariant, 100);
    });

    document.addEventListener('click', function (e) {
  const btn = e.target.closest('.buy-size');
  if (!btn) return;

  // Update hidden variant ID
  variantInput.value = btn.dataset.variantId;

  // Update price
  if (priceEl) {
    priceEl.textContent = btn.dataset.variantPrice;
  }

  // Update size
  if (sizeEl) {
    sizeEl.textContent = btn.dataset.variantTitle;
    sizeEl.style.display =
      btn.dataset.variantTitle === 'Default Title' ? 'none' : '';
  }

  // Update availability
  const available = btn.dataset.variantAvailable === 'true';

  atcBtn.disabled = !available;
  atcBtn.textContent = available
    ? "Add to cart"
    : "Sold out";
});

    toggleRail();
    syncVariant();
  });
