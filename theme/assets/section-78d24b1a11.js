
(function () {
  var CACHE_PREFIX = "lngvty_press_cache_";
  var CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  function getCached(url) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + url);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (Date.now() - parsed.t > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function setCached(url, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ t: Date.now(), data: data }));
    } catch (e) { /* ignore */ }
  }

  function hostnameOf(url) {
    try {
      var h = new URL(url).hostname.replace(/^www\./, "");
      if (h.indexOf("linkedin.com") !== -1) return "LinkedIn";
      return h;
    } catch (e) {
      return "Source";
    }
  }

  function formatDate(raw) {
    if (!raw) return "";
    var d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function applyData(card, data, flags) {
    var imgWrap = document.getElementById("press-img-" + card.dataset.blockId);
    var meta = document.getElementById("press-meta-" + card.dataset.blockId);
    var title = document.getElementById("press-title-" + card.dataset.blockId);

    if (!flags.hasImage && data.image) {
      var img = document.createElement("img");
      img.src = data.image;
      img.alt = data.title || "Press coverage";
      img.width = 800;
      img.height = 500;
      img.loading = "lazy";
      imgWrap.innerHTML = "";
      imgWrap.appendChild(img);
    }
    imgWrap.classList.remove("is-loading");

    if (!flags.hasTitle && data.title) {
      title.textContent = data.title;
    }

    if (!flags.hasSource || !flags.hasDate) {
      var sourceText = flags.hasSource ? card.dataset.manualSource : (data.source || hostnameOf(card.dataset.url));
      var dateText = flags.hasDate ? card.dataset.manualDate : (data.date || "");
      meta.textContent = dateText ? (sourceText + " · " + dateText) : sourceText;
    }
  }

  function init() {
    var cards = document.querySelectorAll('[id^="press-card-"]');
    cards.forEach(function (card) {
      var blockId = card.id.replace("press-card-", "");
      card.dataset.blockId = blockId;

      var flags = {
        hasTitle: card.dataset.hasTitle === "true",
        hasSource: card.dataset.hasSource === "true",
        hasDate: card.dataset.hasDate === "true",
        hasImage: card.dataset.hasImage === "true"
      };

      if (flags.hasTitle && flags.hasSource && flags.hasDate && flags.hasImage) {
        return; // fully manual, nothing to fetch
      }

      var url = card.dataset.url;
      if (!url) return;

      var cached = getCached(url);
      if (cached) {
        applyData(card, cached, flags);
        return;
      }

      fetch("https://api.microlink.io/?url=" + encodeURIComponent(url) + "&palette=false")
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (!json || json.status !== "success" || !json.data) {
            throw new Error("no preview data");
          }
          var d = json.data;
          var data = {
            title: d.title || "",
            image: d.image && d.image.url ? d.image.url : "",
            source: d.publisher || hostnameOf(url),
            date: formatDate(d.date)
          };
          setCached(url, data);
          applyData(card, data, flags);
        })
        .catch(function () {
          // Auto-fetch failed (paywall/blocked). Just clear the loading
          // state on the image; manual fields (if any) already rendered
          // server-side, so the card still shows something.
          var imgWrap = document.getElementById("press-img-" + blockId);
          if (imgWrap) imgWrap.classList.remove("is-loading");
          var meta = document.getElementById("press-meta-" + blockId);
          if (meta && meta.textContent.trim() === "Loading…") {
            meta.textContent = hostnameOf(url);
          }
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
