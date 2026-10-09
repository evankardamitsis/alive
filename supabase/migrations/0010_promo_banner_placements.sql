-- ─── Promo banner placements ──────────────────────────────────
-- Which spots a standard banner may use:
--   rail          → sticky side rails on wide screens
--   feed          → between items on the homepage and category pages
--   article       → between paragraphs of an article
--   sidebar       → top of an article's right-hand sidebar
--   after_article → after the article text
-- Defaults to every spot, so existing banners keep showing everywhere.
alter table promo_banners
  add column if not exists placements text[] not null
    default '{rail,feed,article,sidebar,after_article}'
    check (
      cardinality(placements) > 0
      and placements <@ array['rail','feed','article','sidebar','after_article']
    );
