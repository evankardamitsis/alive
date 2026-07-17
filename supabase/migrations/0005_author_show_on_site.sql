-- Per-author public byline visibility (default: shown)
alter table authors
  add column if not exists show_on_site boolean not null default true;
