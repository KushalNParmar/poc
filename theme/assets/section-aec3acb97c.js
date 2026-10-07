
document.addEventListener('DOMContentLoaded', function () {
  const section = document.querySelector('#shopify-section-template--23927395418227__faq_tabber_ALzaaG');
  if (!section) return;

  section.querySelectorAll('.faq-q').forEach(function (button) {
    button.addEventListener('click', function () {
      const item = button.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      item.classList.toggle('open');
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  });
});
