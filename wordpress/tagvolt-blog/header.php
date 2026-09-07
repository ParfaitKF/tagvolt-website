<?php
/**
 * Site header — a 1:1 copy of the static site's header markup.
 * If you change the nav on the static site, mirror it here.
 */
if (!defined('ABSPATH')) { exit; }
$root = tagvolt_site_root();
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/png" href="<?php echo esc_url(tagvolt_asset('img/favicon.png')); ?>" />
<link rel="apple-touch-icon" href="<?php echo esc_url(tagvolt_asset('img/favicon.png')); ?>" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<header class="site-header">
  <div class="container">
    <nav class="nav">
      <a class="brand" href="<?php echo esc_url($root); ?>" aria-label="TagVolt &mdash; digital systems that generate clients">
        <img src="<?php echo esc_url(tagvolt_asset('img/logo.png')); ?>" width="508" height="138" alt="TagVolt" />
      </a>
      <div class="nav__links">
        <a href="<?php echo esc_url($root); ?>">Home</a>
        <a href="<?php echo esc_url($root); ?>services.html">The Engine</a>
        <a href="<?php echo esc_url($root); ?>portfolio.html">Portfolio</a>
        <a href="<?php echo esc_url($root); ?>pricing.html">Pricing</a>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="is-active">Blog</a>
        <a href="<?php echo esc_url($root); ?>about.html">About</a>
        <a href="<?php echo esc_url($root); ?>contact.html">Contact</a>
      </div>
      <div class="nav__end">
        <div class="lang-toggle" role="group" aria-label="Language">
          <button type="button" data-lang="en" aria-pressed="true">EN</button>
          <button type="button" data-lang="fr" aria-pressed="false">FR</button>
        </div>
        <a class="btn btn--primary btn--pill" href="<?php echo esc_url($root); ?>contact.html">Free Digital Audit</a>
      </div>
      <button class="nav__toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </nav>
  </div>
  <div class="mobile-menu">
    <a href="<?php echo esc_url($root); ?>">Home</a>
    <a href="<?php echo esc_url($root); ?>services.html">The Engine</a>
    <a href="<?php echo esc_url($root); ?>portfolio.html">Portfolio</a>
    <a href="<?php echo esc_url($root); ?>pricing.html">Pricing</a>
    <a href="<?php echo esc_url(home_url('/')); ?>">Blog</a>
    <a href="<?php echo esc_url($root); ?>about.html">About</a>
    <a href="<?php echo esc_url($root); ?>contact.html">Contact</a>
    <div class="lang-toggle" role="group" aria-label="Language">
      <button type="button" data-lang="en" aria-pressed="true">EN</button>
      <button type="button" data-lang="fr" aria-pressed="false">FR</button>
    </div>
    <a class="btn btn--primary" href="<?php echo esc_url($root); ?>contact.html">Free Digital Audit</a>
  </div>
</header>
