-- ─── Show a banner in every chosen spot ────────────────────────
-- Off (default): a banner shows at most once per page.
-- On: it may appear once in each placement it's allowed in (e.g. in the article text and in the
-- sidebar), filling only slots no other banner takes.
alter table promo_banners
  add column if not exists repeat_in_spots boolean not null default false;
