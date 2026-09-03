<?php
/**
 * TagVolt Blog — theme functions
 * ---------------------------------------------------------------------
 * WordPress runs in  public_html/blog/  (subdirectory install).
 * The marketing site is hand-built static HTML one level up in
 * public_html/.
 *
 * The design system (style.css, main.js, the logo/mark images) is
 * BUNDLED in this theme's own assets/ folder — a copy of the main
 * site's assets/. That keeps the blog self-contained: it renders on
 * localhost, on staging and on Hostinger with no config and no
 * dependency on the marketing site being reachable.
 * Re-sync after changing the main site's CSS/JS:
 *   node tools/build-fr.mjs .        (also refreshes this copy)
 * or copy assets/{css,js,img} into wordpress/tagvolt-blog/assets/ .
 */

if (!defined('ABSPATH')) { exit; }

/**
 * URL of the static marketing site — used ONLY for the header/footer
 * navigation links (Home, The Engine, …), never for assets.
 *
 * On Hostinger it auto-resolves by stripping "/blog" from the WP home
 * URL. Elsewhere it falls back to the WP home URL (so the links stay
 * on-site). Override in wp-config.php to point the nav at the live
 * marketing site during local work:
 *   define('TAGVOLT_SITE_ROOT', 'https://tagvolt.com/');
 */
function tagvolt_site_root() {
    if (defined('TAGVOLT_SITE_ROOT')) {
        return trailingslashit(TAGVOLT_SITE_ROOT);
    }
    $home = trailingslashit(home_url('/'));            // e.g. https://tagvolt.com/blog/
    return preg_replace('#/blog/?$#', '/', $home);     // -> https://tagvolt.com/  (or home as-is)
}

/** URL of a file bundled in this theme's assets/ folder. */
function tagvolt_asset($path) {
    return get_theme_file_uri('assets/' . ltrim($path, '/'));
}

/** Theme supports. */
function tagvolt_setup() {
    add_theme_support('title-tag');
    add_theme_support('automatic-feed-links');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets'));
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
}
add_action('after_setup_theme', 'tagvolt_setup');

/** Enqueue the bundled design system + this theme's own overrides. */
function tagvolt_assets() {
    $ver = wp_get_theme()->get('Version');

    // Fonts — identical set to the static site.
    wp_enqueue_style(
        'tagvolt-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sora:wght@600;700;800&display=swap',
        array(),
        null
    );

    // The whole design system, bundled in this theme (copy of the main site's).
    wp_enqueue_style('tagvolt-site', tagvolt_asset('css/style.css'), array('tagvolt-fonts'), $ver);

    // This theme's small overrides (loaded last).
    wp_enqueue_style('tagvolt-blog', get_stylesheet_uri(), array('tagvolt-site'), $ver);

    // Site behaviour: header shadow, mobile menu, reveal-on-scroll. Defensive; safe on blog pages.
    wp_enqueue_script('tagvolt-site-js', tagvolt_asset('js/main.js'), array(), $ver, true);
}
add_action('wp_enqueue_scripts', 'tagvolt_assets');

/** Card excerpts: short, em-dash ellipsis (matches the static manifest). */
add_filter('excerpt_length', function () { return 26; });
add_filter('excerpt_more', function () { return '&hellip;'; });

/**
 * Editorial model, matching the old posts.js manifest:
 *   - ONE category per post = the Engine stage (Attract / Capture / Respond / Convert / Grow)
 *   - the first tag = the free-text topic label ("Local SEO", "Automation", ...)
 */
function tagvolt_stage($post_id = null) {
    $cats = get_the_category($post_id);
    return !empty($cats) ? $cats[0] : null;
}
function tagvolt_first_tag($post_id = null) {
    $tags = get_the_tags($post_id);
    return !empty($tags) ? $tags[0] : null;
}

/**
 * Reusable post card — reproduces the .post-card markup the static site
 * rendered in JS (assets/js/main.js -> postCard).
 */
function tagvolt_post_card() {
    $stage = tagvolt_stage();
    $tag   = tagvolt_first_tag();
    $thumb = has_post_thumbnail() ? get_the_post_thumbnail_url(null, 'large') : '';
    ?>
    <article class="post-card reveal">
      <a class="post-card__media" href="<?php the_permalink(); ?>" aria-label="<?php the_title_attribute(); ?>"
         <?php if ($thumb) : ?>style="background-image:url('<?php echo esc_url($thumb); ?>')"<?php endif; ?>>
        <span class="tagset">
          <?php if ($stage) : ?><span class="chip chip--solid"><?php echo esc_html($stage->name); ?></span><?php endif; ?>
          <?php if ($tag) : ?><span class="chip"><?php echo esc_html($tag->name); ?></span><?php endif; ?>
        </span>
      </a>
      <div class="post-card__body">
        <h3><?php the_title(); ?></h3>
        <p><?php echo esc_html(get_the_excerpt()); ?></p>
        <span class="post-card__more" aria-hidden="true">Read the article &rarr;</span>
      </div>
    </article>
    <?php
}

/** The stage-filter bar shown on the blog index and stage archives. */
function tagvolt_filter_bar() {
    $stages = get_categories(array('orderby' => 'name', 'hide_empty' => true));
    if (empty($stages)) { return; }
    ?>
    <div class="blog-filters" aria-label="Filter articles by stage">
      <a class="<?php echo is_home() ? 'is-active' : ''; ?>" href="<?php echo esc_url(home_url('/')); ?>">All</a>
      <?php foreach ($stages as $s) : ?>
        <a class="<?php echo is_category($s->term_id) ? 'is-active' : ''; ?>"
           href="<?php echo esc_url(get_category_link($s)); ?>"><?php echo esc_html($s->name); ?></a>
      <?php endforeach; ?>
    </div>
    <?php
}

/** Make the whole card clickable without nesting <a> in <a>. */
function tagvolt_card_click_script() {
    if (!is_home() && !is_archive() && !is_search()) { return; }
    ?>
    <script>
    (function () {
      document.querySelectorAll('.post-card').forEach(function (card) {
        var link = card.querySelector('.post-card__media');
        if (!link) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', function (e) {
          if (e.target.closest('a')) return;
          window.location = link.href;
        });
      });
    })();
    </script>
    <?php
}
add_action('wp_footer', 'tagvolt_card_click_script');

/** Hide the admin bar on the front end for non-editors — keeps the layout clean. */
add_action('after_setup_theme', function () {
    if (!current_user_can('edit_posts')) { show_admin_bar(false); }
});
