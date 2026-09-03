# TagVolt — website

Static rebuild of the TagVolt site. **Menu and text content mirror the reference
build** (`white-wildcat-660855.hostingersite.com`); the **visual system is carried
over from the current tagvolt.com** (Sora + Inter, orange `#FF6B00` / blue
`#0A84FF` / slate `#0F172A`, pill + 10px CTAs, 16px cards, ~110px section rhythm).

No framework. Just HTML, one CSS file, two small JS files. The only build
step is the **French locale generator** (`tools/build-fr.mjs`, see below).

## Deploy status

**All pages live.** Repo `ParfaitKF/tagvolt-website`, deployed on GitHub Pages
(`main` / root) at <https://parfaitkf.github.io/tagvolt-website/>. Every push to
`main` auto-rebuilds.

`.nojekyll` is committed so Pages serves the files as-is. All asset paths are
relative, so the same build also works from a domain root — e.g. drop the repo
contents (minus `.git`, `node_modules`, `ressources`, `server.mjs`) into
Hostinger `public_html/`.

**Contact form** posts to [Web3Forms](https://web3forms.com) — see
`contact.html`. It shows *"Form isn't connected yet"* until you replace the
`access_key` hidden-input value with a real key (free, no account friction).
Backend-free, so it works on GitHub Pages and Hostinger alike.

## Pages

| File | Menu label | Notes |
|---|---|---|
| `index.html` | Home | Hero, problem, Meet TagVolt, the 5-stage Engine, portfolio teaser (2), 7-question FAQ, Lead Leak Audit band |
| `services.html` | The Engine | 01–05 stages with capability chips, then the 9-service grid |
| `portfolio.html` | Portfolio | 4 case studies (Ferdaousi Lab, ABE Climatisation, ALSFI, Diaspora for African Kids) |
| `pricing.html` | Pricing | Build / Operate offers, exact-scope in/out lists, custom add-ons |
| `blog.html` + `blog/*` | Blog | 3 articles, category filter, per-post static pages |
| `about.html` | About | Why TagVolt exists, how it works, industries, before/after, team |
| `contact.html` | Contact | Lead Leak Audit form (demo — not wired), address / phone / email |
| `privacy.html`, `terms.html` | (footer) | Placeholder legal pages — replace before launch |

Nav order everywhere: **Home · The Engine · Portfolio · Pricing · Blog · About ·
Contact**, plus the EN/FR toggle and the **Free Digital Audit** button.
Footer columns: **The Engine · Agency · Contact**.

## Bilingual (EN / FR)

English lives at the site root; **French is a generated mirror under `fr/`**
(`fr/index.html`, `fr/blog/…`). The EN/FR toggle is a real language switch: it
reads the page's `hreflang` alternates, navigates to the other locale, and
remembers the choice in `localStorage` (a returning visitor is sent to their
language once per session).

**Never edit `fr/` by hand.** Edit the English page, then regenerate:

```bash
node tools/build-fr.mjs .
```

That script (a) adds/refreshes the `hreflang` links on the English pages and
(b) rebuilds every `fr/` page — copying the English markup verbatim and swapping
only the text via the translation map inside the script. Add new/changed strings
to `COMMON` (header/footer) or `PAGES[<file>]` there. `assets/js/posts.fr.js` is
the French blog manifest (mirror of `posts.js`).

## Assets

```
assets/css/style.css   Whole design system
assets/js/main.js       Nav, language switch, FAQ, reveal-on-scroll, contact form, blog rendering
assets/js/posts.js      Blog manifest (EN) — source of truth for the index + filter
assets/js/posts.fr.js   Blog manifest (FR) — loaded by fr/ pages
tools/build-fr.mjs      Generates the fr/ locale from the English pages
server.mjs              Zero-dependency static server for local preview
.claude/launch.json     Preview config
```

## Local preview

```bash
node server.mjs
```

Open <http://localhost:4173>. Any static server works. Opening files with `file://`
also works, but the blog index needs a server (otherwise it shows the
`<noscript>` fallback links).

## Adding a blog post

1. `cp blog/_template.html blog/my-slug.html`, fill the `{{PLACEHOLDERS}}`, write
   the body inside `.article__body`.
2. Add an entry to the **top** of the array in `assets/js/posts.js`:

   ```js
   { slug: "my-slug", title: "…", excerpt: "…",
     category: "Attract",   // Attract | Capture | Respond | Convert | Grow
     tag: "Local SEO", date: "2026-09-01" }
   ```

The index card, filter chip and links update automatically.

## Before this goes live

- [ ] **Contact form** (`contact.html`) is a front-end demo. Wire `[data-demo-form]`
      in `assets/js/main.js` to a real endpoint (Formspree, serverless fn, or CRM).
- [ ] **Confirm the business details** used across every footer and the contact
      page: `226 - 8525 106A Avenue NW, Edmonton, AB T5H 0K1` · `587 357 1839` ·
      `hello@tagvolt.com`.
- [ ] **Two team names** on `about.html` are still `[Name to confirm]`.
- [ ] **Privacy / Terms** pages are placeholders — replace with copy reviewed for
      Alberta PIPA / PIPEDA and your service terms.
- [ ] Swap the recreated **logo** (`assets/img/logo.svg`) for the official vector
      if available; add a PNG/`.ico` favicon fallback.
- [ ] Add a real **Open Graph image** (`assets/img/og.png`, ~1200×630) + `og:image`.
- [ ] **Portfolio** media are gradient placeholders with the client name — add
      real screenshots to `.case__media`.
- [ ] **French copy**: `fr/` is generated and live. Have a native fr-CA reviewer
      pass over the translation map in `tools/build-fr.mjs`, then re-run it.
- [ ] Add `sitemap.xml` (include both locales) and `robots.txt`.
