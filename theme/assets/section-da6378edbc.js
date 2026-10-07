
document.addEventListener('DOMContentLoaded', function () {
  document.documentElement.classList.add('js-reveal');

  var section = document.getElementById('shopify-section-template--23927395680371__graph_line_NHw8Ji');
  if (!section) return;

  var revealEls = section.querySelectorAll('.graph-left, .graph-right');
  var graphPath = section.querySelector('.graph-line-path');
  var graphArea = section.querySelector('.graph-area-path');

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        revealEls.forEach(function(el) {
          el.classList.add('revealed');
        });

        if (graphPath) graphPath.classList.add('drawn');
        if (graphArea) graphArea.classList.add('drawn');

        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  io.observe(section);
});
