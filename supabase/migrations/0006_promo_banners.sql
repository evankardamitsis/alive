-- ─── Promo banners ─────────────────────────────────────────
-- Admin-managed promotional visuals shown on the public site.
--
-- format:
--   standard      → inline banner (desktop side rails, in-feed on mobile)
--   prestitial    → full-screen takeover before the visitor sees the page (first page of the session)
--   interstitial  → full-screen takeover between pages (on in-site navigation)
--   special_boost → full-screen popup with the visual, shown on page load
--
-- Targeting:
--   show_on_home    → homepage
--   category_scope  → 'none' | 'all' | 'selected' (uses category_ids) for category pages
create table if not exists promo_banners (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  image_url        text not null,
  image_width      integer,
  image_height     integer,
  mobile_image_url text,
  mobile_image_width  integer,
  mobile_image_height integer,
  alt_text         text,
  destination_url  text not null,
  format           text not null default 'standard'
                     check (format in ('standard','interstitial','prestitial','special_boost')),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  show_on_home     boolean not null default true,
  category_scope   text not null default 'none'
                     check (category_scope in ('none','all','selected')),
  category_ids     uuid[] not null default '{}',
  priority         integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint promo_banners_dates_check check (ends_at > starts_at)
);

create index if not exists promo_banners_live_idx
  on promo_banners (is_active, starts_at, ends_at);

drop trigger if exists promo_banners_updated_at on promo_banners;
create trigger promo_banners_updated_at
  before update on promo_banners
  for each row execute procedure set_updated_at();

alter table promo_banners enable row level security;

-- Public can only read banners that are switched on and currently within their run dates.
drop policy if exists "live promo banners are public" on promo_banners;
create policy "live promo banners are public"
  on promo_banners for select
  using (is_active and starts_at <= now() and ends_at > now());
