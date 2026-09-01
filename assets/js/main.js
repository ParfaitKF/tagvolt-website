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

  /* ---------- contact form (front-end demo, no backend) ---------- */
  var form = doc.querySelector("[data-demo-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var honeypot = form.querySelector('[name="company_website"]');
      if (honeypot && honeypot.value) { return; } // bot: drop silently
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = form.querySelector(".form-success") ||
               (form.parentElement && form.parentElement.querySelector(".form-success"));
      form.reset();
      form.querySelectorAll("input,textarea,button").forEach(function (el) { el.disabled = true; });
      if (ok) {
        ok.classList.add("is-visible");
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
