<?php
/**
 * 404 — not found.
 */
if (!defined('ABSPATH')) { exit; }
get_header();
?>
<main>
  <section class="hero">
    <div class="container">
      <div class="narrow reveal">
        <span class="pill-label">Blog</span>
        <h1>Page Not Found</h1>
        <p class="lead">That article may have moved or never existed. Try the blog index or a search.</p>
        <p style="margin-top:24px">
          <a class="btn btn--primary" href="<?php echo esc_url(home_url('/')); ?>">Back to the blog</a>
        </p>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <?php get_search_form(); ?>
    </div>
  </section>
</main>
<?php
get_footer();
