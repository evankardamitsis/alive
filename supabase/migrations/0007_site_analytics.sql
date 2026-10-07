-- ─── Site analytics + extra promo banner controls ─────────────
--
-- site_events: first-party, cookie-less analytics written by /api/track.
--   pageview   → a public page was viewed
--   impression → a promo banner was actually seen (≥50% in view, or an overlay opened)
--   click      → a promo banner was clicked
-- visitor_hash is sha256(salt + day + ip + user agent), so it changes every day and
-- cannot be traced back to a person. No cookies, no stored IPs.
create table if not exists site_events (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  type           text not null check (type in ('pageview','impression','click')),
  path           text not null,
  banner_id      uuid references promo_banners(id) on delete set null,
  placement      text check (placement in ('rail','feed','prestitial','interstitial','special_boost')),
  device         text not null default 'desktop' check (device in ('desktop','mobile','tablet')),
  visitor_hash   text not null,
  referrer_host  text
);

create index if not exists site_events_created_idx on site_events (created_at);
create index if not exists site_events_banner_idx on site_events (banner_id, type, created_at) where banner_id is not null;

-- Service role only: no policies, so the public and logged-in keys can neither read nor write.
alter table site_events enable row level security;

-- ─── Aggregations (read by the admin analytics page via the service role) ───
-- "Visitors" = daily unique visitors, summed over the range (the hash rotates daily).

create or replace function analytics_totals(p_from timestamptz, p_to timestamptz)
returns table (pageviews bigint, visitors bigint, impressions bigint, clicks bigint)
language sql stable as $$
  select
    count(*) filter (where type = 'pageview'),
    count(distinct (date_trunc('day', created_at at time zone 'Europe/Athens'), visitor_hash)) filter (where type = 'pageview'),
    count(*) filter (where type = 'impression'),
    count(*) filter (where type = 'click')
  from site_events
  where created_at >= p_from and created_at < p_to
$$;

create or replace function analytics_daily(p_from timestamptz, p_to timestamptz)
returns table (day date, pageviews bigint, visitors bigint, clicks bigint)
language sql stable as $$
  select
    (created_at at time zone 'Europe/Athens')::date as day,
    count(*) filter (where type = 'pageview'),
    count(distinct visitor_hash) filter (where type = 'pageview'),
    count(*) filter (where type = 'click')
  from site_events
  where created_at >= p_from and created_at < p_to
  group by 1
  order by 1
$$;

create or replace function analytics_top_pages(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (path text, pageviews bigint, visitors bigint)
language sql stable as $$
  select path, count(*), count(distinct visitor_hash)
  from site_events
  where type = 'pageview' and created_at >= p_from and created_at < p_to
  group by path
  order by 2 desc
  limit p_limit
$$;

create or replace function analytics_top_referrers(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (referrer text, visitors bigint)
language sql stable as $$
  select coalesce(referrer_host, 'Direct / none'), count(distinct visitor_hash)
  from site_events
  where type = 'pageview' and created_at >= p_from and created_at < p_to
  group by 1
  order by 2 desc
  limit p_limit
$$;

create or replace function analytics_devices(p_from timestamptz, p_to timestamptz)
returns table (device text, visitors bigint)
language sql stable as $$
  select device, count(distinct visitor_hash)
  from site_events
  where type = 'pageview' and created_at >= p_from and created_at < p_to
  group by device
  order by 2 desc
$$;

-- Per banner and placement. Null dates = all time (used for impression/click caps).
create or replace function analytics_banner_stats(p_from timestamptz default null, p_to timestamptz default null)
returns table (banner_id uuid, placement text, impressions bigint, clicks bigint)
language sql stable as $$
  select banner_id, placement,
    count(*) filter (where type = 'impression'),
    count(*) filter (where type = 'click')
  from site_events
  where banner_id is not null
    and (p_from is null or created_at >= p_from)
    and (p_to is null or created_at < p_to)
  group by banner_id, placement
$$;

revoke execute on function analytics_totals(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function analytics_daily(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function analytics_top_pages(timestamptz, timestamptz, int) from public, anon, authenticated;
revoke execute on function analytics_top_referrers(timestamptz, timestamptz, int) from public, anon, authenticated;
revoke execute on function analytics_devices(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function analytics_banner_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function analytics_totals(timestamptz, timestamptz) to service_role;
grant execute on function analytics_daily(timestamptz, timestamptz) to service_role;
grant execute on function analytics_top_pages(timestamptz, timestamptz, int) to service_role;
grant execute on function analytics_top_referrers(timestamptz, timestamptz, int) to service_role;
grant execute on function analytics_devices(timestamptz, timestamptz) to service_role;
grant execute on function analytics_banner_stats(timestamptz, timestamptz) to service_role;

-- ─── More promo banner controls ───────────────────────────────
--   article_scope   → 'none' | 'all' | 'categories' (articles in the banner's targeted categories)
--   device          → 'all' | 'desktop' (768px and up) | 'mobile' (below 768px)
--   max_impressions / max_clicks → the banner stops once either total is reached (null = no cap)
alter table promo_banners
  add column if not exists article_scope text not null default 'none'
    check (article_scope in ('none','all','categories')),
  add column if not exists device text not null default 'all'
    check (device in ('all','desktop','mobile')),
  add column if not exists max_impressions integer check (max_impressions is null or max_impressions > 0),
  add column if not exists max_clicks integer check (max_clicks is null or max_clicks > 0);
