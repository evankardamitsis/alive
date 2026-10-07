-- ─── Promo banner weight ──────────────────────────────────────
-- Banners with the same priority share their slots by weight: a weight-2 banner is shown
-- about twice as often as a weight-1 banner. Higher priority still always comes first.
alter table promo_banners
  add column if not exists weight integer not null default 1
    check (weight between 1 and 10);
