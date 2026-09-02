<?php
/**
 * Single article — reproduces the static blog post layout
 * (.article / .article__head / .crumbs / .meta / .article__body).
 */
if (!defined('ABSPATH')) { exit; }
get_header();
$root = tagvolt_site_root();

while (have_posts()) : the_post();
    $stage = tagvolt_stage();
?>
<main>
  <article class="section">
    <div class="container">
      <div class="article">

        <div class="article__head">
          <p class="crumbs">
            <a href="<?php echo esc_url(home_url('/')); ?>">Blog</a>
            <?php if ($stage) : ?> / <a href="<?php echo esc_url(get_category_link($stage)); ?>"><?php echo esc_html($stage->name); ?></a><?php endif; ?>
          </p>
          <h1><?php the_title(); ?></h1>
          <div class="meta">
            <?php if ($stage) : ?>
              <span class="chip chip--solid" style="background:var(--orange)"><?php echo esc_html($stage->name); ?></span>
            <?php endif; ?>
            <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time>
          </div>
        </div>

        <?php if (has_post_thumbnail()) : ?>
          <figure style="margin:0 0 40px">
            <?php the_post_thumbnail('large', array('style' => 'border-radius:16px;width:100%;height:auto')); ?>
          </figure>
        <?php endif; ?>

        <div class="article__body">
          <?php the_content(); ?>
        </div>

        <?php
        $tags = get_the_tags();
        if ($tags) : ?>
          <div class="taglist" style="margin-top:40px">
            <?php foreach ($tags as $t) : ?>
              <span><?php echo esc_html($t->name); ?></span>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>

        <hr class="divider" style="margin-block:48px" />
        <p><a class="btn btn--primary" href="<?php echo esc_url($root); ?>contact.html">Talk to us about your system &rarr;</a></p>
      </div>
    </div>
  </article>

  <?php
  // ---- Keep reading: up to 3 posts, same stage first, then most recent ----
  $exclude = array(get_the_ID());
  $picks   = array();

  if ($stage) {
      $picks = get_posts(array(
          'numberposts'  => 3,
          'post__not_in' => $exclude,
          'category'     => $stage->term_id,
      ));
  }
  if (count($picks) < 3) {
      $fill = get_posts(array(
          'numberposts'  => 3 - count($picks),
          'post__not_in' => array_merge($exclude, wp_list_pluck($picks, 'ID')),
      ));
      $picks = array_merge($picks, $fill);
  }

  if ($picks) : ?>
    <section class="section keep-reading">
      <div class="container">
        <h2>Keep Reading</h2>
        <div class="grid cols-3">
          <?php foreach ($picks as $post) : setup_postdata($post); tagvolt_post_card(); endforeach; wp_reset_postdata(); ?>
        </div>
      </div>
    </section>
  <?php endif; ?>
</main>
<?php
endwhile;
get_footer();
