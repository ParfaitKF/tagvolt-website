<?php
/**
 * Shared list body: stage filter bar + 3-up card grid + pagination.
 * Used by home.php, archive.php and search.php.
 */
if (!defined('ABSPATH')) { exit; }
?>
<section class="section">
  <div class="container">
    <?php tagvolt_filter_bar(); ?>

    <?php if (have_posts()) : ?>
      <div class="grid cols-3">
        <?php while (have_posts()) : the_post(); tagvolt_post_card(); endwhile; ?>
      </div>
      <?php the_posts_pagination(array(
        'mid_size'  => 1,
        'prev_text' => '&larr; Newer',
        'next_text' => 'Older &rarr;',
      )); ?>
    <?php else : ?>
      <p class="lead">No articles here yet &mdash; check back soon.</p>
    <?php endif; ?>
  </div>
</section>
