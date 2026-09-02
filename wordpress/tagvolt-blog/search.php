<?php
/**
 * Search results.
 */
if (!defined('ABSPATH')) { exit; }
get_header();
global $wp_query;
$found = (int) $wp_query->found_posts;
?>
<main>
  <section class="hero">
    <div class="container">
      <div class="narrow reveal">
        <span class="pill-label">Blog</span>
        <h1>Search</h1>
        <p class="lead">
          <?php
          printf(
            esc_html(_n('%1$s result for &ldquo;%2$s&rdquo;', '%1$s results for &ldquo;%2$s&rdquo;', $found, 'tagvolt-blog')),
            esc_html(number_format_i18n($found)),
            esc_html(get_search_query())
          );
          ?>
        </p>
      </div>
    </div>
  </section>

  <?php get_template_part('parts/list'); ?>
</main>
<?php
get_footer();
