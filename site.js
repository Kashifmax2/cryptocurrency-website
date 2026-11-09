/* ===========================================================
   Chainwise, ad loader
   -----------------------------------------------------------
   Banners go into their own iframe, so several network scripts
   load in parallel and never share globals. Anything without a
   code stays out of the page entirely.
   =========================================================== */
(function () {
  "use strict";

  var config = Object.assign(
    { lazyLoad: true, anchor: true, sponsorUrl: "" },
    window.ADS_CONFIG || {}
  );
  var codes = window.AD_CODES || {};

  var SIZES = {
    leaderboard: { w: 728, h: 90 },
    rectangle: { w: 300, h: 250 },
    wide: { w: 468, h: 60 },
    anchor: { w: 728, h: 90 }
  };

  var mounted = new WeakSet();
  var observer = null;

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        mount(entry.target);
      });
    }, { rootMargin: "800px 0px" });
  }

  function bandOf(slot) {
    return slot.closest(".ad");
  }

  function showBand(slot) {
    var band = bandOf(slot);
    if (band) band.hidden = false;
  }

  function hideBand(slot) {
    var band = bandOf(slot);
    if (band) band.hidden = true;
  }

  function addFrame(slot, code, size) {
    var frame = document.createElement("iframe");
    frame.className = "ad-frame";
    frame.width = size.w;
    frame.height = size.h;
    frame.loading = "eager";
    frame.setAttribute("frameborder", "0");
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("title", "Advertisement");
    frame.srcdoc =
      "<!doctype html><html><head><meta charset=\"utf-8\">" +
      "<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}" +
      "iframe,img{max-width:100%;border:0;display:block}</style></head><body>" +
      code +
      "</body></html>";
    frame.addEventListener("load", fit);
    slot.appendChild(frame);
    fit();
  }

  function addDirect(slot, code) {
    slot.innerHTML = code;
    var scripts = Array.prototype.slice.call(slot.querySelectorAll("script"));
    scripts.forEach(function (old) {
      var fresh = document.createElement("script");
      Array.prototype.forEach.call(old.attributes, function (attr) {
        fresh.setAttribute(attr.name, attr.value);
      });
      fresh.text = old.textContent || "";
      old.parentNode.removeChild(old);
      slot.appendChild(fresh);
    });
    fit();
  }

  function fit() {
    Array.prototype.forEach.call(document.querySelectorAll(".ad-slot"), function (slot) {
      var frame = slot.querySelector(":scope > iframe.ad-frame");
      if (!frame) return;
      frame.style.transform = "";
      slot.classList.remove("is-scaled");
      slot.style.height = "";
      var available = slot.clientWidth;
      if (!available) return;
      var ratio = available / frame.width;
      if (ratio < 1) {
        frame.style.transformOrigin = "top center";
        frame.style.transform = "scale(" + ratio + ")";
        slot.style.height = Math.round(frame.height * ratio) + "px";
        slot.classList.add("is-scaled");
      }
    });
    syncAnchorSpace();
  }

  function syncAnchorSpace() {
    var anchor = document.getElementById("anchor-ad");
    if (!anchor || anchor.hidden) return;
    document.body.style.paddingBlockEnd = anchor.offsetHeight + "px";
  }

  function mount(slot) {
    if (mounted.has(slot)) return;
    mounted.add(slot);

    var key = slot.getAttribute("data-slot") || "";
    var hidden = slot.classList.contains("ad-slot-hidden");
    var code = (codes[key] || "").trim();

    if (!code) {
      if (!hidden) hideBand(slot);
      return;
    }

    if (!hidden) showBand(slot);

    if (hidden) {
      addDirect(slot, code);
      return;
    }

    var size = SIZES[slot.getAttribute("data-size")];
    if (size) {
      addFrame(slot, code, size);
    } else {
      addDirect(slot, code);
    }
  }

  function mountAll(scope) {
    var slots = (scope || document).querySelectorAll(".ad-slot[data-slot]");
    Array.prototype.forEach.call(slots, mount);
  }

  function guardForms() {
    /* A form with an empty data-endpoint must never submit: a default GET
       would put the message straight into the address bar and history. */
    Array.prototype.forEach.call(document.querySelectorAll("form[data-endpoint]"), function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var endpoint = (form.getAttribute("data-endpoint") || "").trim();
        var status = form.querySelector("[data-form-status]");
        var say = function (text, state) {
          if (!status) return;
          status.textContent = text;
          status.setAttribute("data-state", state);
          status.hidden = false;
        };

        if (!endpoint) {
          say("This form is not connected yet. Please check back shortly.", "error");
          return;
        }

        say("Sending…", "pending");

        fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        }).then(function (response) {
          if (!response.ok) throw new Error("send failed");
          form.reset();
          say("Thanks, the message reached the desk.", "ok");
        }).catch(function () {
          say("That did not send. Please try again in a moment.", "error");
        });
      });
    });
  }

  function boot() {
    /* Hidden slots run first so click-triggered formats are ready. */
    var hidden = document.querySelectorAll(".ad-slot-hidden[data-slot]");
    Array.prototype.forEach.call(hidden, mount);

    var visible = Array.prototype.slice.call(
      document.querySelectorAll(".ad-slot[data-slot]:not(.ad-slot-hidden)")
    );

    visible.forEach(function (slot) {
      var key = slot.getAttribute("data-slot") || "";
      if (!(codes[key] || "").trim()) {
        hideBand(slot);
        return;
      }

      if (!observer) {
        mount(slot);
        return;
      }

      var rect = slot.getBoundingClientRect();
      if (rect.top < window.innerHeight + 800) {
        mount(slot);
      } else {
        observer.observe(slot);
      }
    });

    if (config.anchor) bootAnchor();
    guardForms();

    /* Layout grows as ads arrive; recheck after each batch. */
    [400, 1200, 3000, 6000].forEach(function (ms) {
      setTimeout(function () { fit(); sweep(); }, ms);
    });
  }

  function sweep() {
    Array.prototype.forEach.call(document.querySelectorAll(".ad-slot[data-slot]"), function (slot) {
      if (mounted.has(slot)) return;
      var rect = slot.getBoundingClientRect();
      if (rect.top < window.innerHeight + 800) mount(slot);
    });
  }

  function bootAnchor() {
    var anchor = document.getElementById("anchor-ad");
    var slot = document.getElementById("anchor-slot");
    if (!anchor || !slot) return;

    var key = slot.getAttribute("data-slot") || "";
    if (!(codes[key] || "").trim()) return;

    anchor.hidden = false;
    mount(slot);

    var close = document.getElementById("anchor-close");
    if (close) {
      close.addEventListener("click", function () {
        anchor.hidden = true;
        anchor.setAttribute("data-dismissed", "1");
        document.body.style.paddingBlockEnd = "";
      });
    }

    /* Keep the footer clear of the fixed band. */
    syncAnchorSpace();
  }

  window.addEventListener("scroll", function () {
    if (window.__cwSweep) return;
    window.__cwSweep = setTimeout(function () {
      window.__cwSweep = null;
      sweep();
    }, 200);
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (window.__cwFit) return;
    window.__cwFit = setTimeout(function () {
      window.__cwFit = null;
      fit();
    }, 180);
  }, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.ChainwiseAds = { mount: mountAll, fit: fit };
})();
