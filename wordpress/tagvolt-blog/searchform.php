<?php if (!defined('ABSPATH')) { exit; } ?>
<form role="search" method="get" class="form" action="<?php echo esc_url(home_url('/')); ?>">
  <div class="field">
    <label for="s">Search articles</label>
    <input id="s" type="search" name="s" value="<?php echo esc_attr(get_search_query()); ?>" placeholder="Local SEO, automation&hellip;" />
  </div>
  <button class="btn btn--primary" type="submit">Search</button>
</form>
