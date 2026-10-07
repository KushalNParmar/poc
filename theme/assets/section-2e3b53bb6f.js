
  (() => {
    const root = document.getElementById('lngvty-fork-template23927395582067__technology_fig_HNnAEE');
    if (!root || root.dataset.forkReady === 'true') return;
    root.dataset.forkReady = 'true';
    const replay = root.querySelector('[data-fork-replay]');
    const play = () => {
      root.classList.remove('is-animating');
      void root.offsetWidth;
      root.classList.add('is-animating');
    };
    replay?.addEventListener('click', play);
    if (!('IntersectionObserver' in window)) { play(); return; }
    const observer = new IntersectionObserver((entries, instance) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        play();
        instance.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(root);
  })();
