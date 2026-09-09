/* =====================================================================
   TagVolt — French build
   ---------------------------------------------------------------------
   Generates the fr/ locale from the English source pages and adds the
   hreflang alternates to the English pages. Re-run after editing any
   English page:   node tools/build-fr.mjs .

   - English stays at the site root (index.html, services.html, …).
   - French is a mirror under fr/  (fr/index.html, fr/blog/…).
   - Only text is translated; structure/markup is copied verbatim, so
     the two locales can never drift apart.
   ===================================================================== */
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";

const ROOT = process.argv[2] || ".";

/* Pages mirrored into fr/. The blog now runs on WordPress at /blog/, so it
   is not part of this build. */
const ROOT_PAGES = [
  "index.html", "services.html", "portfolio.html", "pricing.html",
  "about.html", "contact.html", "privacy.html", "terms.html",
];

/* =====================================================================
   1. Shared strings (header, nav, footer) — applied to every page
   ===================================================================== */
const COMMON = [
  ['aria-label="TagVolt — digital systems that generate clients"',
   'aria-label="TagVolt — des systèmes numériques qui génèrent des clients"'],
  ['aria-label="TagVolt home"', 'aria-label="Accueil TagVolt"'],
  ['aria-label="Open menu"', 'aria-label="Ouvrir le menu"'],
  ['aria-label="Language"', 'aria-label="Langue"'],

  // nav + footer links — matched on link text only, so they work whether
  // the href is "index.html" (root pages) or "../index.html" (blog posts)
  ['>Home</a>', '>Accueil</a>'],
  ['>The Engine</a>', '>Le Moteur</a>'],
  ['>Portfolio</a>', '>Réalisations</a>'],
  ['>Pricing</a>', '>Tarifs</a>'],
  ['>Blog</a>', '>Blogue</a>'],
  ['>About</a>', '>À propos</a>'],

  ['>Free Digital Audit<', '>Audit numérique gratuit<'],

  // footer
  ['<p>Your digital department. Web design, local SEO, marketing automation, AI, community management, and GEO — for businesses across Alberta.</p>',
   '<p>Votre département numérique. Conception web, SEO local, automatisation marketing, IA, gestion de communauté et GEO — pour les entreprises partout en Alberta.</p>'],
  ['<h4>The Engine</h4>', '<h4>Le Moteur</h4>'],
  ['<h4>Agency</h4>', '<h4>Agence</h4>'],
  ['#attract">Attract</a>', '#attract">Attirer</a>'],
  ['#capture">Capture</a>', '#capture">Capter</a>'],
  ['#respond">Respond &amp; Convert</a>', '#respond">Répondre et convertir</a>'],
  ['#grow">Grow</a>', '#grow">Développer</a>'],
  ['>Privacy Policy</a>', '>Politique de confidentialité</a>'],
  ['>Terms of Service</a>', '>Conditions d’utilisation</a>'],
];

/* =====================================================================
   2. Per-page strings
   ===================================================================== */
const PAGES = {
  "index.html": [
    /* ---- head ---- */
    ['<title>TagVolt — Your Digital Department</title>', '<title>TagVolt — Votre département numérique</title>'],
    ['content="TagVolt — Your Digital Department"', 'content="TagVolt — Votre département numérique"'],
    ['content="TagVolt helps growing businesses build, manage and improve the digital systems behind their business — websites, Google, automation, AI and lead follow-up. One team. One system. One point of contact, in English or French."',
     'content="TagVolt aide les entreprises en croissance à bâtir, gérer et améliorer les systèmes numériques derrière leur entreprise — sites web, Google, automatisation, IA et relance des prospects. Une équipe. Un système. Un seul point de contact, en français ou en anglais."'],
    ['content="One team runs the website, Google, automation, AI and lead follow-up behind your business."',
     'content="Une équipe pilote le site web, Google, l’automatisation, l’IA et la relance des prospects derrière votre entreprise."'],

    /* ---- hero ---- */
    ['<p class="kicker">Your business deserves more than a website</p>',
     '<p class="kicker">Votre entreprise mérite mieux qu’un simple site web</p>'],
    ['<h1>Build A Digital System That <span class="text-blue">Works For You.</span></h1>',
     '<h1>Bâtissez un système numérique qui <span class="text-blue">travaille pour vous.</span></h1>'],
    ['<p class="lead">TagVolt helps growing businesses build, manage and improve the digital systems behind their business — websites, Google, automation, AI and lead follow-up. One team. One system. One point of contact, in English or French.</p>',
     '<p class="lead">TagVolt aide les entreprises en croissance à bâtir, gérer et améliorer les systèmes numériques derrière leur entreprise — sites web, Google, automatisation, IA et relance des prospects. Une équipe. Un système. Un seul point de contact, en français ou en anglais.</p>'],
    ['Get My Free Digital Audit', 'Obtenir mon audit gratuit'],
    ['See the TagVolt Engine', 'Voir le Moteur TagVolt'],
    ['No pressure</li>', 'Sans pression</li>'],
    ['No obligation</li>', 'Sans engagement</li>'],
    ['Bilingual — EN / FR</li>', 'Bilingue — FR / EN</li>'],
    ['<span class="label">Get found<br />on Google</span>', '<span class="label">Être trouvé<br />sur Google</span>'],
    ['<span class="label">Turn visitors<br />into customers</span>', '<span class="label">Convertir les visiteurs<br />en clients</span>'],
    ['<span class="label">Grow your<br />business</span>', '<span class="label">Faire croître<br />votre entreprise</span>'],
    ['<p>A dedicated team<br />for your growth</p>', '<p>Une équipe dédiée<br />à votre croissance</p>'],

    /* ---- trusted by ---- */
    ['>Trusted by businesses across Alberta</p>', '>Des entreprises de partout en Alberta nous font confiance</p>'],

    /* ---- why it matters ---- */
    ['<span></span>Why it matters</div>', '<span></span>Pourquoi c’est important</div>'],
    ['<h2>Most businesses lose customers in ways that never <span class="text-orange">show up on</span> a report.</h2>',
     '<h2>La plupart des entreprises perdent des clients d’une manière qui <span class="text-orange">n’apparaît jamais</span> dans un rapport.</h2>'],
    ['<p>Nothing looks broken. It just quietly costs you the customer who was ready to say yes.</p>',
     '<p>Rien ne semble brisé. Ça vous coûte simplement, en silence, le client qui était prêt à dire oui.</p>'],
    ['<h3>A visitor leaves without acting</h3>', '<h3>Un visiteur repart sans agir</h3>'],
    ['<p>The site loads, but nothing tells them what to do next — so they go to the next result instead.</p>',
     '<p>Le site se charge, mais rien ne lui indique quoi faire ensuite — alors il passe au résultat suivant.</p>'],
    ['<h3>A message waits too long for a reply</h3>', '<h3>Un message attend trop longtemps une réponse</h3>'],
    ['<p>A quote request or contact form sits unanswered for hours — long enough for the customer to call someone else.</p>',
     '<p>Une demande de devis ou un formulaire de contact reste sans réponse pendant des heures — assez pour que le client appelle quelqu’un d’autre.</p>'],
    ['<h3>A call is missed during a busy job</h3>', '<h3>Un appel est manqué pendant un chantier</h3>'],
    ['<p>The phone goes to voicemail with no follow-up — and most callers never leave a message at all.</p>',
     '<p>L’appel tombe dans la boîte vocale sans relance — et la plupart des gens ne laissent jamais de message.</p>'],
    ['<p><strong>None of this is a sign your business is doing something wrong.</strong></p>',
     '<p><strong>Rien de tout cela ne signifie que votre entreprise fait quelque chose de mal.</strong></p>'],
    ["<p>It's usually a sign that no one owns the system connecting your website, your search visibility, and your follow-up — which is exactly the gap TagVolt fills.</p>",
     '<p>C’est généralement le signe que personne ne pilote le système qui relie votre site web, votre visibilité dans les recherches et vos relances — et c’est exactement cette lacune que TagVolt comble.</p>'],

    /* ---- the engine (tab panel) ---- */
    ['<div class="eyebrow"><span class="dash"></span>The TagVolt Engine</div>', '<div class="eyebrow"><span class="dash"></span>Le Moteur TagVolt</div>'],
    ['<h2>One connected system, not five disconnected tools.</h2>', '<h2>Un système connecté, pas cinq outils déconnectés.</h2>'],
    ['<p class="lede">Every project we build runs on the same five-stage engine. Click through the stages, or see the full breakdown.</p>',
     '<p class="lede">Chaque projet que nous réalisons fonctionne sur le même moteur en cinq étapes. Parcourez les étapes, ou voyez le détail complet.</p>'],
    ['Explore the full engine', 'Explorer le moteur complet'],

    /* ---- how we start ---- */
    ['<span class="dash"></span>How we start</div>', '<span class="dash"></span>Comment ça démarre</div>'],
    ['<h2>A Fixed Process, So You Always<br />Know <span class="accent">What\'s Next.</span></h2>',
     '<h2>Un processus fixe, pour que vous sachiez<br />toujours <span class="accent">la suite.</span></h2>'],
    ['<h3>Free digital audit</h3>', '<h3>Audit numérique gratuit</h3>'],
    ["<p>We review your site, your Google visibility, and your lead follow-up, and show you exactly what's costing you customers.</p>",
     '<p>Nous examinons votre site, votre visibilité Google et vos relances, puis nous vous montrons exactement ce qui vous coûte des clients.</p>'],
    ['<h3>Build</h3>', '<h3>Réalisation</h3>'],
    ['<p>We design and build the website, set up local SEO, and connect the automations on your existing phone number and domain.</p>',
     '<p>Nous concevons et bâtissons le site web, configurons le SEO local et connectons les automatisations à votre numéro de téléphone et à votre domaine actuels.</p>'],
    ['<h3>Launch</h3>', '<h3>Lancement</h3>'],
    ['<p>You review and approve everything before it goes live. Nothing publishes without your sign-off.</p>',
     '<p>Vous révisez et approuvez tout avant la mise en ligne. Rien n’est publié sans votre accord.</p>'],
    ['<h3>Ongoing support</h3>', '<h3>Soutien continu</h3>'],
    ['<p>If you choose to continue on the Operate plan, we monitor, update, and report on performance every month.</p>',
     '<p>Si vous choisissez de poursuivre avec le forfait Opérer, nous surveillons, mettons à jour et faisons un rapport de performance chaque mois.</p>'],

    /* ---- featured project ---- */
    ['<span class="dash"></span>Featured project</div>', '<span class="dash"></span>Projet vedette</div>'],
    ['<h2 class="feature-project__heading">Inside one of our recent builds.</h2>',
     '<h2 class="feature-project__heading">Au cœur d’une de nos réalisations récentes.</h2>'],
    ['alt="The bilingual Ferdaousi Lab website TagVolt designed, built and handed over"',
     'alt="Le site web bilingue de Ferdaousi Lab, conçu, réalisé et livré par TagVolt"'],
    ['<span class="feature-project__badge">Medical laboratory</span>', '<span class="feature-project__badge">Laboratoire médical</span>'],
    ['<h3>A bilingual research site, handed over fully.</h3>', '<h3>Un site de recherche bilingue, livré clés en main.</h3>'],
    ["<p><strong>Ferdaousi Lab</strong> needed a professional bilingual presence to showcase its research, its team, and student opportunities — without adding technology work to the researchers' plates. TagVolt designed, built, and delivered the full 16-page site, including a student application system, so the lab could focus entirely on its work.</p>",
     '<p><strong>Ferdaousi Lab</strong> avait besoin d’une présence bilingue professionnelle pour mettre en valeur ses recherches, son équipe et les possibilités pour les étudiants — sans ajouter de travail technique à l’assiette des chercheurs. TagVolt a conçu, réalisé et livré l’ensemble du site de 16 pages, y compris un système de candidature étudiante, pour que le laboratoire puisse se consacrer entièrement à son travail.</p>'],
    ['<div class="label">Pages, EN + FR</div>', '<div class="label">Pages, FR + EN</div>'],
    ['<div class="label">Application system</div>', '<div class="label">Système de candidature</div>'],
    ['<div class="label">Handed over, ready to use</div>', '<div class="label">Livré, prêt à l’emploi</div>'],
    ['See more projects →', 'Voir plus de projets →'],

    /* ---- what clients say ---- */
    ['<p class="voices__eyebrow">What clients say</p>', '<p class="voices__eyebrow">Ce que disent nos clients</p>'],
    ['<h2 class="voices__title">Real Feedback From <span class="voices__accent">Real Projects.</span></h2>',
     '<h2 class="voices__title">De vrais retours sur <span class="voices__accent">de vrais projets.</span></h2>'],
    ['<p class="voices__lede">TagVolt helps growing trade businesses turn their website into a system that brings in real, booked customers.</p>',
     '<p class="voices__lede">TagVolt aide les entreprises de métiers en croissance à transformer leur site web en un système qui amène de vrais clients, avec rendez-vous confirmés.</p>'],
    ['<blockquote class="voices__quote">&ldquo;Since TagVolt rebuilt our site, we&rsquo;re finally showing up when people search for us. New client calls came in the very first month.&rdquo;</blockquote>',
     '<blockquote class="voices__quote">&ldquo;Depuis que TagVolt a refait notre site, on apparaît enfin quand les gens nous cherchent. Des appels de nouveaux clients sont entrés dès le premier mois.&rdquo;</blockquote>'],
    ['<blockquote class="voices__quote">&ldquo;The old site sat there doing nothing. Now our booking calendar fills up on its own. TagVolt gave us a system, not just a website.&rdquo;</blockquote>',
     '<blockquote class="voices__quote">&ldquo;L’ancien site ne servait à rien. Maintenant, notre calendrier de rendez-vous se remplit tout seul. TagVolt nous a donné un système, pas juste un site web.&rdquo;</blockquote>'],
    ['<blockquote class="voices__quote">&ldquo;Clear communication, fast turnaround, and a site that actually brings in leads instead of just looking nice.&rdquo;</blockquote>',
     '<blockquote class="voices__quote">&ldquo;Communication claire, délais rapides, et un site qui génère réellement des prospects au lieu de seulement bien paraître.&rdquo;</blockquote>'],
    ['<p class="voices__closing">&ldquo;Your business deserves results like these.&rdquo;</p>',
     '<p class="voices__closing">&ldquo;Votre entreprise mérite des résultats comme ceux-là.&rdquo;</p>'],
    ['View all projects', 'Voir tous les projets'],

    /* ---- why TagVolt ---- */
    ['<span class="eyebrow"><span class="num">—</span> Why TagVolt</span>', '<span class="eyebrow"><span class="num">—</span> Pourquoi TagVolt</span>'],
    ['<h2>Built To Be The One Call You Make, Not One Of Five.</h2>', '<h2>Conçu pour être le seul appel à faire, pas un parmi cinq.</h2>'],
    ['<p>Most businesses end up juggling a web designer, an SEO freelancer, and whoever answers the phone. TagVolt replaces all three with one accountable team.</p>',
     '<p>La plupart des entreprises finissent par jongler avec un concepteur web, un pigiste en SEO et la personne qui répond au téléphone. TagVolt remplace les trois par une seule équipe responsable.</p>'],
    ['<h4>Incorporated, Edmonton-based</h4>', '<h4>Constituée en société, établie à Edmonton</h4>'],
    ['<p>TagVolt Agency Inc. is a registered Alberta business, not a side project.</p>',
     '<p>TagVolt Agency Inc. est une entreprise albertaine enregistrée, pas un projet parallèle.</p>'],
    ['<h4>One point of contact</h4>', '<h4>Un seul point de contact</h4>'],
    ['<p>No hand-offs between agencies — the same team designs, builds, and runs the system.</p>',
     '<p>Aucun transfert entre agences — la même équipe conçoit, réalise et fait fonctionner le système.</p>'],
    ['<h4>Bilingual by default</h4>', '<h4>Bilingue par défaut</h4>'],
    ['<p>Every engagement runs comfortably in English or French, not as an afterthought.</p>',
     '<p>Chaque mandat se déroule aisément en français ou en anglais, pas après coup.</p>'],
    ['<h4>You own everything</h4>', '<h4>Vous êtes propriétaire de tout</h4>'],
    ['<p>Your website, your domain, your data — nothing is held back if you ever decide to leave.</p>',
     '<p>Votre site web, votre domaine, vos données — rien n’est retenu si vous décidez un jour de partir.</p>'],
    ['More about us →', 'En savoir plus sur nous →'],

    /* ---- our work ---- */
    ['<span class="eyebrow"><span class="num">—</span> Our work</span>', '<span class="eyebrow"><span class="num">—</span> Nos réalisations</span>'],
    ['<h2>Four Sectors. The Same Underlying System.</h2>', '<h2>Quatre secteurs. Le même système sous-jacent.</h2>'],
    ['<span class="case__tag">Medical laboratory</span>', '<span class="case__tag">Laboratoire médical</span>'],
    ['<span class="case__tag">Local trades</span>', '<span class="case__tag">Métiers locaux</span>'],
    ['<span class="case__tag">Specialized services</span>', '<span class="case__tag">Services spécialisés</span>'],
    ['<span class="case__tag">Community organization</span>', '<span class="case__tag">Organisme communautaire</span>'],
    ['<p>A full digital handover so the research team could stay focused on patients, not technology.</p>',
     '<p>Une prise en charge numérique complète pour que l’équipe de recherche reste concentrée sur les patients, pas sur la technologie.</p>'],
    ['<p>A site rebuilt around one job: turning visits into booked calls, not just traffic.</p>',
     '<p>Un site refait autour d’un seul objectif : transformer les visites en appels planifiés, pas seulement en trafic.</p>'],
    ['<p>A professional presence built to earn trust from the very first visit.</p>',
     '<p>Une présence professionnelle bâtie pour inspirer confiance dès la première visite.</p>'],
    ['<p>Real visibility for a cause, on a fraction of a typical agency budget.</p>',
     '<p>Une visibilité réelle pour une cause, avec une fraction du budget d’une agence habituelle.</p>'],
    ['See the full portfolio →', 'Voir toutes les réalisations →'],

    /* ---- second look ---- */
    ['<span class="eyebrow"><span class="num">—</span> Second look</span>', '<span class="eyebrow"><span class="num">—</span> Deuxième regard</span>'],
    ['<h2>Same System, Completely Different Business.</h2>', '<h2>Le même système, une entreprise complètement différente.</h2>'],
    ['<h3>A site rebuilt to generate calls, not just traffic.</h3>', '<h3>Un site refait pour générer des appels, pas seulement du trafic.</h3>'],
    ["<p>ABE Climatisation's old site got visits but few calls. TagVolt rebuilt it around a single job: making it effortless to call, request a quote, or book a service — with click-to-call on every screen and pages structured around real service areas instead of one generic homepage.</p>",
     '<p>L’ancien site d’ABE Climatisation recevait des visites, mais peu d’appels. TagVolt l’a refait autour d’un seul objectif : rendre l’appel, la demande de devis ou la prise de rendez-vous sans effort — avec un bouton clic-pour-appeler sur chaque écran et des pages structurées autour de véritables zones de service plutôt qu’une page d’accueil générique.</p>'],
    ['<span class="big">1-tap</span>', '<span class="big">1 clic</span>'],
    ['<p>Core services featured</p>', '<p>Services principaux mis en avant</p>'],
    ['<p>Click-to-call, every page</p>', '<p>Clic-pour-appeler, chaque page</p>'],

    /* ---- how we compare ---- */
    ['<span class="eyebrow"><span class="num">—</span> How we compare</span>', '<span class="eyebrow"><span class="num">—</span> Comment nous nous comparons</span>'],
    ['<h2>One Team, Versus Juggling Several.</h2>', '<h2>Une équipe, plutôt que d’en jongler plusieurs.</h2>'],
    ['<p>This is the trade-off businesses are usually weighing when they find us.</p>',
     '<p>C’est le compromis que les entreprises pèsent généralement lorsqu’elles nous trouvent.</p>'],
    ['<th scope="col">What you need</th>', '<th scope="col">Ce qu’il vous faut</th>'],
    ['<th scope="col">Freelancer</th>', '<th scope="col">Pigiste</th>'],
    ['<th scope="col">Traditional agency</th>', '<th scope="col">Agence traditionnelle</th>'],
    ['<th scope="row">Website design &amp; build</th>', '<th scope="row">Conception et réalisation du site web</th>'],
    ['<th scope="row">Local SEO &amp; Google Business Profile</th>', '<th scope="row">SEO local et fiche d’établissement Google</th>'],
    ['<th scope="row">Lead follow-up automation</th>', '<th scope="row">Automatisation des relances</th>'],
    ['<th scope="row">One accountable point of contact</th>', '<th scope="row">Un point de contact responsable</th>'],
    ['<th scope="row">Bilingual EN/FR delivery</th>', '<th scope="row">Livraison bilingue FR/EN</th>'],
    ['<th scope="row">Ongoing monitoring &amp; reporting</th>', '<th scope="row">Surveillance et rapports continus</th>'],
    ['<td class="no">Sometimes</td>', '<td class="no">Parfois</td>'],
    ['<td class="no">Usually</td>', '<td class="no">Habituellement</td>'],
    ['<td class="no">Separate hire</td>', '<td class="no">Embauche distincte</td>'],
    ['<td class="no">Often extra</td>', '<td class="no">Souvent en supplément</td>'],
    ['<td class="no">Rarely offered</td>', '<td class="no">Rarement offert</td>'],
    ['<td class="no">Yes, but limited capacity</td>', '<td class="no">Oui, mais capacité limitée</td>'],
    ['<td class="no">Account manager + team hand-offs</td>', '<td class="no">Gestionnaire de compte + transferts d’équipe</td>'],
    ['<td class="no">Depends on the person</td>', '<td class="no">Selon la personne</td>'],
    ['<td class="no">Depends on the agency</td>', '<td class="no">Selon l’agence</td>'],
    ['<td class="no">Often a paid tier</td>', '<td class="no">Souvent un palier payant</td>'],
    ['>Included</td>', '>Inclus</td>'],
    ['>Optional — Operate plan</td>', '>Optionnel — forfait Opérer</td>'],

    /* ---- built on solid ground ---- */
    ['<span class="eyebrow"><span class="num">—</span> Built on solid ground</span>', '<span class="eyebrow"><span class="num">—</span> Bâti sur des fondations solides</span>'],
    ['<h2>Real Platforms, Not Black Boxes.</h2>', '<h2>De vraies plateformes, pas des boîtes noires.</h2>'],
    ['<p>Everything we build runs on tools you can look up, verify, and keep using even without us.</p>',
     '<p>Tout ce que nous bâtissons fonctionne sur des outils que vous pouvez consulter, vérifier et continuer d’utiliser même sans nous.</p>'],
    ['Google Business Profile &middot; WordPress &middot; Hostinger &middot; Twilio &middot; Meta &middot; Stripe &mdash; replace with your actual stack.',
     'Google Business Profile &middot; WordPress &middot; Hostinger &middot; Twilio &middot; Meta &middot; Stripe &mdash; à remplacer par votre véritable pile technologique.'],

    /* ---- founder-led ---- */
    ['<span class="eyebrow"><span class="num">—</span> Founder-led</span>', '<span class="eyebrow"><span class="num">—</span> Dirigé par le fondateur</span>'],
    ['<h2>Every Project, Handled Directly.</h2>', '<h2>Chaque projet, pris en charge directement.</h2>'],
    ["<p>TagVolt Agency Inc. was founded in Edmonton to give growing Alberta businesses the kind of digital operation usually reserved for companies with an in-house marketing team. Every project is handled directly, with the same attention to detail from the first call to launch — and beyond, for clients who choose to keep the system running.</p>",
     '<p>TagVolt Agency Inc. a été fondée à Edmonton pour offrir aux entreprises albertaines en croissance le type d’opération numérique habituellement réservé aux entreprises dotées d’une équipe marketing interne. Chaque projet est pris en charge directement, avec le même souci du détail du premier appel jusqu’au lancement — et au-delà, pour les clients qui choisissent de garder le système en marche.</p>'],
    ['Read our story →', 'Lire notre histoire →'],
    ['alt="Franklin, founder of TagVolt Agency"', 'alt="Franklin, fondateur de TagVolt Agency"'],

    /* ---- free digital audit (CTA) ---- */
    ['<span class="num">—</span> Free digital audit</span>', '<span class="num">—</span> Audit numérique gratuit</span>'],
    ['<h2>Ready To Hand Off Your Digital Department?</h2>', '<h2>Prêt à confier votre département numérique?</h2>'],
    ["<p>20 minutes, no sales pitch, no obligation. We'll show you exactly what's costing you customers right now.</p>",
     '<p>20 minutes, aucun argumentaire de vente, aucun engagement. Nous vous montrerons exactement ce qui vous coûte des clients en ce moment.</p>'],
    ['Book My Free Audit', 'Réserver mon audit gratuit'],

    /* ---- footer (index-specific — the redesigned footer) ---- */
    ['<p>The outsourced digital department for growing Alberta businesses — websites, local SEO, automation, and AI, run as one system.</p>',
     '<p>Le département numérique externalisé des entreprises albertaines en croissance — sites web, SEO local, automatisation et IA, gérés comme un seul système.</p>'],
    ['<h4>Engine</h4>', '<h4>Moteur</h4>'],
    ['#respond">Respond</a>', '#respond">Répondre</a>'],
    ['#convert">Convert</a>', '#convert">Convertir</a>'],
    ['#attract">Attract</a>', '#attract">Attirer</a>'],
    ['#capture">Capture</a>', '#capture">Capter</a>'],
    ['#grow">Grow</a>', '#grow">Développer</a>'],
    ['>Case studies</a>', '>Études de cas</a>'],
    ['Inc. All rights reserved.', 'Inc. Tous droits réservés.'],
  ],

  "services.html": [
    ['<title>The TagVolt Engine — One system. Five stages.</title>', '<title>Le Moteur TagVolt — Un système. Cinq étapes.</title>'],
    ["content=\"Your website is only one piece. The system is the real asset. Here's exactly how each stage of the TagVolt Engine works — Attract, Capture, Respond, Convert, Grow — plus every service behind it.\"",
     'content="Votre site web n’est qu’une pièce. Le système est le véritable actif. Voici exactement comment fonctionne chaque étape du Moteur TagVolt — Attirer, Capter, Répondre, Convertir, Développer — et tous les services qui les soutiennent."'],
    ['<span class="pill-label">The TagVolt Engine</span>', '<span class="pill-label">Le Moteur TagVolt</span>'],
    ['<h1>One System. Five Stages.</h1>', '<h1>Un système. Cinq étapes.</h1>'],
    ["<p class=\"lead\">Your website is only one piece. The system is the real asset. Here's exactly how each stage works.</p>",
     '<p class="lead">Votre site web n’est qu’une pièce. Le système est le véritable actif. Voici exactement comment fonctionne chaque étape.</p>'],
    ['Get My Free Digital Audit →', 'Obtenir mon audit gratuit →'],
    ['>Everything we do<', '>Tout ce que nous faisons<'],

    ['<span class="num">01</span> Attract</span>', '<span class="num">01</span> Attirer</span>'],
    ['<span class="num">02</span> Capture</span>', '<span class="num">02</span> Capter</span>'],
    ['<span class="num">03</span> Respond</span>', '<span class="num">03</span> Répondre</span>'],
    ['<span class="num">04</span> Convert</span>', '<span class="num">04</span> Convertir</span>'],
    ['<span class="num">05</span> Grow</span>', '<span class="num">05</span> Développer</span>'],
    ['<h2>Get Discovered By The Right People.</h2>', '<h2>Faites-vous découvrir par les bonnes personnes.</h2>'],
    ['<h2>Turn Attention Into Actual Opportunities.</h2>', '<h2>Transformez l’attention en réelles occasions.</h2>'],
    ["<h2>Make Sure Opportunities Don't Sit Unanswered.</h2>", '<h2>Ne laissez aucune occasion sans réponse.</h2>'],
    ['<h2>Move Prospects Toward The Next Step.</h2>', '<h2>Menez les prospects vers la prochaine étape.</h2>'],
    ['<h2>Turn Your Digital System Into An Asset.</h2>', '<h2>Faites de votre système numérique un actif.</h2>'],

    ['<span>Website</span><span>Google Business Profile</span><span>Local SEO</span><span>Landing pages</span><span>Content</span>',
     '<span>Site web</span><span>Fiche d’établissement Google</span><span>SEO local</span><span>Pages d’atterrissage</span><span>Contenu</span>'],
    ['<span>Contact forms</span><span>Quote requests</span><span>Click-to-call</span><span>Lead capture</span><span>Tracking</span>',
     '<span>Formulaires de contact</span><span>Demandes de devis</span><span>Clic-pour-appeler</span><span>Captation de prospects</span><span>Suivi</span>'],
    ['<span>AI</span><span>SMS</span><span>Email</span><span>Automated responses</span><span>Lead qualification</span>',
     '<span>IA</span><span>SMS</span><span>Courriel</span><span>Réponses automatisées</span><span>Qualification des prospects</span>'],
    ['<span>Follow-ups</span><span>Appointment booking</span><span>Reminders</span><span>CRM</span><span>Lead nurturing</span>',
     '<span>Relances</span><span>Prise de rendez-vous</span><span>Rappels</span><span>CRM</span><span>Maturation des prospects</span>'],
    ['<span>Reputation</span><span>Reviews</span><span>Customer reactivation</span><span>Performance monitoring</span><span>Continuous optimization</span>',
     '<span>Réputation</span><span>Avis</span><span>Réactivation des clients</span><span>Suivi de la performance</span><span>Optimisation continue</span>'],

    ['<h2>Everything Your Business Needs To Work Better Online.</h2>', '<h2>Tout ce dont votre entreprise a besoin pour mieux performer en ligne.</h2>'],
    ['<h3>Web Design &amp; Development</h3>', '<h3>Conception et développement web</h3>'],
    ['<p>A professional website designed around your business goals — not just another online brochure. SSL, secure hosting setup, and regular backups included.</p>',
     '<p>Un site web professionnel conçu autour des objectifs de votre entreprise — pas une simple brochure en ligne. SSL, hébergement sécurisé et sauvegardes régulières inclus.</p>'],
    ['<h3>Local SEO &amp; Google Business Profile</h3>', '<h3>SEO local et fiche d’établissement Google</h3>'],
    ['<p>Google Business Profile optimization, local visibility, and the foundations needed to be found.</p>',
     '<p>Optimisation de la fiche d’établissement Google, visibilité locale et les fondations nécessaires pour être trouvé.</p>'],
    ['<h3>Marketing Automation</h3>', '<h3>Automatisation marketing</h3>'],
    ["<p>Connect your tools and automate repetitive tasks that shouldn't require your team's time.</p>",
     '<p>Connectez vos outils et automatisez les tâches répétitives qui ne devraient pas mobiliser le temps de votre équipe.</p>'],
    ['<h3>AI &amp; Virtual Assistants</h3>', '<h3>IA et assistants virtuels</h3>'],
    ['<p>AI-powered assistants and workflows that can respond, qualify and support your customers.</p>',
     '<p>Des assistants et des flux de travail propulsés par l’IA, capables de répondre à votre clientèle, de la qualifier et de la soutenir.</p>'],
    ['<h3>Lead Follow-Up</h3>', '<h3>Relance des prospects</h3>'],
    ["<p>Make sure inquiries don't disappear after the first contact.</p>", '<p>Faites en sorte qu’aucune demande ne disparaisse après le premier contact.</p>'],
    ['<h3>Social Media &amp; Community Management</h3>', '<h3>Réseaux sociaux et gestion de communauté</h3>'],
    ['<p>Consistent posting and engagement on your social channels, in the tone that fits your audience.</p>',
     '<p>Des publications et une interaction constantes sur vos réseaux sociaux, dans le ton qui convient à votre public.</p>'],
    ['<h3>GEO (AI Search Visibility)</h3>', '<h3>GEO (visibilité dans la recherche IA)</h3>'],
    ['<p>Structured data and AI-readable content so tools like ChatGPT, Perplexity and Google AI Overviews can find and cite your business.</p>',
     '<p>Des données structurées et un contenu lisible par l’IA pour que des outils comme ChatGPT, Perplexity et les aperçus IA de Google puissent trouver et citer votre entreprise.</p>'],
    ['<h3>Advertising</h3>', '<h3>Publicité</h3>'],
    ['<p>Google and Meta ad campaigns managed to bring in qualified traffic on top of your organic system.</p>',
     '<p>Des campagnes publicitaires Google et Meta gérées pour amener du trafic qualifié en plus de votre système organique.</p>'],
    ['<h3>Training</h3>', '<h3>Formation</h3>'],
    ["<p>Hands-on workshops for your team on the tools we set up — Google Business Profile, CRM basics, social media, or your website's admin panel.</p>",
     '<p>Des ateliers pratiques pour votre équipe sur les outils que nous mettons en place — fiche d’établissement Google, bases du CRM, réseaux sociaux ou le panneau d’administration de votre site.</p>'],

    ['<h2>See Where Your System Is Leaking <span class="text-orange">Opportunities</span>.</h2>',
     '<h2>Voyez où votre système laisse fuir des <span class="text-orange">occasions</span>.</h2>'],
    ['<p>A free 20-minute audit — no sales pitch, no obligation.</p>', '<p>Un audit gratuit de 20 minutes — aucun argumentaire de vente, aucun engagement.</p>'],
  ],

  "portfolio.html": [
    ["<title>Portfolio — Businesses we've helped run their digital side | TagVolt</title>",
     '<title>Réalisations — Des entreprises que nous avons aidées à gérer leur volet numérique | TagVolt</title>'],
    ['content="Different industries, same need: a digital system that works, without having to become a technical expert. Case studies from TagVolt."',
     'content="Des secteurs différents, un même besoin : un système numérique qui fonctionne, sans devoir devenir un expert technique. Études de cas de TagVolt."'],
    ['<span class="pill-label">Portfolio</span>', '<span class="pill-label">Réalisations</span>'],
    ["<h1>Businesses We've Helped Run Their Digital Side</h1>", '<h1>Des entreprises que nous avons aidées à gérer leur volet numérique</h1>'],
    ['<p class="lead">Different industries, same need: a digital system that works, without having to become a technical expert.</p>',
     '<p class="lead">Des secteurs différents, un même besoin : un système numérique qui fonctionne, sans devoir devenir un expert technique.</p>'],

    ['<span class="case__tag">Medical laboratory</span>', '<span class="case__tag">Laboratoire médical</span>'],
    ['<span class="case__tag">Local trades business</span>', '<span class="case__tag">Entreprise de métiers locale</span>'],
    ['<span class="case__tag">Specialized services</span>', '<span class="case__tag">Services spécialisés</span>'],
    ['<span class="case__tag">Community organization</span>', '<span class="case__tag">Organisme communautaire</span>'],
    ['<dt>Situation</dt>', '<dt>Situation</dt>'],
    ['<dt>System put in place</dt>', '<dt>Système mis en place</dt>'],
    ['<dt>Result</dt>', '<dt>Résultat</dt>'],
    ['<dd>Digital presence needed a full rebuild so the team could stay focused on patients, not on managing technology.</dd>',
     '<dd>La présence numérique devait être entièrement refaite pour que l’équipe reste concentrée sur les patients, pas sur la gestion de la technologie.</dd>'],
    ['<dd>Complete digital presence migration — new site, structure, and content foundation.</dd>',
     '<dd>Migration complète de la présence numérique — nouveau site, structure et fondation de contenu.</dd>'],
    ['<dd>A professional, fully migrated online presence. Performance tracking now underway for future reporting.</dd>',
     '<dd>Une présence en ligne professionnelle, entièrement migrée. Le suivi de la performance est maintenant en cours pour les rapports à venir.</dd>'],
    ["<dd>Web presence existed but didn't clearly push visitors toward calling or requesting a quote.</dd>",
     '<dd>La présence web existait mais n’incitait pas clairement les visiteurs à appeler ou à demander un devis.</dd>'],
    ['<dd>Call-focused site structure, click-to-call button, quote-request form, and local SEO foundations.</dd>',
     '<dd>Structure de site axée sur les appels, bouton clic-pour-appeler, formulaire de demande de devis et fondations de SEO local.</dd>'],
    ['<dd>A site built to generate calls, not just to exist. Lead volume tracking now underway.</dd>',
     '<dd>Un site conçu pour générer des appels, pas seulement pour exister. Le suivi du volume de prospects est maintenant en cours.</dd>'],
    ['<dd>Needed a digital presence that reflected the credibility of the organization from the first visit.</dd>',
     '<dd>Besoin d’une présence numérique qui reflète la crédibilité de l’organisation dès la première visite.</dd>'],
    ["<dd>Professional site design and structure aligned with the organization's expertise.</dd>",
     '<dd>Conception et structure de site professionnelles, alignées sur l’expertise de l’organisation.</dd>'],
    ['<dd>A professional presence that builds trust from the very first visit.</dd>',
     '<dd>Une présence professionnelle qui inspire confiance dès la toute première visite.</dd>'],
    ['<dd>Needed stronger visibility for the cause, without a traditional agency budget.</dd>',
     '<dd>Besoin d’une meilleure visibilité pour la cause, sans budget d’agence traditionnel.</dd>'],
    ["<dd>Cost-effective digital presence built around the organization's mission and story.</dd>",
     '<dd>Une présence numérique économique bâtie autour de la mission et de l’histoire de l’organisation.</dd>'],
    ['<dd>Stronger visibility for the cause, sustainable within a non-profit budget.</dd>',
     '<dd>Une meilleure visibilité pour la cause, viable dans un budget d’organisme sans but lucratif.</dd>'],

    ["<p class=\"lead\"><strong>We're building the next generation of digital systems for growing businesses.</strong></p>",
     '<p class="lead"><strong>Nous bâtissons la prochaine génération de systèmes numériques pour les entreprises en croissance.</strong></p>'],
    ['<p>As we take on more projects, this page will grow to include measurable results — response times, booked appointments, qualified inquiries — once the data is in.</p>',
     '<p>À mesure que nous prenons de nouveaux projets, cette page s’enrichira de résultats mesurables — temps de réponse, rendez-vous pris, demandes qualifiées — dès que les données seront disponibles.</p>'],
    ['<h2>Your Business Could Be Next</h2>', '<h2>Votre entreprise pourrait être la prochaine</h2>'],
    ["<p>Let's talk about what's worth delegating in your digital system.</p>", '<p>Parlons de ce qui vaut la peine d’être délégué dans votre système numérique.</p>'],
    ['Get My Free Digital Audit →', 'Obtenir mon audit gratuit →'],
  ],

  "pricing.html": [
    ['<title>Pricing — Two offers. One clear path forward. | TagVolt</title>', '<title>Tarifs — Deux offres. Un chemin clair. | TagVolt</title>'],
    ['content="Build the system, then keep it running. No confusing tiers, no guesswork. Build from $1,500 CAD; Operate from $797 CAD/mo."',
     'content="Bâtir le système, puis le maintenir. Aucun palier confus, aucune approximation. Bâtir à partir de 1 500 $ CA ; Opérer à partir de 797 $ CA/mois."'],
    ['<span class="pill-label">Pricing</span>', '<span class="pill-label">Tarifs</span>'],
    ['<h1>Two Offers. One Clear Path Forward.</h1>', '<h1>Deux offres. Un chemin clair.</h1>'],
    ['<p class="lead">Build the system, then keep it running. No confusing tiers, no guesswork.</p>',
     '<p class="lead">Bâtir le système, puis le maintenir. Aucun palier confus, aucune approximation.</p>'],

    ['<span class="plan__kicker">One-time — build your foundation</span>', '<span class="plan__kicker">Paiement unique — bâtir votre fondation</span>'],
    ['From $1,500 CAD\n', 'À partir de 1 500 $ CA\n'],
    ['<small>Typical range $1,500–$3,497 CAD, depending on scope — confirmed on your free audit</small>',
     '<small>Fourchette habituelle de 1 500 à 3 497 $ CA, selon l’ampleur — confirmée lors de votre audit gratuit</small>'],
    ['<span class="plan__tag">Build</span>', '<span class="plan__tag">Bâtir</span>'],
    ['<span><b>Website</b>built around your business goals, mobile-optimized</span>',
     '<span><b>Site web</b>bâti autour des objectifs de votre entreprise, optimisé pour mobile</span>'],
    ['<span><b>Google Business Profile</b>full setup and optimization</span>',
     '<span><b>Fiche d’établissement Google</b>configuration et optimisation complètes</span>'],
    ['<span><b>Essential integrations</b>lead capture, basic automation</span>',
     '<span><b>Intégrations essentielles</b>captation de prospects, automatisation de base</span>'],
    ['<span><b>Digital setup</b>the foundation everything else runs on</span>',
     '<span><b>Configuration numérique</b>la fondation sur laquelle tout le reste repose</span>'],
    ['<p class="plan__note">Delivered in 30 days — or you get 2 weeks of Operate free.</p>',
     '<p class="plan__note">Livré en 30 jours — sinon vous obtenez 2 semaines d’Opérer gratuites.</p>'],
    ['<a class="btn btn--primary" href="contact.html">Start Your Build</a>', '<a class="btn btn--primary" href="contact.html">Démarrer votre projet</a>'],

    ['<span class="plan__kicker">Recurring — keep it running</span>', '<span class="plan__kicker">Récurrent — le maintenir en marche</span>'],
    ['From $797 CAD/mo\n', 'À partir de 797 $ CA/mois\n'],
    ['<small>3-month minimum commitment, then cancel anytime</small>', '<small>Engagement minimum de 3 mois, puis annulable en tout temps</small>'],
    ['<span class="plan__tag">Operate</span>', '<span class="plan__tag">Opérer</span>'],
    ['<span><b>Website management</b>hosting, monthly updates</span>', '<span><b>Gestion du site web</b>hébergement, mises à jour mensuelles</span>'],
    ['<span><b>Google &amp; local visibility</b>ongoing monitoring</span>', '<span><b>Google et visibilité locale</b>surveillance continue</span>'],
    ['<span><b>Automation monitoring</b>lead follow-up, sequence adjustments</span>',
     '<span><b>Surveillance de l’automatisation</b>relance des prospects, ajustements de séquences</span>'],
    ['<span><b>Content support &amp; performance reporting</b>continuous improvements</span>',
     '<span><b>Soutien au contenu et rapports de performance</b>améliorations continues</span>'],
    ["<p class=\"plan__note\">One monthly report — what came in, what we fixed, what's next.</p>",
     '<p class="plan__note">Un rapport mensuel — ce qui est entré, ce que nous avons corrigé, la suite.</p>'],
    ['<a class="btn btn--primary" href="contact.html">Talk to TagVolt</a>', '<a class="btn btn--primary" href="contact.html">Parler à TagVolt</a>'],

    ['<span class="num">—</span> Build — exact scope</span>', '<span class="num">—</span> Bâtir — portée exacte</span>'],
    ['<h2>What\'s Included In Build, Precisely</h2>', '<h2>Ce qui est inclus dans Bâtir, précisément</h2>'],
    ["<p>So there's no ambiguity about what your starting price covers — and what's a separate, quoted add-on.</p>",
     '<p>Pour qu’il n’y ait aucune ambiguïté sur ce que couvre votre prix de départ — et sur ce qui constitue un ajout distinct, sur devis.</p>'],
    ['<h3>Included</h3>', '<h3>Inclus</h3>'],
    ['<h3>Not included — quoted separately</h3>', '<h3>Non inclus — sur devis distinct</h3>'],
    ['Simple brochure site or a high-converting landing page', 'Site vitrine simple ou page d’atterrissage à forte conversion'],
    ['Up to 5 clearly defined pages', 'Jusqu’à 5 pages clairement définies'],
    ['Contact form or quote-request form', 'Formulaire de contact ou de demande de devis'],
    ['Click-to-call button', 'Bouton clic-pour-appeler'],
    ['Google Business Profile: creation, claim, or optimization', 'Fiche d’établissement Google : création, revendication ou optimisation'],
    ['Simple automated email acknowledgment', 'Accusé de réception automatisé simple par courriel'],
    ['New-lead notifications', 'Notifications de nouveaux prospects'],
    ['60-minute onboarding / training session', 'Séance d’intégration / de formation de 60 minutes'],
    ['Live within 30 days of receiving access, content, and approvals', 'En ligne dans les 30 jours suivant la réception des accès, du contenu et des approbations'],
    ['E-commerce functionality', 'Fonctionnalité de commerce en ligne'],
    ['More than 5 pages', 'Plus de 5 pages'],
    ['Full copywriting for every page', 'Rédaction complète de chaque page'],
    ['Photography and video production', 'Production photo et vidéo'],
    ['Google/Meta advertising and ad spend', 'Publicité Google/Meta et budget publicitaire'],
    ['Complex CRM setup', 'Configuration de CRM complexe'],
    ['AI voice agent', 'Agent vocal IA'],
    ['Custom third-party integrations', 'Intégrations tierces sur mesure'],
    ['Ongoing SEO campaigns beyond local basics', 'Campagnes de SEO continues au-delà des bases locales'],
    ['Daily social media management', 'Gestion quotidienne des réseaux sociaux'],

    ['<span class="num">—</span> Custom</span>', '<span class="num">—</span> Sur mesure</span>'],
    ['<h2>Need Something Bigger?</h2>', '<h2>Besoin de plus grand?</h2>'],
    ['<h3>CRM implementation &amp; AI receptionist</h3>', '<h3>Implantation de CRM et réceptionniste IA</h3>'],
    ['<p>Full CRM rollout, or an automated phone line that answers, qualifies and routes calls.</p>',
     '<p>Déploiement complet d’un CRM, ou une ligne téléphonique automatisée qui répond, qualifie et achemine les appels.</p>'],
    ['<h3>Advanced automation &amp; advertising</h3>', '<h3>Automatisation avancée et publicité</h3>'],
    ['<p>Multi-location systems, custom integrations, or managed Google/Meta ad campaigns.</p>',
     '<p>Systèmes multi-établissements, intégrations sur mesure ou campagnes publicitaires Google/Meta gérées.</p>'],
    ['<h3>Social media management</h3>', '<h3>Gestion des réseaux sociaux</h3>'],
    ['<p>Regular posting and engagement on your social channels, in English or French — on top of Operate.</p>',
     '<p>Publications et interaction régulières sur vos réseaux sociaux, en français ou en anglais — en plus d’Opérer.</p>'],
    ['<h3>Team training &amp; workshops</h3>', '<h3>Formation d’équipe et ateliers</h3>'],
    ["<p>Hands-on training for your staff on the tools we set up — Google Business Profile, CRM basics, social media, or your website's admin panel.</p>",
     '<p>Formation pratique pour votre personnel sur les outils que nous mettons en place — fiche d’établissement Google, bases du CRM, réseaux sociaux ou le panneau d’administration de votre site.</p>'],
    ['>Scoped on your free audit<', '>Défini lors de votre audit gratuit<'],
    ['>From $297/mo — 4–8 posts/month<', '>À partir de 297 $/mois — 4 à 8 publications/mois<'],
    ['>From $350/session — up to 2 hours, in-person or virtual<', '>À partir de 350 $/séance — jusqu’à 2 heures, en personne ou virtuel<'],

    ['<span class="num">—</span> Let\'s Talk</span>', '<span class="num">—</span> Parlons-en</span>'],
    ['<h2>Not Sure Which One Fits?</h2>', '<h2>Vous ne savez pas laquelle choisir?</h2>'],
    ['<p>Most businesses start with a free audit, then Build, then add Operate once the foundation is live.</p>',
     '<p>La plupart des entreprises commencent par un audit gratuit, puis Bâtir, puis ajoutent Opérer une fois la fondation en ligne.</p>'],
    ['Get My Free Digital Audit →', 'Obtenir mon audit gratuit →'],
  ],

  "about.html": [
    ['<title>About — Your digital department, without hiring one | TagVolt</title>',
     '<title>À propos — Votre département numérique, sans avoir à l’embaucher | TagVolt</title>'],
    ["content=\"TagVolt was founded in Edmonton, Alberta, on a simple idea: businesses shouldn't have to become technical experts, or coordinate five different freelancers, to have a digital presence that works.\"",
     'content="TagVolt a été fondée à Edmonton, en Alberta, sur une idée simple : une entreprise ne devrait pas avoir à devenir experte en technologie, ni à coordonner cinq pigistes différents, pour avoir une présence numérique qui fonctionne."'],
    ['<span class="pill-label">About</span>', '<span class="pill-label">À propos</span>'],
    ['<h1>Your Digital Department, Without Hiring One</h1>', '<h1>Votre département numérique, sans avoir à l’embaucher</h1>'],
    ["<p class=\"lead\">TagVolt was founded in Edmonton, Alberta, on a simple idea: businesses shouldn't have to become technical experts, or coordinate five different freelancers, to have a digital presence that works.</p>",
     '<p class="lead">TagVolt a été fondée à Edmonton, en Alberta, sur une idée simple : une entreprise ne devrait pas avoir à devenir experte en technologie, ni à coordonner cinq pigistes différents, pour avoir une présence numérique qui fonctionne.</p>'],
    ['<span class="num">—</span> Why TagVolt exists</span>', '<span class="num">—</span> Pourquoi TagVolt existe</span>'],
    ['<h2>Why TagVolt Exists</h2>', '<h2>Pourquoi TagVolt existe</h2>'],
    ["<p>You don't need another freelancer. You don't need five different agencies. You don't need to become an expert in websites, SEO, CRM, AI and automation. You need someone who can connect it all and take responsibility for keeping it working.</p>",
     '<p>Vous n’avez pas besoin d’un pigiste de plus. Vous n’avez pas besoin de cinq agences différentes. Vous n’avez pas besoin de devenir un expert des sites web, du SEO, du CRM, de l’IA et de l’automatisation. Vous avez besoin de quelqu’un qui relie le tout et assume la responsabilité de le faire fonctionner.</p>'],
    ['<p>TagVolt acts as your external digital department: we build the system, connect the tools, monitor it, and improve it — in English or French. <strong>You run your business. We run the digital side.</strong></p>',
     '<p>TagVolt agit comme votre département numérique externe : nous bâtissons le système, connectons les outils, le surveillons et l’améliorons — en français ou en anglais. <strong>Vous dirigez votre entreprise. Nous gérons le volet numérique.</strong></p>'],

    ['<span class="num">—</span> How it works</span>', '<span class="num">—</span> Comment ça fonctionne</span>'],
    ['<h2>Simple For You. Structured Behind The Scenes.</h2>', '<h2>Simple pour vous. Structuré en coulisses.</h2>'],
    ["<h3>We audit</h3><p>We look at your current digital presence and identify where you're losing opportunities.</p>",
     '<h3>Nous auditons</h3><p>Nous examinons votre présence numérique actuelle et repérons où vous perdez des occasions.</p>'],
    ['<h3>We build</h3><p>We fix the fundamentals and build the systems your business actually needs.</p>',
     '<h3>Nous bâtissons</h3><p>Nous corrigeons les fondamentaux et bâtissons les systèmes dont votre entreprise a réellement besoin.</p>'],
    ['<h3>We connect</h3><p>Your website, Google, leads, communication and automation start working together.</p>',
     '<h3>Nous connectons</h3><p>Votre site web, Google, vos prospects, vos communications et l’automatisation se mettent à travailler ensemble.</p>'],
    ['<h3>We manage</h3><p>We monitor, maintain and improve the system month after month.</p>',
     '<h3>Nous gérons</h3><p>Nous surveillons, entretenons et améliorons le système mois après mois.</p>'],
    ["<h3>You focus on your business</h3><p>You don't have to become the person responsible for your digital infrastructure.</p>",
     '<h3>Vous vous concentrez sur votre entreprise</h3><p>Vous n’avez pas à devenir la personne responsable de votre infrastructure numérique.</p>'],

    ['<h2>Built For Businesses That Want Their Digital Presence To Do More</h2>',
     '<h2>Conçu pour les entreprises qui veulent que leur présence numérique en fasse plus</h2>'],
    ["<p>We work particularly well with businesses that depend on local visibility, calls, quote requests, appointments, or online leads — and if your business doesn't fit a category, that's fine. We'll look at your system first.</p>",
     '<p>Nous travaillons particulièrement bien avec les entreprises qui dépendent de la visibilité locale, des appels, des demandes de devis, des rendez-vous ou des prospects en ligne — et si votre entreprise n’entre dans aucune catégorie, ce n’est pas grave. Nous regarderons d’abord votre système.</p>'],
    ['<h3>Local Services</h3><p>HVAC · Plumbing · Roofing · Electrical · Cleaning · Landscaping · Construction</p>',
     '<h3>Services locaux</h3><p>CVC · Plomberie · Toiture · Électricité · Nettoyage · Aménagement paysager · Construction</p>'],
    ['<h3>Professional Services</h3><p>Consultants · Accountants · Lawyers · Agencies · Advisors</p>',
     '<h3>Services professionnels</h3><p>Consultants · Comptables · Avocats · Agences · Conseillers</p>'],
    ['<h3>Health &amp; Wellness</h3><p>Clinics · Dental · Wellness · Specialized services</p>',
     '<h3>Santé et bien-être</h3><p>Cliniques · Dentaire · Bien-être · Services spécialisés</p>'],
    ['<h3>Local Businesses</h3><p>Restaurants · Retail · Hospitality · Community organizations</p>',
     '<h3>Commerces locaux</h3><p>Restaurants · Commerce de détail · Hôtellerie · Organismes communautaires</p>'],

    ['<span class="num">—</span> From disconnected tools to one system</span>', '<span class="num">—</span> Des outils déconnectés à un seul système</span>'],
    ['<h2>From Disconnected Tools To One System</h2>', '<h2>Des outils déconnectés à un seul système</h2>'],
    ['>Before</h4>', '>Avant</h4>'],
    ['>After</h4>', '>Après</h4>'],
    ['<p style="margin-top:10px">Website · Google · Facebook · Email · Phone · CRM · Spreadsheets · Manual follow-ups</p>',
     '<p style="margin-top:10px">Site web · Google · Facebook · Courriel · Téléphone · CRM · Feuilles de calcul · Relances manuelles</p>'],
    ['<p style="margin-top:10px">One connected digital system<br />Attract → Capture → Respond → Convert → Grow</p>',
     '<p style="margin-top:10px">Un système numérique connecté<br />Attirer → Capter → Répondre → Convertir → Développer</p>'],

    ['<span class="num">—</span> Why TagVolt</span>', '<span class="num">—</span> Pourquoi TagVolt</span>'],
    ['<h2>What Makes This Different.</h2>', '<h2>Ce qui rend notre approche différente.</h2>'],
    ['<h3>One point of contact</h3><p>Stop coordinating multiple freelancers and platforms.</p>',
     '<h3>Un seul point de contact</h3><p>Arrêtez de coordonner plusieurs pigistes et plateformes.</p>'],
    ["<h3>Built around your business</h3><p>We don't install random tools. We build around what you actually need.</p>",
     '<h3>Bâti autour de votre entreprise</h3><p>Nous n’installons pas des outils au hasard. Nous bâtissons autour de ce dont vous avez réellement besoin.</p>'],
    ['<h3>Human + AI</h3><p>Technology handles repetitive work. You keep control.</p>',
     '<h3>Humain + IA</h3><p>La technologie s’occupe du travail répétitif. Vous gardez le contrôle.</p>'],
    ['<h3>Bilingual</h3><p>Service available in English and French, based in Edmonton, serving all of Alberta.</p>',
     '<h3>Bilingue</h3><p>Service offert en français et en anglais, établi à Edmonton, au service de toute l’Alberta.</p>'],
    ["<h3>No digital jargon</h3><p>You shouldn't need a technical degree to understand what we're doing.</p>",
     '<h3>Aucun jargon numérique</h3><p>Vous ne devriez pas avoir besoin d’un diplôme technique pour comprendre ce que nous faisons.</p>'],
    ["<h3>Long-term partnership</h3><p>We don't disappear after launching your website.</p>",
     '<h3>Partenariat à long terme</h3><p>Nous ne disparaissons pas après le lancement de votre site.</p>'],

    ['<span class="num">—</span> The team</span>', '<span class="num">—</span> L’équipe</span>'],
    ["<h2>Who You'll Work With</h2>", '<h2>Avec qui vous travaillerez</h2>'],
    ['<p class="lead">Every client works with a small, accountable team — no hand-offs between departments, no losing context along the way.</p>',
     '<p class="lead">Chaque client travaille avec une petite équipe responsable — aucun transfert entre départements, aucune perte de contexte en cours de route.</p>'],
    ['Founder &amp; Lead Strategist', 'Fondateur et stratège principal'],
    ['[Name to confirm]', '[Nom à confirmer]'],
    ['Automation &amp; AI Lead', 'Responsable automatisation et IA'],
    ['Growth &amp; Content Lead', 'Responsable croissance et contenu'],
    ['<p>Oversees every engagement end to end — audit, build, and client relationships.</p>',
     '<p>Supervise chaque mandat du début à la fin — audit, réalisation et relations clients.</p>'],
    ['<p>Owns the Respond and Convert stages — CRM, automation, and AI workflows.</p>',
     '<p>Responsable des étapes Répondre et Convertir — CRM, automatisation et flux de travail IA.</p>'],
    ['<p>Owns the Grow stage — reputation, content, and performance monitoring.</p>',
     '<p>Responsable de l’étape Développer — réputation, contenu et suivi de la performance.</p>'],

    ['<h2 style="color:var(--ink)">Let\'s Talk About Your Project</h2>', '<h2 style="color:var(--ink)">Parlons de votre projet</h2>'],
    ['<p style="color:var(--body)">A free 20-minute audit — no sales pitch, no obligation.</p>',
     '<p style="color:var(--body)">Un audit gratuit de 20 minutes — aucun argumentaire de vente, aucun engagement.</p>'],
    ['Get My Free Digital Audit →', 'Obtenir mon audit gratuit →'],
  ],

  "contact.html": [
    ['<title>Contact — Get your free digital audit | TagVolt</title>', '<title>Contact — Obtenez votre audit numérique gratuit | TagVolt</title>'],
    ["content=\"20 minutes. No pressure. No obligation. We'll look at your website, Google visibility, lead capture, follow-up, and automation opportunities — then tell you what we'd fix first.\"",
     'content="20 minutes. Sans pression. Sans engagement. Nous examinons votre site web, votre visibilité Google, la captation de prospects, la relance et les occasions d’automatisation — puis nous vous disons quoi corriger en premier."'],
    ['<span class="pill-label">Contact</span>', '<span class="pill-label">Contact</span>'],
    ['<h1>Get Your Free Digital Audit</h1>', '<h1>Obtenez votre audit numérique gratuit</h1>'],
    ["<p class=\"lead\">20 minutes. No pressure. No obligation. We'll look at your website, Google visibility, lead capture, follow-up, and automation opportunities — then tell you what we'd fix first.</p>",
     '<p class="lead">20 minutes. Sans pression. Sans engagement. Nous examinons votre site web, votre visibilité Google, la captation de prospects, la relance et les occasions d’automatisation — puis nous vous disons quoi corriger en premier.</p>'],
    ['<span class="eyebrow"><span class="num">—</span> Free Lead Leak Audit</span>', '<span class="eyebrow"><span class="num">—</span> Audit gratuit des fuites de prospects</span>'],
    ['<h2>Request Your Free Digital Audit</h2>', '<h2>Demandez votre audit numérique gratuit</h2>'],
    ["<p>We call it the Lead Leak Audit — because that's what we're looking for: where your visibility, response, or follow-up is leaking opportunities. Tell us about your business before your call, and we'll show you exactly what to fix, live.</p>",
     '<p>Nous l’appelons l’audit des fuites de prospects — parce que c’est ce que nous cherchons : là où votre visibilité, vos réponses ou vos relances laissent fuir des occasions. Parlez-nous de votre entreprise avant l’appel, et nous vous montrerons exactement quoi corriger, en direct.</p>'],
    ['>Address</h4>', '>Adresse</h4>'],
    ['>Phone</h4>', '>Téléphone</h4>'],
    ['>Email</h4>', '>Courriel</h4>'],
    ['>Service area</h4>', '>Zone de service</h4>'],
    ['<p style="font-size:.95rem;margin-top:6px">Across Alberta — virtual meetings available</p>',
     '<p style="font-size:.95rem;margin-top:6px">Partout en Alberta — rencontres virtuelles disponibles</p>'],
    ["<div class=\"form-success\" role=\"status\">Thanks — your request is in. We'll reply within one business day to book your 20-minute audit.</div>",
     '<div class="form-success" role="status">Merci — votre demande est reçue. Nous répondrons en un jour ouvrable pour planifier votre audit de 20 minutes.</div>'],
    ['value="New Lead Leak Audit request — tagvolt.com"', 'value="Nouvelle demande d’audit des fuites de prospects — tagvolt.com"'],
    ['value="TagVolt website"', 'value="Site web TagVolt"'],
    ['<label>Leave this field empty ', '<label>Laissez ce champ vide '],
    ['<label for="name">Full name <span class="req">*</span></label>', '<label for="name">Nom complet <span class="req">*</span></label>'],
    ['<label for="email">Email <span class="req">*</span></label>', '<label for="email">Courriel <span class="req">*</span></label>'],
    ['<label for="phone">Phone</label>', '<label for="phone">Téléphone</label>'],
    ['<label for="business">Business name <span class="req">*</span></label>', '<label for="business">Nom de l’entreprise <span class="req">*</span></label>'],
    ['<label for="website">Website (optional)</label>', '<label for="website">Site web (facultatif)</label>'],
    ['<label for="social">Social media links</label>', '<label for="social">Liens vers les réseaux sociaux</label>'],
    ['<label for="message">Tell us about your business <span class="req">*</span></label>',
     '<label for="message">Parlez-nous de votre entreprise <span class="req">*</span></label>'],
    ['<button class="btn btn--primary btn--lg" type="submit">Send &amp; Request My Audit</button>',
     '<button class="btn btn--primary btn--lg" type="submit">Envoyer et demander mon audit</button>'],
    ['<p class="form__note">Prefer email? <a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a>. We reply within one business day.</p>',
     '<p class="form__note">Vous préférez le courriel? <a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a>. Nous répondons en un jour ouvrable.</p>'],
  ],

  "privacy.html": [
    ['<title>Privacy Policy | TagVolt</title>', '<title>Politique de confidentialité | TagVolt</title>'],
    ['content="How TagVolt collects, uses and protects your information."',
     'content="Comment TagVolt recueille, utilise et protège vos renseignements."'],
    [' / Privacy Policy</p>', ' / Politique de confidentialité</p>'],
    ['<h1>Privacy Policy</h1>', '<h1>Politique de confidentialité</h1>'],
    ['<p class="lead">Last updated: <span data-year>2026</span></p>', '<p class="lead">Dernière mise à jour : <span data-year>2026</span></p>'],
    ["<p><strong>This is a placeholder.</strong> Replace it with a policy reviewed for your jurisdiction (Alberta PIPA and Canada's PIPEDA) before launch.</p>",
     '<p><strong>Ceci est un espace réservé.</strong> Remplacez-le par une politique révisée pour votre juridiction (la PIPA de l’Alberta et la LPRPDE du Canada) avant le lancement.</p>'],
    ['<h2>What we collect</h2>', '<h2>Ce que nous recueillons</h2>'],
    ['<p>Information you submit through our forms (name, email, phone, business details) and standard analytics about how the site is used.</p>',
     '<p>Les renseignements que vous soumettez par nos formulaires (nom, courriel, téléphone, détails de l’entreprise) et des données analytiques standard sur l’utilisation du site.</p>'],
    ['<h2>How we use it</h2>', '<h2>Comment nous les utilisons</h2>'],
    ['<p>To respond to your request, prepare your free audit, and improve our services. We do not sell your personal information.</p>',
     '<p>Pour répondre à votre demande, préparer votre audit gratuit et améliorer nos services. Nous ne vendons pas vos renseignements personnels.</p>'],
    ['<h2>Your data</h2>', '<h2>Vos données</h2>'],
    ['<p>Your website, leads, customer data and business assets remain yours. You can ask us to access, correct or delete the information we hold about you.</p>',
     '<p>Votre site web, vos prospects, vos données clients et vos actifs d’entreprise vous appartiennent. Vous pouvez nous demander d’accéder aux renseignements que nous détenons à votre sujet, de les corriger ou de les supprimer.</p>'],
    ['<h2>Contact</h2>', '<h2>Contact</h2>'],
    ['<p>Questions about privacy: <a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a> · 226 - 8525 106A Avenue NW, Edmonton, AB T5H 0K1.</p>',
     '<p>Questions sur la confidentialité : <a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a> · 226 - 8525 106A Avenue NW, Edmonton, AB T5H 0K1.</p>'],
  ],

  "terms.html": [
    ['<title>Terms of Service | TagVolt</title>', '<title>Conditions d’utilisation | TagVolt</title>'],
    ['content="The terms that govern use of the TagVolt website and services."',
     'content="Les conditions qui régissent l’utilisation du site web et des services de TagVolt."'],
    [' / Terms of Service</p>', ' / Conditions d’utilisation</p>'],
    ['<h1>Terms of Service</h1>', '<h1>Conditions d’utilisation</h1>'],
    ['<p class="lead">Last updated: <span data-year>2026</span></p>', '<p class="lead">Dernière mise à jour : <span data-year>2026</span></p>'],
    ['<p><strong>This is a placeholder.</strong> Replace it with terms reviewed by counsel before launch.</p>',
     '<p><strong>Ceci est un espace réservé.</strong> Remplacez-le par des conditions révisées par un conseiller juridique avant le lancement.</p>'],
    ['<h2>Services</h2>', '<h2>Services</h2>'],
    ['<p>TagVolt provides website, local SEO, automation, AI and lead follow-up services as described in a written scope confirmed after your free audit.</p>',
     '<p>TagVolt fournit des services de site web, de SEO local, d’automatisation, d’IA et de relance des prospects, tels que décrits dans une portée écrite confirmée après votre audit gratuit.</p>'],
    ['<h2>Payment</h2>', '<h2>Paiement</h2>'],
    ['<p>Build is a one-time fee; Operate is billed monthly with a 3-month minimum commitment, then continues month to month until cancelled.</p>',
     '<p>Bâtir est un frais unique ; Opérer est facturé mensuellement avec un engagement minimum de 3 mois, puis se poursuit de mois en mois jusqu’à annulation.</p>'],
    ['<h2>Ownership</h2>', '<h2>Propriété</h2>'],
    ['<p>On full payment, your website, content, accounts and data are yours. We retain the right to reference the work in our portfolio unless you ask us not to.</p>',
     '<p>Une fois le paiement complet reçu, votre site web, votre contenu, vos comptes et vos données vous appartiennent. Nous conservons le droit de mentionner le travail dans nos réalisations, sauf demande contraire de votre part.</p>'],
    ['<h2>Liability</h2>', '<h2>Responsabilité</h2>'],
    ['<p>Services are provided on a commercially reasonable basis. We are not liable for outcomes outside our control, including third-party platform changes.</p>',
     '<p>Les services sont fournis selon des efforts commercialement raisonnables. Nous ne sommes pas responsables des résultats hors de notre contrôle, y compris les modifications des plateformes tierces.</p>'],
    ['<h2>Contact</h2>', '<h2>Contact</h2>'],
    ['<p>Questions about these terms: <a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a>.</p>',
     '<p>Questions sur ces conditions : <a href="mailto:hello@tagvolt.com">hello@tagvolt.com</a>.</p>'],
  ],
};

/* =====================================================================
   3. Transforms
   ===================================================================== */
function apply(list, html) {
  // longest find first, so short strings never clip a longer match
  const sorted = [...list].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) html = html.split(from).join(to);
  return html;
}

function toggleToFr(html) {
  return html
    .split('<button type="button" data-lang="en" aria-pressed="true">EN</button>')
    .join('<button type="button" data-lang="en" aria-pressed="false">EN</button>')
    .split('<button type="button" data-lang="fr" aria-pressed="false">FR</button>')
    .join('<button type="button" data-lang="fr" aria-pressed="true">FR</button>');
}

function hreflang(enHref, frHref, xDefault) {
  return (
    `<link rel="alternate" hreflang="en" href="${enHref}" />\n` +
    `<link rel="alternate" hreflang="fr" href="${frHref}" />\n` +
    `<link rel="alternate" hreflang="x-default" href="${xDefault}" />\n`
  );
}
function injectHead(html, block) {
  if (html.includes('rel="alternate" hreflang=')) {
    html = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\r?\n/g, "");
  }
  return html.replace("</head>", block + "</head>");
}

// Clean, extensionless URL for a page (index.html -> "/", services.html -> "/services").
const NAMED = "services|portfolio|pricing|about|contact|privacy|terms";
function cleanEn(page) { return page === "index.html" ? "/" : "/" + page.replace(/\.html$/, ""); }
function cleanFr(page) { return page === "index.html" ? "/fr/" : "/fr/" + page.replace(/\.html$/, ""); }

async function build() {
  let wrote = 0, patched = 0;

  for (const page of ROOT_PAGES) {
    const enPath = join(ROOT, page);
    let en = (await readFile(enPath, "utf8")).replace(/\r\n/g, "\n");

    // hreflang block — identical on both locales (root-relative clean URLs)
    const alt = hreflang(cleanEn(page), cleanFr(page), cleanEn(page));

    // 1) English page: add / refresh hreflang
    const enPatched = injectHead(en, alt);
    if (enPatched !== en) { await writeFile(enPath, enPatched); en = enPatched; patched++; }

    // 2) French page
    let fr = en;
    fr = fr.replace('<html lang="en">', '<html lang="fr">');
    fr = fr.replace(/(href|src)="assets\//g, '$1="../assets/');
    fr = fr.replace(/(href|src)="ressources\//g, '$1="../ressources/');
    fr = fr.replace(/url\((['"]?)assets\//g, 'url($1../assets/');
    fr = fr.replace(/url\((['"]?)ressources\//g, 'url($1../ressources/');
    fr = toggleToFr(fr);
    fr = apply(COMMON, fr);
    fr = apply(PAGES[page] || [], fr);
    // point same-site links at the French tree
    fr = fr.replace(new RegExp('href="/(' + NAMED + ')(#[a-zA-Z-]+)?"', "g"), 'href="/fr/$1$2"');
    fr = fr.replace(/href="\/"/g, 'href="/fr/"');
    fr = injectHead(fr, alt);
    const outPath = join(ROOT, "fr", page);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, fr);
    wrote++;
  }

  // Keep the WordPress theme's bundled design assets in sync with the site.
  const themeAssets = join(ROOT, "wordpress", "tagvolt-blog", "assets");
  const bundle = [
    ["assets/css/style.css", "css/style.css"],
    ["assets/js/main.js", "js/main.js"],
    ["assets/img/logo.png", "img/logo.png"],
    ["assets/img/favicon.png", "img/favicon.png"],
    ["assets/img/hub-mark.png", "img/hub-mark.png"],
  ];
  let bundled = 0;
  try {
    for (const [src, dst] of bundle) {
      const out = join(themeAssets, dst);
      await mkdir(dirname(out), { recursive: true });
      await copyFile(join(ROOT, src), out);
      bundled++;
    }
  } catch (e) { /* theme folder may not exist in every checkout */ }

  console.log(`fr build: wrote ${wrote} fr/ pages, patched ${patched} EN pages, + ${bundled} theme assets`);
}

build().catch((e) => { console.error(e); process.exit(1); });
