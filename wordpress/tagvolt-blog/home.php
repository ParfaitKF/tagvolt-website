<?php
/**
 * Blog index — the posts page (Settings -> Reading -> "Posts page" = /blog/).
 */
if (!defined('ABSPATH')) { exit; }
get_header();
?>
<main>
  <section class="hero">
    <div class="container">
      <div class="narrow reveal">
        <span class="pill-label">Blog</span>
        <h1>Tips For Running Your Digital System</h1>
        <p class="lead">Local SEO, automation, follow-up &mdash; practical articles for growing businesses across Alberta.</p>
      </div>
    </div>
  </section>

  <?php get_template_part('parts/list'); ?>
</main>
<?php
get_footer();
