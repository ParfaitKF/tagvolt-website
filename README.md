# TagVolt — website

Static rebuild of the TagVolt site. **Menu and text content mirror the reference
build** (`white-wildcat-660855.hostingersite.com`); the **visual system is carried
over from the current tagvolt.com** (Sora + Inter, orange `#FF6B00` / blue
`#0A84FF` / slate `#0F172A`, pill + 10px CTAs, 16px cards, ~110px section rhythm).

No framework. Just HTML, one CSS file, two small JS files. The only build
step is the **French locale generator** (`tools/build-fr.mjs`, see below).

## Deploy

The **marketing site** (this repo) deploys to Hostinger `public_html/` via
Hostinger's Git integration — every push to `main` on `ParfaitKF/tagvolt-website`
updates it. GitHub Pages (<https://parfaitkf.github.io/tagvolt-website/>) is kept
as a staging mirror; note its `/blog/` link 404s there (no WordPress).

The **blog** is a separate WordPress install in `public_html/blog/`, with its own
database — see `wordpress/SETUP-WORDPRESS.md`. It is deliberately **not** in this
repo (`/blog/` is git-ignored) so deploys never touch it. The two connect
automatically: the WP theme points its nav at `../` (the marketing site) and the
marketing site's "Blog" link points at `/blog/`.

`.htaccess` 301s the old `/blog/*.html` URLs to the new `/blog/<slug>/` ones.
`.nojekyll` is only for the GitHub Pages mirror.

**Contact form** posts to [Web3Forms](https://web3forms.com) — see
`contact.html` / `fr/contact.html`. It shows *"Form isn't connected yet"* until
you replace the `access_key` hidden-input value with a real key (free). Works on
static hosting with no backend.

## Pages

| File | Menu label | Notes |
|---|---|---|
| `index.html` | Home | Hero, problem, Meet TagVolt, the 5-stage Engine, portfolio teaser (2), 7-question FAQ, Lead Leak Audit band |
| `services.html` | The Engine | 01–05 stages with capability chips, then the 9-service grid |
| `portfolio.html` | Portfolio | 4 case studies (Ferdaousi Lab, ABE Climatisation, ALSFI, Diaspora for African Kids) |
| `pricing.html` | Pricing | Build / Operate offers, exact-scope in/out lists, custom add-ons |
| — | Blog | WordPress at `/blog/` (see `wordpress/`); nav link points there |
| `about.html` | About | Why TagVolt exists, how it works, industries, before/after, team |
| `contact.html` | Contact | Lead Leak Audit form (demo — not wired), address / phone / email |
| `privacy.html`, `terms.html` | (footer) | Placeholder legal pages — replace before launch |

Nav order everywhere: **Home · The Engine · Portfolio · Pricing · Blog · About ·
Contact**, plus the EN/FR toggle and the **Free Digital Audit** button.
Footer columns: **The Engine · Agency · Contact**.

## Bilingual (EN / FR)

English lives at the site root; **French is a generated mirror under `fr/`**
(`fr/index.html`, …). The EN/FR toggle is a real language switch: it reads the
page's `hreflang` alternates, navigates to the other locale, and remembers the
choice in `localStorage` (a returning visitor is sent to their language once per
session). The blog is English-only for now (WordPress + Polylang would add FR
later).

**Never edit `fr/` by hand.** Edit the English page, then regenerate:

```bash
node tools/build-fr.mjs .
```

That script (a) adds/refreshes the `hreflang` links on the English pages,
(b) rebuilds every `fr/` page — copying the English markup verbatim and swapping
only the text via the translation map inside it (add strings to `COMMON` or
`PAGES[<file>]`), and (c) re-syncs the WordPress theme's bundled `assets/`.

## Assets

```
assets/css/style.css     Whole design system
assets/js/main.js         Nav, language switch, FAQ, reveal-on-scroll, contact form
tools/build-fr.mjs        Generates the fr/ locale + re-syncs the WP theme assets
wordpress/tagvolt-blog/   WordPress blog theme (self-contained; bundles assets/)
wordpress/tools/          existing-posts.wxr importer + SETUP-WORDPRESS.md
server.mjs                Zero-dependency static server for local preview
.claude/launch.json       Preview config
```

## Local preview

```bash
node server.mjs
```

Open <http://localhost:4173>. Any static server works; `file://` also works.

## Adding a blog post

The blog is WordPress. Log in at `tagvolt.com/blog/wp-admin/`, **Posts → Add
New**, pick one Engine-stage **Category**, add a **Tag** and an **Excerpt**,
Publish. Full setup + editor guide: `wordpress/SETUP-WORDPRESS.md`.

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
- [ ] **Blog** on Hostinger: follow `wordpress/SETUP-WORDPRESS.md` (install WP in
      `public_html/blog/`, upload the theme, import `existing-posts.wxr`, set
      Permalinks → Post name, create editor accounts, install caching + Rank Math).
- [ ] Add `sitemap.xml` (marketing pages both locales + link WP's own sitemap)
      and `robots.txt`.
