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

/* ---- pages: [source, frOutput, depth] (depth = folders below root) ---- */
const ROOT_PAGES = [
  "index.html", "services.html", "portfolio.html", "pricing.html",
  "about.html", "contact.html", "blog.html", "privacy.html", "terms.html",
];
const BLOG_POSTS = [
  "blog/local-seo-canadian-smbs.html",
  "blog/automating-lead-followup.html",
  "blog/bilingual-competitive-advantage.html",
  "blog/_template.html",
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
    ['<title>TagVolt — Your Digital Department</title>', '<title>TagVolt — Votre département numérique</title>'],
    ['content="TagVolt — Your Digital Department"', 'content="TagVolt — Votre département numérique"'],
    ['content="TagVolt helps growing businesses build, manage and improve the digital systems behind their business — websites, Google, automation, AI and lead follow-up. One team. One system. One point of contact, in English or French."',
     'content="TagVolt aide les entreprises en croissance à bâtir, gérer et améliorer les systèmes numériques derrière leur entreprise — sites web, Google, automatisation, IA et relance des prospects. Une équipe. Un système. Un seul point de contact, en français ou en anglais."'],
    ['content="One team runs the website, Google, automation, AI and lead follow-up behind your business."',
     'content="Une équipe pilote le site web, Google, l’automatisation, l’IA et la relance des prospects derrière votre entreprise."'],

    ['<p class="kicker">Your business deserves more than a website</p>',
     '<p class="kicker">Votre entreprise mérite mieux qu’un simple site web</p>'],
    ['<h1>Build A Digital System That <span class="text-blue">Works For You.</span></h1>',
     '<h1>Bâtissez un système numérique qui <span class="text-blue">travaille pour vous.</span></h1>'],
    ['<p class="lead">TagVolt helps growing businesses build, manage and improve the digital systems behind their business — websites, Google, automation, AI and lead follow-up. One team. One system. One point of contact, in English or French.</p>',
     '<p class="lead">TagVolt aide les entreprises en croissance à bâtir, gérer et améliorer les systèmes numériques derrière leur entreprise — sites web, Google, automatisation, IA et relance des prospects. Une équipe. Un système. Un seul point de contact, en français ou en anglais.</p>'],
    ['Get My Free Digital Audit', 'Obtenir mon audit gratuit'],
    ['See the TagVolt Engine', 'Voir le Moteur TagVolt'],
    ['<li>20 minutes</li>', '<li>20 minutes</li>'],
    ['<li>No pressure</li>', '<li>Sans pression</li>'],
    ['<li>No obligation</li>', '<li>Sans engagement</li>'],
    ['<li>Bilingual — EN / FR</li>', '<li>Bilingue — FR / EN</li>'],
    ['alt="The TagVolt Engine: a five-stage cycle — 1. Attract (high-converting website &amp; SEO), 2. Capture (smart forms, calls &amp; instant quotes), 3. Respond (AI automated responses to qualify leads), 4. Convert (automated follow-ups &amp; appointments booked), 5. Grow (reviews, reactivation &amp; long-term relationships)."',
     'alt="Le Moteur TagVolt : un cycle en cinq étapes — 1. Attirer (site web et SEO à forte conversion), 2. Capter (formulaires intelligents, appels et devis instantanés), 3. Répondre (réponses automatisées par IA pour qualifier les prospects), 4. Convertir (relances automatisées et rendez-vous pris), 5. Développer (avis, réactivation et relations à long terme)."'],

    ['<h2>Your Business Is Working.<br />But Is Your <span class="text-orange">Digital System?</span></h2>',
     '<h2>Votre entreprise fonctionne.<br />Mais votre <span class="text-orange">système numérique?</span></h2>'],
    ['<p>Your website exists. You have a Google profile. You receive inquiries.<br />But somehow, everything feels disconnected.</p>',
     '<p>Votre site web existe. Vous avez une fiche Google. Vous recevez des demandes.<br />Mais tout semble déconnecté.</p>'],
    ['<p class="pcard__t">A visitor leaves without acting</p>', '<p class="pcard__t">Un visiteur repart sans agir</p>'],
    ['<p class="pcard__t">A message waits for a reply</p>', '<p class="pcard__t">Un message attend une réponse</p>'],
    ['<p class="pcard__t">A call comes in while you&rsquo;re busy</p>', '<p class="pcard__t">Un appel entre pendant que vous êtes occupé</p>'],
    ['<p class="pcard__t">A lead gets forgotten &mdash; and becomes someone else&rsquo;s customer</p>',
     '<p class="pcard__t">Un prospect est oublié &mdash; et devient le client de quelqu’un d’autre</p>'],
    ['<p>The problem isn&rsquo;t necessarily your business.<br /><span class="problem__note-strong">It&rsquo;s the <span class="text-blue">system behind it</span>.</span></p>',
     '<p>Le problème n’est pas nécessairement votre entreprise.<br /><span class="problem__note-strong">C’est le <span class="text-blue">système derrière elle</span>.</span></p>'],

    ['<span class="eyebrow"><span class="num">—</span> Meet TagVolt</span>', '<span class="eyebrow"><span class="num">—</span> Découvrez TagVolt</span>'],
    ['<h2>Your Digital Department<br /> Without Hiring One.</h2>', '<h2>Votre département numérique<br /> sans avoir à l’embaucher.</h2>'],
    ["<p>You don't need another freelancer. You don't need five different agencies. You don't need to become an expert in websites, SEO, CRM, AI and automation. You need someone who can connect it all and take responsibility for keeping it working.</p>",
     '<p>Vous n’avez pas besoin d’un pigiste de plus. Vous n’avez pas besoin de cinq agences différentes. Vous n’avez pas besoin de devenir un expert des sites web, du SEO, du CRM, de l’IA et de l’automatisation. Vous avez besoin de quelqu’un qui relie le tout et assume la responsabilité de le faire fonctionner.</p>'],
    ['<p><strong>You run your business. We run the digital side.</strong></p>',
     '<p><strong>Vous dirigez votre entreprise. Nous gérons le volet numérique.</strong></p>'],
    ['Why TagVolt exists', 'Pourquoi TagVolt existe'],
    ['<p>Connect it all &mdash; website, Google, leads, automation.</p>', '<p>Tout relier &mdash; site web, Google, prospects, automatisation.</p>'],
    ['<p>Take responsibility for keeping it working.</p>', '<p>Assumer la responsabilité de le faire fonctionner.</p>'],
    ['<p>One team. One system. One point of contact.</p>', '<p>Une équipe. Un système. Un seul point de contact.</p>'],
    ['<p>In English or French.</p>', '<p>En français ou en anglais.</p>'],

    ['<span class="eyebrow"><span class="num">—</span> The TagVolt Engine</span>', '<span class="eyebrow"><span class="num">—</span> Le Moteur TagVolt</span>'],
    ['<h2>One System. <span class="text-orange">Five Stages.</span></h2>', '<h2>Un système. <span class="text-orange">Cinq étapes.</span></h2>'],
    ["<p class=\"lead\">Your digital presence shouldn't be a collection of disconnected tools. It should work as a system.</p>",
     '<p class="lead">Votre présence numérique ne devrait pas être un ensemble d’outils déconnectés. Elle devrait fonctionner comme un système.</p>'],
    ['<h3>Attract</h3>', '<h3>Attirer</h3>'],
    ['<h3>Capture</h3>', '<h3>Capter</h3>'],
    ['<h3>Respond</h3>', '<h3>Répondre</h3>'],
    ['<h3>Convert</h3>', '<h3>Convertir</h3>'],
    ['<h3>Grow</h3>', '<h3>Développer</h3>'],
    ['<p>Get discovered by the right people.</p>', '<p>Faites-vous découvrir par les bonnes personnes.</p>'],
    ['<p>Turn attention into actual opportunities.</p>', '<p>Transformez l’attention en réelles occasions.</p>'],
    ["<p>Make sure opportunities don't sit unanswered.</p>", '<p>Ne laissez aucune occasion sans réponse.</p>'],
    ['<p>Move prospects toward the next step.</p>', '<p>Menez les prospects vers la prochaine étape.</p>'],
    ['<p>Turn your digital system into an asset.</p>', '<p>Faites de votre système numérique un actif.</p>'],
    ['<ul><li>Website</li><li>Google Business Profile</li><li>Local SEO</li><li>Landing pages</li><li>Content</li></ul>',
     '<ul><li>Site web</li><li>Fiche d’établissement Google</li><li>SEO local</li><li>Pages d’atterrissage</li><li>Contenu</li></ul>'],
    ['<ul><li>Contact forms</li><li>Quote requests</li><li>Click-to-call</li><li>Lead capture</li><li>Tracking</li></ul>',
     '<ul><li>Formulaires de contact</li><li>Demandes de devis</li><li>Clic-pour-appeler</li><li>Captation de prospects</li><li>Suivi</li></ul>'],
    ['<ul><li>AI</li><li>SMS</li><li>Email</li><li>Automated responses</li><li>Lead qualification</li></ul>',
     '<ul><li>IA</li><li>SMS</li><li>Courriel</li><li>Réponses automatisées</li><li>Qualification des prospects</li></ul>'],
    ['<ul><li>Follow-ups</li><li>Appointment booking</li><li>Reminders</li><li>CRM</li><li>Lead nurturing</li></ul>',
     '<ul><li>Relances</li><li>Prise de rendez-vous</li><li>Rappels</li><li>CRM</li><li>Maturation des prospects</li></ul>'],
    ['<ul><li>Reputation</li><li>Reviews</li><li>Customer reactivation</li><li>Performance monitoring</li><li>Continuous optimization</li></ul>',
     '<ul><li>Réputation</li><li>Avis</li><li>Réactivation des clients</li><li>Suivi de la performance</li><li>Optimisation continue</li></ul>'],
    ['See the full breakdown →', 'Voir le détail complet →'],

    ['<span class="eyebrow"><span class="num">—</span> Portfolio</span>', '<span class="eyebrow"><span class="num">—</span> Réalisations</span>'],
    ["<h2>Businesses We've Helped Run Their <span class=\"text-blue\">Digital Side</span>.</h2>",
     '<h2>Des entreprises que nous avons aidées à gérer leur <span class="text-blue">volet numérique</span>.</h2>'],
    ['<span class="case__tag">Medical laboratory</span>', '<span class="case__tag">Laboratoire médical</span>'],
    ['<span class="case__tag">Local trades business</span>', '<span class="case__tag">Entreprise de métiers locale</span>'],
    ['<p>Full digital handover so the team could focus on patients, not technology.</p>',
     '<p>Prise en charge numérique complète pour que l’équipe se concentre sur les patients, pas sur la technologie.</p>'],
    ['<p>A site built to generate calls, not just to exist.</p>', '<p>Un site conçu pour générer des appels, pas seulement pour exister.</p>'],
    ['See the full portfolio →', 'Voir toutes les réalisations →'],

    ['<span class="eyebrow"><span class="num">—</span> FAQ</span>', '<span class="eyebrow"><span class="num">—</span> FAQ</span>'],
    ['<h2>Common Questions.</h2>', '<h2>Questions fréquentes.</h2>'],
    ['Do I need a new website?', 'Ai-je besoin d’un nouveau site web?'],
    ["Not necessarily. If your existing website works, we'll tell you. Our goal is to improve your system, not sell you something you don't need.",
     'Pas nécessairement. Si votre site actuel fonctionne, nous vous le dirons. Notre but est d’améliorer votre système, pas de vous vendre quelque chose dont vous n’avez pas besoin.'],
    ['Do you only build websites?', 'Faites-vous seulement des sites web?'],
    ['No. Websites are only one part of what we do. TagVolt focuses on the digital system around your business.',
     'Non. Les sites web ne sont qu’une partie de ce que nous faisons. TagVolt se concentre sur le système numérique autour de votre entreprise.'],
    ['Do you work with small businesses?', 'Travaillez-vous avec les petites entreprises?'],
    ['Yes. Our systems are designed to scale according to the size and needs of each business.',
     'Oui. Nos systèmes sont conçus pour s’adapter à la taille et aux besoins de chaque entreprise.'],
    ['Do you work with businesses outside Alberta?', 'Travaillez-vous avec des entreprises à l’extérieur de l’Alberta?'],
    ['Yes. TagVolt is based in Edmonton and works with businesses across Alberta, in person or through remote collaboration.',
     'Oui. TagVolt est établie à Edmonton et travaille avec des entreprises partout en Alberta, en personne ou à distance.'],
    ['Do I have to sign a long-term contract?', 'Dois-je signer un contrat à long terme?'],
    ['Our recurring service has a minimum initial commitment, after which it continues without a long-term lock-in.',
     'Notre service récurrent comporte un engagement initial minimum, après quoi il se poursuit sans blocage à long terme.'],
    ['Do I own my website and data?', 'Suis-je propriétaire de mon site web et de mes données?'],
    ['Yes. Your website, leads, customer data and business assets remain yours.',
     'Oui. Votre site web, vos prospects, vos données clients et vos actifs d’entreprise vous appartiennent.'],
    ['Can you work in French?', 'Pouvez-vous travailler en français?'],
    ['Absolutely — English or French.', 'Absolument — en français comme en anglais.'],

    ['<span class="num">—</span> Free Lead Leak Audit</span>', '<span class="num">—</span> Audit gratuit des fuites de prospects</span>'],
    ['<h2>What\'s Your Digital System<br /><span class="text-orange">Costing You</span>?</h2>',
     '<h2>Combien votre système numérique<br /><span class="text-orange">vous coûte-t-il</span>?</h2>'],
    ["<p>We'll spend 20 minutes looking at your website, Google visibility, lead capture, follow-up, automation opportunities and customer experience — then tell you what we'd fix first.</p>",
     '<p>Nous passerons 20 minutes à examiner votre site web, votre visibilité Google, la captation de prospects, la relance, les occasions d’automatisation et l’expérience client — puis nous vous dirons quoi corriger en premier.</p>'],
    ['aria-label="What the audit covers"', 'aria-label="Ce que couvre l’audit"'],
    ['<span class="astep__label">Website</span>', '<span class="astep__label">Site web</span>'],
    ['<span class="astep__label">Google visibility</span>', '<span class="astep__label">Visibilité Google</span>'],
    ['<span class="astep__label">Lead capture</span>', '<span class="astep__label">Captation de prospects</span>'],
    ['<span class="astep__label">Follow-up</span>', '<span class="astep__label">Relance</span>'],
    ['<span class="astep__label">Automation</span>', '<span class="astep__label">Automatisation</span>'],
    ['<p class="fineprint">No sales pitch. No obligation.</p>', '<p class="fineprint">Aucun argumentaire de vente. Aucun engagement.</p>'],
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

  "blog.html": [
    ['<title>Blog — Tips for running your digital system | TagVolt</title>',
     '<title>Blogue — Conseils pour faire fonctionner votre système numérique | TagVolt</title>'],
    ['content="Local SEO, automation, follow-up — practical articles for growing businesses across Alberta."',
     'content="SEO local, automatisation, relance — des articles pratiques pour les entreprises en croissance partout en Alberta."'],
    ['<span class="pill-label">Blog</span>', '<span class="pill-label">Blogue</span>'],
    ['<h1>Tips For Running Your Digital System</h1>', '<h1>Conseils pour faire fonctionner votre système numérique</h1>'],
    ['<p class="lead">Local SEO, automation, follow-up — practical articles for growing businesses across Alberta.</p>',
     '<p class="lead">SEO local, automatisation, relance — des articles pratiques pour les entreprises en croissance partout en Alberta.</p>'],
    ['aria-label="Filter articles by stage"', 'aria-label="Filtrer les articles par étape"'],
    ['<li><a href="blog/local-seo-canadian-smbs.html">Local SEO for Canadian SMBs: where to start</a></li>',
     '<li><a href="blog/local-seo-canadian-smbs.html">SEO local pour les PME canadiennes : par où commencer</a></li>'],
    ['<li><a href="blog/automating-lead-followup.html">Automating lead follow-up without losing the human touch</a></li>',
     '<li><a href="blog/automating-lead-followup.html">Automatiser la relance des prospects sans perdre la touche humaine</a></li>'],
    ['<li><a href="blog/bilingual-competitive-advantage.html">Why bilingual is a competitive advantage in Canada</a></li>',
     '<li><a href="blog/bilingual-competitive-advantage.html">Pourquoi le bilinguisme est un avantage concurrentiel au Canada</a></li>'],
  ],

  "privacy.html": [
    ['<title>Privacy Policy | TagVolt</title>', '<title>Politique de confidentialité | TagVolt</title>'],
    ['content="How TagVolt collects, uses and protects your information."',
     'content="Comment TagVolt recueille, utilise et protège vos renseignements."'],
    ['<p class="crumbs"><a href="index.html">Home</a> / Privacy Policy</p>',
     '<p class="crumbs"><a href="index.html">Accueil</a> / Politique de confidentialité</p>'],
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
    ['<p class="crumbs"><a href="index.html">Home</a> / Terms of Service</p>',
     '<p class="crumbs"><a href="index.html">Accueil</a> / Conditions d’utilisation</p>'],
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

  /* ---- blog posts ---- */
  "blog/local-seo-canadian-smbs.html": [
    ['<title>Local SEO for Canadian SMBs: where to start | TagVolt</title>',
     '<title>SEO local pour les PME canadiennes : par où commencer | TagVolt</title>'],
    ['content="Local SEO answers one specific question: when someone searches for your service nearby, do you show up? Before thinking about keywords, three foundations need to be in place."',
     'content="Le SEO local répond à une question précise : quand quelqu’un cherche votre service à proximité, apparaissez-vous? Avant de penser aux mots-clés, trois fondations doivent être en place."'],
    ['<meta property="og:title" content="Local SEO for Canadian SMBs: where to start" />',
     '<meta property="og:title" content="SEO local pour les PME canadiennes : par où commencer" />'],
    [' / Local SEO</p>', ' / SEO local</p>'],
    ['<h1>Local SEO For Canadian SMBs: Where To Start</h1>', '<h1>SEO local pour les PME canadiennes : par où commencer</h1>'],
    ['>Practical guide<', '>Guide pratique<'],
    ['<p>Local SEO answers one specific question: when someone searches for your service nearby, do you show up? Before thinking about keywords, three foundations need to be in place.</p>',
     '<p>Le SEO local répond à une question précise : quand quelqu’un cherche votre service à proximité, apparaissez-vous? Avant de penser aux mots-clés, trois fondations doivent être en place.</p>'],
    ['<h2>1. A complete Google Business Profile, not just a created one</h2>',
     '<h2>1. Une fiche d’établissement Google complète, pas seulement créée</h2>'],
    ['<p>Many businesses have a GBP listing, but an incomplete one: rough category, missing hours, no recent photos. These details matter for local ranking — not just the fact that the listing exists.</p>',
     '<p>Beaucoup d’entreprises ont une fiche Google, mais incomplète : catégorie approximative, heures manquantes, aucune photo récente. Ces détails comptent pour le classement local — pas seulement le fait que la fiche existe.</p>'],
    ['<h2>2. Consistent citations</h2>', '<h2>2. Des citations cohérentes</h2>'],
    ['<p>Your business name, address, and phone number should appear identically everywhere your business is mentioned online (directories, social media, your website). Even a small inconsistency muddies the signal sent to search engines.</p>',
     '<p>Le nom, l’adresse et le numéro de téléphone de votre entreprise devraient apparaître de façon identique partout où votre entreprise est mentionnée en ligne (annuaires, réseaux sociaux, votre site). Même une petite incohérence brouille le signal envoyé aux moteurs de recherche.</p>'],
    ['<h2>3. A site structure built for local</h2>', '<h2>3. Une structure de site pensée pour le local</h2>'],
    ['<p>A site that never mentions its city or region in its copy sends no geographic signal at all. Page structure, titles, and content should reflect where you actually operate.</p>',
     '<p>Un site qui ne mentionne jamais sa ville ou sa région dans son texte n’envoie aucun signal géographique. La structure des pages, les titres et le contenu devraient refléter là où vous travaillez réellement.</p>'],
    ["<h2>What's next?</h2>", '<h2>Et ensuite?</h2>'],
    ['<p>Once these three foundations are in place, keyword and content work becomes far more effective — that\'s the difference between building on solid ground and stacking effort on a fragile base.</p>',
     '<p>Une fois ces trois fondations en place, le travail sur les mots-clés et le contenu devient bien plus efficace — c’est la différence entre bâtir sur du solide et empiler des efforts sur une base fragile.</p>'],
    ['<a class="btn btn--primary" href="../contact.html">Talk about your local SEO →</a>',
     '<a class="btn btn--primary" href="../contact.html">Discutons de votre SEO local →</a>'],
  ],

  "blog/automating-lead-followup.html": [
    ['<title>Automating lead follow-up without losing the human touch | TagVolt</title>',
     '<title>Automatiser la relance des prospects sans perdre la touche humaine | TagVolt</title>'],
    ['content="Automation has a bad reputation when it\'s done poorly. Done well, it frees up time so the human touch shows up at the right moment. What automation should and shouldn\'t do."',
     'content="L’automatisation a mauvaise réputation quand elle est mal faite. Bien faite, elle libère du temps pour que la touche humaine se manifeste au bon moment. Ce que l’automatisation devrait et ne devrait pas faire."'],
    ['<meta property="og:title" content="Automating lead follow-up without losing the human touch" />',
     '<meta property="og:title" content="Automatiser la relance des prospects sans perdre la touche humaine" />'],
    [' / Automation</p>', ' / Automatisation</p>'],
    ['<h1>Automating Lead Follow-Up Without Losing The Human Touch</h1>',
     '<h1>Automatiser la relance des prospects sans perdre la touche humaine</h1>'],
    ['>Practical guide<', '>Guide pratique<'],
    ["<p>Automation has a bad reputation when it's done poorly: generic emails, robotic-sounding follow-ups, customers who can tell they're talking to a system. Done well, it does the opposite — it frees up time so the human touch shows up at the right moment.</p>",
     '<p>L’automatisation a mauvaise réputation quand elle est mal faite : courriels génériques, relances au ton robotique, clients qui sentent qu’ils parlent à un système. Bien faite, elle fait l’inverse — elle libère du temps pour que la touche humaine se manifeste au bon moment.</p>'],
    ['<h2>What automation should do</h2>', '<h2>Ce que l’automatisation devrait faire</h2>'],
    ['<p>Capture every inquiry, without exception, even outside business hours. Send an instant acknowledgment to reassure the prospect. Automatically follow up with leads who haven\'t responded, without you having to remember. Flag hot leads for quick human follow-up.</p>',
     '<p>Capter chaque demande, sans exception, même en dehors des heures d’ouverture. Envoyer un accusé de réception instantané pour rassurer le prospect. Relancer automatiquement les prospects qui n’ont pas répondu, sans que vous ayez à y penser. Signaler les prospects chauds pour un suivi humain rapide.</p>'],
    ['<h2>What it should never replace</h2>', '<h2>Ce qu’elle ne devrait jamais remplacer</h2>'],
    ['<p>The sales conversation itself, negotiation, and any situation where the customer has a specific question. Automation handles volume and consistency; the human handles nuance.</p>',
     '<p>La conversation de vente elle-même, la négociation et toute situation où le client a une question précise. L’automatisation gère le volume et la constance ; l’humain gère la nuance.</p>'],
    ['<h2>Where to start</h2>', '<h2>Par où commencer</h2>'],
    ["<p>Before adding tools, map your current journey: where are you losing leads today? Often the answer is simple — a contact form that notifies no one, or follow-ups that depend on one person's memory. That's where to start.</p>",
     '<p>Avant d’ajouter des outils, cartographiez votre parcours actuel : où perdez-vous des prospects aujourd’hui? Souvent la réponse est simple — un formulaire de contact qui n’avertit personne, ou des relances qui reposent sur la mémoire d’une seule personne. C’est là qu’il faut commencer.</p>'],
    ['<a class="btn btn--primary" href="../contact.html">Talk about your lead follow-up →</a>',
     '<a class="btn btn--primary" href="../contact.html">Discutons de votre relance des prospects →</a>'],
  ],

  "blog/bilingual-competitive-advantage.html": [
    ['<title>Why bilingual is a competitive advantage in Canada | TagVolt</title>',
     '<title>Pourquoi le bilinguisme est un avantage concurrentiel au Canada | TagVolt</title>'],
    ['<meta property="og:title" content="Why bilingual is a competitive advantage in Canada" />',
     '<meta property="og:title" content="Pourquoi le bilinguisme est un avantage concurrentiel au Canada" />'],
    [' / Canadian market</p>', ' / Marché canadien</p>'],
    ['<h1>Why Bilingual Is A Competitive Advantage In Canada</h1>', '<h1>Pourquoi le bilinguisme est un avantage concurrentiel au Canada</h1>'],
    ['>Practical guide<', '>Guide pratique<'],
    ["<p>Canada isn't a single-language market, yet most business websites treat it that way. For an SMB targeting a mixed customer base — or simply looking to widen its reach — bilingual isn't a regulatory box to check. It's a door most competitors leave shut.</p>",
     '<p>Le Canada n’est pas un marché unilingue, et pourtant la plupart des sites d’entreprise le traitent comme tel. Pour une PME qui vise une clientèle mixte — ou qui cherche simplement à élargir sa portée — le bilinguisme n’est pas une case réglementaire à cocher. C’est une porte que la plupart des concurrents laissent fermée.</p>'],
    ['<h2>What it actually changes</h2>', '<h2>Ce que ça change vraiment</h2>'],
    ['<p>A customer who thinks and negotiates in French but only finds English content feels friction — even a small amount — that works against trust. The reverse is true for English-speaking customers facing a French-only service.</p>',
     '<p>Un client qui pense et négocie en français mais ne trouve que du contenu en anglais ressent une friction — même minime — qui nuit à la confiance. L’inverse est vrai pour la clientèle anglophone devant un service uniquement en français.</p>'],
    ['<h2>The trap to avoid: doubling up without a strategy</h2>', '<h2>Le piège à éviter : tout doubler sans stratégie</h2>'],
    ["<p>Translating a site word-for-word isn't the same as designing it bilingually. Both versions need to stay consistent in tone and structure, without either one feeling like an afterthought.</p>",
     '<p>Traduire un site mot à mot n’équivaut pas à le concevoir de façon bilingue. Les deux versions doivent rester cohérentes en ton et en structure, sans que l’une paraisse une réflexion après coup.</p>'],
    ['<h2>Where to start</h2>', '<h2>Par où commencer</h2>'],
    ["<p>You don't need to translate everything at once. Start with the pages that generate the most contact — home, services, contact — then expand based on actual demand from your customer base.</p>",
     '<p>Vous n’avez pas besoin de tout traduire d’un coup. Commencez par les pages qui génèrent le plus de contacts — accueil, services, contact — puis élargissez selon la demande réelle de votre clientèle.</p>'],
    ['<a class="btn btn--primary" href="../contact.html">Talk about your bilingual strategy →</a>',
     '<a class="btn btn--primary" href="../contact.html">Discutons de votre stratégie bilingue →</a>'],
  ],

  "blog/_template.html": [
    ['<title>{{TITLE}} | TagVolt</title>', '<title>{{TITRE}} | TagVolt</title>'],
    ['content="{{META_DESCRIPTION}}"', 'content="{{META_DESCRIPTION}}"'],
    ['content="{{TITLE}}"', 'content="{{TITRE}}"'],
    ['<h1>{{TITLE}}</h1>', '<h1>{{TITRE}}</h1>'],
    ['>Practical guide<', '>Guide pratique<'],
    ['<p>{{LEAD_PARAGRAPH}}</p>', '<p>{{PARAGRAPHE_INTRO}}</p>'],
    ['<h2>{{SECTION_HEADING}}</h2>', '<h2>{{TITRE_DE_SECTION}}</h2>'],
    ['<p>{{BODY}}</p>', '<p>{{CORPS}}</p>'],
    ['<a class="btn btn--primary" href="../contact.html">{{CLOSING_LINK_TEXT}} →</a>',
     '<a class="btn btn--primary" href="../contact.html">{{TEXTE_DU_LIEN_FINAL}} →</a>'],
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

async function build() {
  let wrote = 0, patched = 0;

  for (const page of ROOT_PAGES) {
    const enPath = join(ROOT, page);
    let en = (await readFile(enPath, "utf8")).replace(/\r\n/g, "\n");

    // 1) English page: add / refresh hreflang
    const enBlock = hreflang(page, "fr/" + page, page);
    const enPatched = injectHead(en, enBlock);
    if (enPatched !== en) { await writeFile(enPath, enPatched); en = enPatched; patched++; }

    // 2) French page
    let fr = en;
    fr = fr.replace('<html lang="en">', '<html lang="fr">');
    fr = fr.replace(/(href|src)="assets\//g, '$1="../assets/');
    fr = fr.replace(/src="\.\.\/assets\/js\/posts\.js"/g, 'src="../assets/js/posts.fr.js"');
    fr = toggleToFr(fr);
    fr = apply(COMMON, fr);
    fr = apply(PAGES[page] || [], fr);
    fr = injectHead(
      fr.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\r?\n/g, ""),
      hreflang("../" + page, page, "../" + page)
    );
    const outPath = join(ROOT, "fr", page);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, fr);
    wrote++;
  }

  for (const post of BLOG_POSTS) {
    const enPath = join(ROOT, post);
    const name = post.replace("blog/", "");
    let en = (await readFile(enPath, "utf8")).replace(/\r\n/g, "\n");

    if (name !== "_template.html") {
      const enBlock = hreflang(name, "../fr/blog/" + name, name);
      const enPatched = injectHead(en, enBlock);
      if (enPatched !== en) { await writeFile(enPath, enPatched); en = enPatched; patched++; }
    }

    let fr = en;
    fr = fr.replace('<html lang="en">', '<html lang="fr">');
    fr = fr.replace(/(href|src)="\.\.\/assets\//g, '$1="../../assets/');
    fr = fr.replace(/src="\.\.\/\.\.\/assets\/js\/posts\.js"/g, 'src="../../assets/js/posts.fr.js"');
    fr = toggleToFr(fr);
    fr = apply(COMMON, fr);
    fr = apply(PAGES[post] || [], fr);
    if (name !== "_template.html") {
      fr = injectHead(
        fr.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\r?\n/g, ""),
        hreflang("../../blog/" + name, name, "../../blog/" + name)
      );
    }
    const outPath = join(ROOT, "fr", "blog", name);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, fr);
    wrote++;
  }

  // French blog manifest
  const postsFr = `/* TagVolt — French blog manifest. Mirror of assets/js/posts.js. */
window.TAGVOLT_POSTS = [
  {
    slug: "local-seo-canadian-smbs",
    title: "SEO local pour les PME canadiennes : par où commencer",
    excerpt:
      "Les fondations à mettre en place avant de courir après les mots-clés — fiche Google, citations, structure du site.",
    category: "Attirer",
    tag: "SEO local",
    date: "2026-08-18"
  },
  {
    slug: "automating-lead-followup",
    title: "Automatiser la relance des prospects sans perdre la touche humaine",
    excerpt:
      "Ce qu’il faut savoir avant de brancher un CRM et des séquences de courriels à votre entreprise.",
    category: "Répondre",
    tag: "Automatisation",
    date: "2026-08-04"
  },
  {
    slug: "bilingual-competitive-advantage",
    title: "Pourquoi le bilinguisme est un avantage concurrentiel au Canada",
    excerpt:
      "Comment servir la clientèle anglophone et francophone sans doubler vos efforts marketing.",
    category: "Développer",
    tag: "Marché canadien",
    date: "2026-07-21"
  }
];
`;
  await writeFile(join(ROOT, "assets", "js", "posts.fr.js"), postsFr);

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

  console.log(`fr build: wrote ${wrote} fr/ pages, patched ${patched} EN pages, + posts.fr.js, + ${bundled} theme assets`);
}

build().catch((e) => { console.error(e); process.exit(1); });
