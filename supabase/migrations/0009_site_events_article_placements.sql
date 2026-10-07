-- ─── New promo placements on article pages ─────────────────────
--   article → banner between paragraphs of an article
--   sidebar → banner at the top of the article's right-hand sidebar
alter table site_events drop constraint if exists site_events_placement_check;
alter table site_events
  add constraint site_events_placement_check
    check (placement in ('rail','feed','article','sidebar','prestitial','interstitial','special_boost'));
