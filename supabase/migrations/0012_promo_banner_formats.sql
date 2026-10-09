-- ─── Several formats per banner ───────────────────────────────
-- A banner can run as more than one format at once (e.g. standard + special_boost).
-- `formats` replaces `format`; existing banners keep their single format.
alter table promo_banners
  add column if not exists formats text[] not null default '{standard}'
    check (
      cardinality(formats) > 0
      and formats <@ array['standard','interstitial','prestitial','special_boost']
    );

update promo_banners set formats = array[format] where formats = '{standard}' and format <> 'standard';

-- Keep `format` and `formats` in step both ways while older code (which only knows `format`)
-- may still be running: `format` always holds the first chosen format.
create or replace function promo_banners_sync_format() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.formats = '{standard}' and new.format <> 'standard' then
      new.formats := array[new.format];      -- written by older code
    else
      new.format := new.formats[1];
    end if;
  elsif new.formats is distinct from old.formats then
    new.format := new.formats[1];
  elsif new.format is distinct from old.format then
    new.formats := array[new.format];        -- written by older code
  end if;
  return new;
end;
$$;

drop trigger if exists promo_banners_sync_format on promo_banners;
create trigger promo_banners_sync_format
  before insert or update on promo_banners
  for each row execute procedure promo_banners_sync_format();
