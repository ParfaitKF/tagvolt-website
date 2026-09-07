/* =====================================================================
   TagVolt — site behaviour
   Vanilla JS, no dependencies. Progressive enhancement only:
   every page is fully readable with JS disabled.
   ===================================================================== */
(function () {
  "use strict";
  var doc = document;

  /* ---------- current year in footer ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- header shadow on scroll ---------- */
  var header = doc.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var nav = doc.querySelector(".nav");
  var toggle = doc.querySelector(".nav__toggle");
  var menu = doc.querySelector(".mobile-menu");
  if (toggle && menu && nav) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- active nav link ---------- */
  var path = location.pathname.replace(/\/index\.html$/, "/").split("/").pop() || "index.html";
  if (location.pathname.indexOf("/blog/") !== -1) path = "blog.html";
  doc.querySelectorAll(".nav__links a, .mobile-menu a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").split("/").pop();
    if (href === path || (path === "index.html" && (href === "" || href === "index.html"))) {
      a.classList.add("is-active");
    }
  });

  /* ---------- language toggle (placeholder — EN only for now) ---------- */
  doc.querySelectorAll(".lang-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.closest(".lang-toggle");
      group.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      if (btn.dataset.lang === "fr") {
        window.alert("La version française arrive bientôt. Le site est actuellement disponible en anglais.");
        group.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.lang === "en"));
        });
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  doc.querySelectorAll(".faq__item").forEach(function (item) {
    var q = item.querySelector(".faq__q");
    var a = item.querySelector(".faq__a");
    if (!q || !a) return;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", String(open));
      a.style.height = open ? a.firstElementChild.offsetHeight + "px" : "0px";
    });
  });
  window.addEventListener("resize", function () {
    doc.querySelectorAll(".faq__item.is-open .faq__a").forEach(function (a) {
      a.style.height = a.firstElementChild.offsetHeight + "px";
    });
  });

  /* ---------- reveal on scroll ---------- */
  var reveals = doc.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content hidden (fast scroll, background tab, IO quirks)
    window.setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    }, 2600);
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- scroll-linked progressive reveal + parallax (home, first sections) ---------- */
  var srEls = doc.querySelectorAll("[data-sr]");
  var pxEls = doc.querySelectorAll("[data-parallax]");
  var wantsMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ((srEls.length || pxEls.length) && wantsMotion) {
    doc.documentElement.classList.add("js-sr");

    var srTicking = false;
    var srVh = window.innerHeight;
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

    var srUpdate = function () {
      srTicking = false;
      srVh = window.innerHeight;

      for (var i = 0; i < srEls.length; i++) {
        var el = srEls[i];
        if (el.hasAttribute("data-sr-done")) continue;
        var rect = el.getBoundingClientRect();
        if (rect.height === 0) continue;   // display:none / not laid out yet — retry later
        var idx = parseFloat(el.getAttribute("data-sr")) || 0;
        // the element is itself translated by (1 - sr) * 34px, so neutralise that
        // in the measurement to avoid a feedback loop between rect and transform
        var lastSr = parseFloat(el.style.getPropertyValue("--sr"));
        if (isNaN(lastSr)) lastSr = 0;
        var top = rect.top - (1 - lastSr) * 34;
        var start = srVh * (0.92 - idx * 0.05);   // element top crosses this → begin
        var end = srVh * (0.52 - idx * 0.05);     // element top reaches this → fully in
        var p = clamp01((start - top) / (start - end));
        if (p >= 1 && rect.top < srVh) {
          // fully revealed *and* actually on/above screen — safe to finalise
          el.style.removeProperty("--sr");
          el.style.willChange = "auto";
          el.setAttribute("data-sr-done", "");
        } else {
          el.style.setProperty("--sr", easeOut(p).toFixed(4));
        }
      }

      // hero-anchored parallax: driven straight off scroll position, so the
      // layers sit exactly as designed at the top of the page (0 offset) and
      // drift apart as you scroll through the hero
      var y = window.pageYOffset || doc.documentElement.scrollTop || 0;
      for (var j = 0; j < pxEls.length; j++) {
        var pel = pxEls[j];
        var speed = parseFloat(pel.getAttribute("data-parallax")) || 0;
        var off = y * speed;
        var max = parseFloat(pel.getAttribute("data-parallax-max")) || 46;
        if (off > max) off = max; else if (off < -max) off = -max;
        pel.style.setProperty("--pary", off.toFixed(1) + "px");
      }
    };

    var srOnScroll = function () {
      if (!srTicking) { srTicking = true; window.requestAnimationFrame(srUpdate); }
    };

    srUpdate();
    window.addEventListener("scroll", srOnScroll, { passive: true });
    window.addEventListener("resize", srOnScroll, { passive: true });
    window.addEventListener("load", srOnScroll);
  }

  /* ---------- "Why it matters" — scroll-scrubbed, reversible, staggered reveal ---------- */
  var problemSection = doc.querySelector(".problem");
  if (problemSection) {
    var problemEls = problemSection.querySelectorAll("[data-reveal]");

    // ---- tune the feel of this section here ----
    var PROBLEM_CFG = {
      scrollStartVh: 1.25,  // section top at (viewport height × this) -> progress 0. Bigger = animation starts while section is further below the fold.
      scrollEndVh: -0.15,   // section top at (viewport height × this) -> progress 1. Smaller/more negative = finishes later = slower, longer animation. Raise both numbers closer together to speed it up.
      riseDistance: 100,     // px each element slides up from as it fades in. Bigger = more dramatic rise.
      slideDistance: 32,    // px the two filler blocks (data-slide="rtl"/"ltr") slide in horizontally. Must stay >= 30.
      scaleFrom: 0.984,     // starting scale for each element (1 = no zoom effect at all).
      staggerSpan: 0.5,     // fraction of the whole 0–1 progress range each individual element takes to go from invisible to fully in. Bigger = slower per-element fade, more overlap between elements.
      maxIndex: 2.2         // highest data-reveal="…" value used in the HTML — keep this in sync if you add/remove elements or change their data-reveal numbers.
    };

    if (wantsMotion) {
      var problemClamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

      // kept scroll-linked for the section's whole lifetime (never "finalised"),
      // so scrolling back up smoothly reverses the reveal at any point
      var applyProblemProgress = function (raw) {
        problemEls.forEach(function (el) {
          var idx = parseFloat(el.getAttribute("data-reveal")) || 0;
          var start = (idx / PROBLEM_CFG.maxIndex) * PROBLEM_CFG.staggerSpan;
          var p = problemClamp01((raw - start) / PROBLEM_CFG.staggerSpan);
          var scale = PROBLEM_CFG.scaleFrom + (1 - PROBLEM_CFG.scaleFrom) * p;
          var y = (1 - p) * PROBLEM_CFG.riseDistance;

          // the two filler blocks additionally slide in horizontally:
          // data-slide="rtl" starts to the right and settles moving right-to-left,
          // data-slide="ltr" starts to the left and settles moving left-to-right
          var x = 0;
          var slide = el.getAttribute("data-slide");
          if (slide === "rtl") x = (1 - p) * PROBLEM_CFG.slideDistance;
          else if (slide === "ltr") x = -(1 - p) * PROBLEM_CFG.slideDistance;

          el.style.opacity = p;
          el.style.transform = "translate(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px) scale(" + scale.toFixed(4) + ")";
        });
      };

      var computeProblemProgress = function () {
        var rect = problemSection.getBoundingClientRect();
        var vh = window.innerHeight;
        var startPoint = vh * PROBLEM_CFG.scrollStartVh;
        var endPoint = vh * PROBLEM_CFG.scrollEndVh;
        return problemClamp01((startPoint - rect.top) / (startPoint - endPoint));
      };

      var problemTicking = false;
      var onProblemScroll = function () {
        if (problemTicking) return;
        problemTicking = true;
        window.requestAnimationFrame(function () {
          applyProblemProgress(computeProblemProgress());
          problemTicking = false;
        });
      };

      window.addEventListener("scroll", onProblemScroll, { passive: true });
      window.addEventListener("resize", onProblemScroll);
      onProblemScroll();
    } else {
      problemEls.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
    }
  }

  /* ---------- "How we start" — scroll-scrubbed eyebrow/heading + staggered card reveal ---------- */
  var processSection = doc.querySelector(".process");
  if (processSection) {
    var processEyebrow = processSection.querySelector(".process__eyebrow");
    var processHeading = processSection.querySelector("h2");
    var processCards = processSection.querySelectorAll(".process__card");

    // ---- tune the feel of this section here ----
    var PROCESS_CFG = {
      scrollStartVh: 1.05,   // section top at (viewport height × this) -> progress 0. Bigger = starts earlier / further below the fold.
      scrollEndVh: 0.05,     // section top at (viewport height × this) -> progress 1. Smaller = finishes later = slower, longer animation.
      eyebrowRise: 14,       // px the eyebrow slides up from
      eyebrowStart: 0,       // progress at which the eyebrow starts fading in
      eyebrowSpan: 0.25,     // how much progress it takes the eyebrow to go from invisible to fully in
      headingRise: 14,       // px the heading slides up from
      headingStart: 0.08,
      headingSpan: 0.3,
      cardRise: 90,          // px each card slides up from — the more dramatic "card" motion
      cardStaggerStart: 0.2, // progress at which the first (leftmost) card starts
      cardStaggerStep: 0.1,  // extra progress delay added per subsequent card (controls the left-to-right stagger gap)
      cardSpan: 0.5          // how much progress it takes each card to go from invisible to fully in
    };

    if (wantsMotion) {
      var processClamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

      // kept scroll-linked for the section's whole lifetime (never "finalised"),
      // so scrolling back up smoothly reverses the reveal at any point
      var applyProcessProgress = function (raw) {
        if (processEyebrow) {
          var eyebrowP = processClamp01((raw - PROCESS_CFG.eyebrowStart) / PROCESS_CFG.eyebrowSpan);
          processEyebrow.style.opacity = eyebrowP;
          processEyebrow.style.transform = "translateY(" + ((1 - eyebrowP) * PROCESS_CFG.eyebrowRise).toFixed(2) + "px)";
        }
        if (processHeading) {
          var headingP = processClamp01((raw - PROCESS_CFG.headingStart) / PROCESS_CFG.headingSpan);
          processHeading.style.opacity = headingP;
          processHeading.style.transform = "translateY(" + ((1 - headingP) * PROCESS_CFG.headingRise).toFixed(2) + "px)";
        }
        // each card rises over its own slice of the scroll range, staggered left-to-right,
        // sized so the last card still reaches full progress by raw === 1
        processCards.forEach(function (card, i) {
          var cardStart = PROCESS_CFG.cardStaggerStart + i * PROCESS_CFG.cardStaggerStep;
          var cardP = processClamp01((raw - cardStart) / PROCESS_CFG.cardSpan);
          card.style.opacity = cardP;
          card.style.transform = "translateY(" + ((1 - cardP) * PROCESS_CFG.cardRise).toFixed(2) + "px)";
        });
      };

      var computeProcessProgress = function () {
        var rect = processSection.getBoundingClientRect();
        var vh = window.innerHeight;
        var startPoint = vh * PROCESS_CFG.scrollStartVh;
        var endPoint = vh * PROCESS_CFG.scrollEndVh;
        return processClamp01((startPoint - rect.top) / (startPoint - endPoint));
      };

      var processTicking = false;
      var onProcessScroll = function () {
        if (processTicking) return;
        processTicking = true;
        window.requestAnimationFrame(function () {
          applyProcessProgress(computeProcessProgress());
          processTicking = false;
        });
      };

      window.addEventListener("scroll", onProcessScroll, { passive: true });
      window.addEventListener("resize", onProcessScroll);
      onProcessScroll();
    } else {
      if (processEyebrow) { processEyebrow.style.opacity = 1; processEyebrow.style.transform = "none"; }
      if (processHeading) { processHeading.style.opacity = 1; processHeading.style.transform = "none"; }
      processCards.forEach(function (card) { card.style.opacity = 1; card.style.transform = "none"; });
    }
  }

  /* ---------- contact form (posts to Web3Forms; no backend needed) ---------- */
  var form = doc.querySelector("[data-audit-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // honeypots
      var hp1 = form.querySelector('[name="company_website"]');
      var hp2 = form.querySelector('[name="botcheck"]');
      if ((hp1 && hp1.value) || (hp2 && hp2.checked)) return; // bot: drop silently
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var ok = form.querySelector(".form-success") ||
               (form.parentElement && form.parentElement.querySelector(".form-success"));
      var btn = form.querySelector('button[type="submit"]');
      var controls = form.querySelectorAll("input,textarea,button");
      var key = form.querySelector('[name="access_key"]');

      var finish = function () {
        controls.forEach(function (el) { el.disabled = true; });
        form.reset();
        if (ok) { ok.classList.add("is-visible"); ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
      };

      // no real key yet -> don't pretend it sent
      if (!key || !key.value || key.value.indexOf("YOUR-WEB3FORMS") === 0) {
        if (window.console) console.warn("[TagVolt] contact form: set a Web3Forms access_key in contact.html to enable submissions.");
        controls.forEach(function (el) { el.disabled = true; });
        if (ok) { ok.textContent = "Form isn't connected yet — add your Web3Forms access key."; ok.classList.add("is-visible"); }
        return;
      }

      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success) { finish(); }
          else { throw new Error((data && data.message) || "Submission failed"); }
        })
        .catch(function (err) {
          if (window.console) console.error("[TagVolt] contact form error:", err);
          if (btn) { btn.disabled = false; btn.textContent = label; }
          window.alert("Sorry — something went wrong sending your request. Please email hello@tagvolt.com and we'll get right back to you.");
        });
    });
  }

  /* ================= BLOG ================= */
  var posts = (window.TAGVOLT_POSTS || []).slice().sort(function (a, b) {
    return b.date < a.date ? -1 : 1;
  });

  var postCard = function (p) {
    return (
      '<article class="post-card reveal">' +
        '<a class="post-card__media" href="blog/' + p.slug + '.html" aria-label="' + p.title + '">' +
          '<span class="tagset">' +
            '<span class="chip chip--solid">' + p.category + "</span>" +
            '<span class="chip">' + p.tag + "</span>" +
          "</span>" +
        "</a>" +
        '<div class="post-card__body">' +
          "<h3>" + p.title + "</h3>" +
          "<p>" + p.excerpt + "</p>" +
          '<a class="post-card__more" href="blog/' + p.slug + '.html">Read the article →</a>' +
        "</div>" +
      "</article>"
    );
  };

  /* ----- blog index page ----- */
  var list = doc.querySelector("[data-blog-list]");
  if (list) {
    var filters = doc.querySelector("[data-blog-filters]");
    var cats = ["All"].concat(
      posts.reduce(function (acc, p) {
        if (acc.indexOf(p.category) === -1) acc.push(p.category);
        return acc;
      }, [])
    );

    var render = function (cat) {
      var shown = cat && cat !== "All" ? posts.filter(function (p) { return p.category === cat; }) : posts;
      list.innerHTML = shown.map(postCard).join("");
      list.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    };

    if (filters) {
      filters.innerHTML = cats
        .map(function (c, i) {
          return '<button type="button" class="' + (i === 0 ? "is-active" : "") + '" data-cat="' + c + '">' + c + "</button>";
        })
        .join("");
      filters.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        filters.querySelectorAll("button").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        render(b.dataset.cat);
      });
    }
    render("All");
  }

  /* ----- related posts on an article page ----- */
  var related = doc.querySelector("[data-related]");
  if (related) {
    var current = related.getAttribute("data-related");
    var pool = posts.filter(function (p) { return p.slug !== current; });
    var cat = related.getAttribute("data-related-cat");
    pool.sort(function (a, b) {
      var aw = a.category === cat ? 0 : 1;
      var bw = b.category === cat ? 0 : 1;
      return aw - bw;
    });
    related.innerHTML = pool.slice(0, 2).map(function (p) {
      // article pages live in /blog/, so strip the "blog/" prefix from links
      return postCard(p).replace(/href="blog\//g, 'href="');
    }).join("");
    related.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Engine (interactive tab panel, home page) ---------- */
  var engineTabsEl = doc.getElementById("engine-tablist");
  if (engineTabsEl) {
    var enginePanelEl = doc.getElementById("engine-panel");
    var enginePanelWrap = doc.querySelector(".engine-tabs .panel-wrap");
    var engineProgressFill = doc.getElementById("engine-progress");
    var ENGINE_ROTATE_MS = 10000;
    var engineCurrent = 0;
    var engineTimer = null;

    var engineStages = [
      { title: "Attract", desc: "Get discovered by the right people, before they even know your competitors exist.", pills: ["Website", "Google Business Profile", "Local SEO", "Landing pages", "Content"] },
      { title: "Capture", desc: "Turn attention into an actual opportunity, not just a visit that leaves no trace.", pills: ["Contact forms", "Quote requests", "Click-to-call", "Lead capture", "Tracking"] },
      { title: "Respond", desc: "Make sure no opportunity sits unanswered long enough to go cold.", pills: ["AI", "SMS", "Email", "Automated responses", "Lead qualification"] },
      { title: "Convert", desc: "Move a warm prospect toward a booked, confirmed next step.", pills: ["Follow-ups", "Appointment booking", "Reminders", "CRM", "Lead nurturing"] },
      { title: "Grow", desc: "Turn what you just built into an asset that compounds on its own.", pills: ["Reputation", "Reviews", "Customer reactivation", "Performance monitoring", "Continuous optimization"] }
    ];

    var buildEngineTabs = function () {
      engineTabsEl.innerHTML = engineStages.map(function (s, i) {
        return '<button class="tab" type="button" data-idx="' + i + '"><span class="num">' + (i + 1) + '</span><span class="label">' + s.title + "</span></button>";
      }).join("");
      engineTabsEl.querySelectorAll(".tab").forEach(function (btn) {
        btn.addEventListener("click", function () {
          engineGoTo(parseInt(btn.dataset.idx, 10));
          restartEngineTimer();
        });
      });
    };

    var renderEnginePanel = function (i) {
      var s = engineStages[i];
      enginePanelEl.innerHTML =
        '<div class="panel-left">' +
          '<p class="stage-label">Stage ' + (i + 1) + " of " + engineStages.length + "</p>" +
          "<h3>" + s.title + "</h3>" +
          '<p class="desc">' + s.desc + "</p>" +
        "</div>" +
        '<div class="panel-right">' +
          '<p class="runs-label">WHAT RUNS HERE</p>' +
          '<div class="pills">' +
            s.pills.map(function (p, idx) {
              return '<span class="pill" style="animation-delay:' + (0.15 + idx * 0.05) + 's">' + p + "</span>";
            }).join("") +
          "</div>" +
        "</div>";
    };

    var updateActiveEngineTab = function () {
      engineTabsEl.querySelectorAll(".tab").forEach(function (btn, idx) {
        btn.classList.toggle("active", idx === engineCurrent);
      });
    };

    var restartEngineProgress = function () {
      engineProgressFill.classList.remove("animate");
      void engineProgressFill.offsetWidth; // force reflow to restart the CSS animation
      engineProgressFill.classList.add("animate");
    };

    var triggerEngineBorderSpin = function () {
      enginePanelWrap.classList.remove("spin");
      void enginePanelWrap.offsetWidth; // force reflow to restart the CSS animation
      enginePanelWrap.classList.add("spin");
    };

    var engineGoTo = function (i) {
      engineCurrent = i;
      updateActiveEngineTab();
      renderEnginePanel(engineCurrent);
      restartEngineProgress();
      triggerEngineBorderSpin();
    };

    var startEngineTimer = function () {
      engineTimer = setInterval(function () {
        engineGoTo((engineCurrent + 1) % engineStages.length);
      }, ENGINE_ROTATE_MS);
    };

    var restartEngineTimer = function () {
      clearInterval(engineTimer);
      startEngineTimer();
    };

    buildEngineTabs();
    engineGoTo(0);
    startEngineTimer();

    /* ---- tab bar "unwipes" left-to-right as the section scrolls into view,
       reversible at any point (scrolling back up re-masks it) ---- */
    var engineSection = doc.querySelector(".engine-tabs");
    var engineTabsBar = doc.querySelector(".engine-tabs .tabs");
    if (engineSection && engineTabsBar) {
      if (wantsMotion) {
        var engineClamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

        // ---- tune the feel of this reveal here ----
        var ENGINE_REVEAL_CFG = {
          scrollStartVh: 1.05,  // section top at (viewport height × this) -> progress 0
          scrollEndVh: 0.15     // section top at (viewport height × this) -> progress 1. Smaller = slower, longer wipe.
        };

        var computeEngineRevealProgress = function () {
          var rect = engineSection.getBoundingClientRect();
          var vh = window.innerHeight;
          var startPoint = vh * ENGINE_REVEAL_CFG.scrollStartVh;
          var endPoint = vh * ENGINE_REVEAL_CFG.scrollEndVh;
          return engineClamp01((startPoint - rect.top) / (startPoint - endPoint));
        };

        var applyEngineRevealProgress = function (raw) {
          var rightInset = (1 - raw) * 100;
          engineTabsBar.style.clipPath = "inset(0 " + rightInset.toFixed(2) + "% 0 0 round 12px)";
        };

        var engineRevealTicking = false;
        var onEngineRevealScroll = function () {
          if (engineRevealTicking) return;
          engineRevealTicking = true;
          window.requestAnimationFrame(function () {
            applyEngineRevealProgress(computeEngineRevealProgress());
            engineRevealTicking = false;
          });
        };

        window.addEventListener("scroll", onEngineRevealScroll, { passive: true });
        window.addEventListener("resize", onEngineRevealScroll);
        onEngineRevealScroll();
      } else {
        engineTabsBar.style.clipPath = "none";
      }
    }
  }
})();
