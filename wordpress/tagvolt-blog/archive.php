<?php
/**
 * Stage / tag / date archives.
 */
if (!defined('ABSPATH')) { exit; }
get_header();

$title = get_the_archive_title();
$descr = get_the_archive_description();
// Strip WP's "Category:" / "Tag:" prefixes — the pill label already says "Blog".
$title = preg_replace('/^[^:]+:\s*/', '', wp_strip_all_tags($title));
?>
<main>
  <section class="hero">
    <div class="container">
      <div class="narrow reveal">
        <span class="pill-label">Blog</span>
        <h1><?php echo esc_html($title); ?></h1>
        <?php if ($descr) : ?>
          <p class="lead"><?php echo wp_kses_post($descr); ?></p>
        <?php else : ?>
          <p class="lead">Articles filed under <?php echo esc_html($title); ?>.</p>
        <?php endif; ?>
      </div>
    </div>
  </section>

  <?php get_template_part('parts/list'); ?>
</main>
<?php
get_footer();
