<?php
/**
 * Site footer — a 1:1 copy of the static site's footer markup.
 */
if (!defined('ABSPATH')) { exit; }
$root = tagvolt_site_root();
?>
<footer class="site-footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <a class="brand" href="<?php echo esc_url($root); ?>" aria-label="TagVolt home">
          <img class="brand__mark" src="<?php echo esc_url(tagvolt_asset('img/hub-mark.png')); ?>" width="240" height="240" alt="" />
          <span>TagVolt</span>
        </a>
        <p>Your digital department. Web design, local SEO, marketing automation, AI, community management, and GEO &mdash; for businesses across Alberta.</p>
      </div>
      <div>
        <h4>The Engine</h4>
        <ul>
          <li><a href="<?php echo esc_url($root); ?>services.html#attract">Attract</a></li>
          <li><a href="<?php echo esc_url($root); ?>services.html#capture">Capture</a></li>
          <li><a href="<?php echo esc_url($root); ?>services.html#respond">Respond &amp; Convert</a></li>
          <li><a href="<?php echo esc_url($root); ?>services.html#grow">Grow</a></li>
        </ul>
      </div>
      <div>
        <h4>Agency</h4>
        <ul>
          <li><a href="<?php echo esc_url($root); ?>portfolio.html">Portfolio</a></li>
          <li><a href="<?php echo esc_url($root); ?>pricing.html">Pricing</a></li>
          <li><a href="<?php echo esc_url(home_url('/')); ?>">Blog</a></li>
          <li><a href="<?php echo esc_url($root); ?>about.html">About</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li>226 - 8525 106A Avenue NW<br />Edmonton, AB T5H 0K1</li>
          <li><a href="tel:+15873571839">587 357 1839</a></li>
          <li><a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>&copy; <span data-year><?php echo esc_html(gmdate('Y')); ?></span> TagVolt Agency Inc. &mdash; Edmonton, AB</span>
      <span><a href="<?php echo esc_url($root); ?>privacy.html">Privacy Policy</a> &middot; <a href="<?php echo esc_url($root); ?>terms.html">Terms of Service</a></span>
    </div>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
