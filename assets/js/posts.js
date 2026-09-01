/* =====================================================================
   TagVolt — Blog manifest
   ---------------------------------------------------------------------
   Single source of truth for the blog index, category filters and
   "related articles". To publish a new post:
     1. Copy blog/_template.html to blog/your-slug.html and write it.
     2. Add an entry to the top of the array below.
   Keep `slug` identical to the file name (without .html).
   `date` is ISO (YYYY-MM-DD) and only controls sort order.
   `category` is an Engine stage: Attract | Capture | Respond | Convert | Grow
   ===================================================================== */
window.TAGVOLT_POSTS = [
  {
    slug: "local-seo-canadian-smbs",
    title: "Local SEO for Canadian SMBs: where to start",
    excerpt:
      "The foundations to put in place before chasing keywords — GBP, citations, site structure.",
    category: "Attract",
    tag: "Local SEO",
    date: "2026-08-18"
  },
  {
    slug: "automating-lead-followup",
    title: "Automating lead follow-up without losing the human touch",
    excerpt:
      "What to know before connecting a CRM and email sequences to your business.",
    category: "Respond",
    tag: "Automation",
    date: "2026-08-04"
  },
  {
    slug: "bilingual-competitive-advantage",
    title: "Why bilingual is a competitive advantage in Canada",
    excerpt:
      "How to serve English and French customers without doubling your marketing effort.",
    category: "Grow",
    tag: "Canadian market",
    date: "2026-07-21"
  }
];
