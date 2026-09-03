# Blog on WordPress — setup guide

The public marketing site stays hand-built static HTML. **Only the blog runs on
WordPress**, installed in a subdirectory so it lives at `https://tagvolt.com/blog/`.
Editors get the full WordPress editor, media library, drafts, scheduling and
user accounts — nothing custom to maintain.

```
public_html/
├── index.html, services.html, …        ← the static site (deployed from GitHub)
├── fr/                                  ← French mirror of the static site
├── assets/                              ← the static site's CSS/JS/images
└── blog/                                ← WordPress lives here (NOT in git, git-ignored)
    └── wp-content/themes/tagvolt-blog/  ← the theme (bundles its own copy of the design assets)
```

This folder in the repo (`wordpress/`) is the **source of truth for the theme
and the import file** — it is not the live install.

---

## One-time setup (in Hostinger hPanel)

### 1. Install WordPress into `/blog`
- hPanel → **Websites → Dashboard → WordPress → Install**.
- Set the install directory to **`blog`** (so the address is `tagvolt.com/blog`).
- Let Hostinger create the database. Note the admin user / password.
- After install: **Settings → General** — confirm *WordPress Address* and *Site
  Address* both end in `/blog`.

### 2. Protect the static site from the Git deployment
Hostinger's Git auto-deploy updates `public_html` from `ParfaitKF/tagvolt-website`.
A `git`-style deploy leaves untracked folders alone, but to be safe:

- In hPanel → **Advanced → Git** → confirm the deployment path is `public_html`
  (not a clean-sync/rsync-delete mode). If Hostinger offers "delete files not in
  repo", leave it **off**.
- At **cutover** (see the checklist below), when the static `blog/*.html` files
  are removed from the repo, add `/blog/` to `.gitignore` so the live WordPress
  directory is never touched by a deploy.

### 3. Upload the theme
- hPanel → **File Manager** → `public_html/blog/wp-content/themes/`.
- Upload the whole `tagvolt-blog/` folder from `wordpress/tagvolt-blog/` in this repo.
  (Or zip it and use **Appearance → Themes → Add New → Upload Theme**.)
- **Appearance → Themes → Activate “TagVolt Blog”.**

### 4. Permalinks
- **Settings → Permalinks → Post name** → Save.
  Article URLs become `tagvolt.com/blog/<slug>/`.

### 5. Reading settings
- **Settings → Reading → Your homepage displays → “Your latest posts.”**
  (With WP in `/blog`, its home *is* the post list — that's what we want.)

### 6. Import the 3 existing articles
- **Tools → Import → WordPress → Run Importer.**
- Upload `wordpress/tools/existing-posts.wxr` from this repo.
- Assign posts to your user. Tick **“Download and import file attachments”** (harmless here).
- You'll get 3 published posts, categories **Attract / Respond / Grow**, and matching tags.

### 7. Plugins (install → activate)
| Plugin | Why |
| --- | --- |
| **LiteSpeed Cache** (or WP Super Cache) | Hostinger uses LiteSpeed; page cache keeps the blog fast. |
| **Rank Math SEO** (or Yoast) | Titles, meta descriptions, sitemap, Open Graph. Point its sitemap at Search Console. |
| **WPS Hide Login** *(optional)* | Moves `/wp-login.php` to a custom path to cut bot traffic. |

### 8. User accounts for teammates / clients
- **Users → Add New.** Roles:
  - **Editor** — write, edit *and publish* anyone's posts (trusted teammates).
  - **Author** — write and publish *their own* posts.
  - **Contributor** — write drafts, cannot publish (clients / juniors; you review).
- Everyone signs in at `tagvolt.com/blog/wp-admin/`.

---

## Editing the blog (day to day)

1. Go to `tagvolt.com/blog/wp-admin/`.
2. **Posts → Add New.**
3. Write in the block editor. Then in the right-hand sidebar:
   - **Category** — pick **exactly one** Engine stage: *Attract, Capture,
     Respond, Convert, Grow*. This is the orange chip on the card and the
     breadcrumb. (Add the two missing ones — Capture, Convert — under
     **Posts → Categories** when first needed.)
   - **Tags** — add one topic label (e.g. “Local SEO”). The first tag shows as
     the second chip on the card.
   - **Excerpt** (Post → Excerpt panel) — one sentence for the card. If left
     blank, WordPress trims the first ~26 words.
   - **Featured image** *(optional)* — replaces the slate gradient on the card
     and shows at the top of the article.
4. **Publish** (or **Schedule** for later).

The card grid, stage filters, related-articles block and RSS feed all update
automatically. No files to touch, no deploy.

---

## The theme (`tagvolt-blog/`)

| File | Renders |
| --- | --- |
| `header.php` / `footer.php` | Exact copy of the static site's header & footer. **If you change the nav on the static site, mirror it here.** |
| `home.php` | Blog index — hero, stage filter bar, 3-up card grid, pagination. |
| `archive.php` | Category / tag / date archives. |
| `single.php` | One article + “Keep reading” (3 posts, same stage first). |
| `search.php` / `404.php` | Search results / not-found. |
| `functions.php` | Enqueues the bundled design system, defines the post-card markup. |
| `style.css` | Theme header + a few bridges (filter links, WP block styles, pagination). |
| `assets/` | **Bundled copy** of the main site's `css/style.css`, `js/main.js` and the logo images. Keeps the theme self-contained. Re-synced by `node tools/build-fr.mjs .`. |

**How assets resolve:** `functions.php` loads `style.css` / `main.js` / the
logo images straight from this theme's own `assets/` folder
(`get_theme_file_uri`) — no config, works on localhost and Hostinger alike.
Only the header/footer **navigation links** use `tagvolt_site_root()`, which
strips `/blog` from the WordPress home URL (so on Hostinger they point at
`https://tagvolt.com/services.html` etc.). To aim those links somewhere else
during local work, set in `wp-config.php`:

```php
define('TAGVOLT_SITE_ROOT', 'https://tagvolt.com/');
```

(That define no longer affects styling — it's links-only now.)

### Updating the theme later
Edit the files in `wordpress/tagvolt-blog/` here, commit, then re-upload the
changed files to `public_html/blog/wp-content/themes/tagvolt-blog/` (File
Manager or SFTP). The theme is intentionally **not** part of the Git auto-deploy.

---

## Cutover — already done in code

The static blog has been retired in this repo:

- [x] Every **“Blog”** link (header / mobile menu / footer, EN + FR) now points
      at `/blog/`.
- [x] `blog.html`, `blog/*.html`, `blog/_template.html`, `assets/js/posts.js`,
      `assets/js/posts.fr.js` and the blog-rendering block in `assets/js/main.js`
      are removed. `fr/blog*` too.
- [x] `.htaccess` (repo root → `public_html/.htaccess`) 301s `/blog/*.html` and
      `/blog.html` to the new URLs.
- [x] `/blog/` is git-ignored so the WordPress install is never disturbed.

Still to do after WordPress is live:

- [ ] Submit `tagvolt.com/blog/sitemap.xml` (from Rank Math) to Search Console.
- [ ] Add `tagvolt.com/blog/` entries to the marketing `sitemap.xml`.
