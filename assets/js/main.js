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

  /* ---------- language toggle (EN <-> FR) ---------- */
  (function () {
    var current = (doc.documentElement.getAttribute("lang") || "en").slice(0, 2);
    var altEl = {
      en: doc.querySelector('link[rel="alternate"][hreflang="en"]'),
      fr: doc.querySelector('link[rel="alternate"][hreflang="fr"]')
    };
    var dest = {
      en: altEl.en && altEl.en.getAttribute("href"),
      fr: altEl.fr && altEl.fr.getAttribute("href")
    };

    // Remembered preference: send a returning visitor to their language once per session.
    try {
      var saved = window.localStorage.getItem("tv-lang");
      if (saved && (saved === "en" || saved === "fr") && saved !== current &&
          dest[saved] && !window.sessionStorage.getItem("tv-lang-redirected")) {
        window.sessionStorage.setItem("tv-lang-redirected", "1");
        window.location.replace(dest[saved]);
        return;
      }
    } catch (e) {}

    doc.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      var lang = btn.dataset.lang;
      btn.setAttribute("aria-pressed", String(lang === current));
      btn.addEventListener("click", function () {
        try { window.localStorage.setItem("tv-lang", lang); } catch (e) {}
        if (lang === current) return;
        try { window.sessionStorage.setItem("tv-lang-redirected", "1"); } catch (e) {}
        if (dest[lang]) window.location.href = dest[lang];
      });
    });
  })();

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
})();
