<?php
/**
 * Fallback template. WordPress uses this only when a more specific
 * template (home.php, archive.php, single.php, search.php, 404.php)
 * does not exist. Kept minimal but on-brand.
 */
if (!defined('ABSPATH')) { exit; }
get_header();
?>
<main>
  <section class="hero">
    <div class="container">
      <div class="narrow reveal">
        <span class="pill-label">Blog</span>
        <h1><?php bloginfo('name'); ?></h1>
        <?php if (get_bloginfo('description')) : ?>
          <p class="lead"><?php bloginfo('description'); ?></p>
        <?php endif; ?>
      </div>
    </div>
  </section>

  <?php get_template_part('parts/list'); ?>
</main>
<?php
get_footer();
