-- Enable extensions
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ─── Authors ───────────────────────────────────────────────
create table authors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  bio         text,
  avatar_url  text,
  email       text not null unique,
  role        text not null default 'contributor' check (role in ('admin','editor','contributor')),
  social_links jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ─── Categories ────────────────────────────────────────────
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  color       text,           -- hex, e.g. #e63946 per section
  parent_id   uuid references categories(id) on delete set null
);

-- Seed the six sections from alivemag.gr
insert into categories (name, slug, color) values
  ('Spotlight', 'spotlight',  '#e63946'),
  ('Reviews',   'reviews',    '#2a9d8f'),
  ('Opinions',  'opinions',   '#e9c46a'),
  ('Liveshows', 'liveshows',  '#f4a261'),
  ('Culture',   'culture',    '#a8dadc');

-- ─── Tags ──────────────────────────────────────────────────
create table tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- ─── Posts ─────────────────────────────────────────────────
create table posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  content          text not null default '',
  cover_image_url  text,
  cover_image_alt  text,
  status           text not null default 'draft'
                     check (status in ('draft','published','scheduled','archived')),
  featured         boolean not null default false,
  author_id        uuid not null references authors(id) on delete restrict,
  category_id      uuid not null references categories(id) on delete restrict,
  published_at     timestamptz,
  scheduled_at     timestamptz,
  wp_id            integer,       -- original WordPress post ID, for migration
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Pivot: posts ↔ tags
create table post_tags (
  post_id uuid references posts(id) on delete cascade,
  tag_id  uuid references tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);

-- Full-text search vector (Greek + English)
alter table posts add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B')
  ) stored;

create index posts_search_idx on posts using gin(search_vector);
create index posts_status_published_at_idx on posts(status, published_at desc);
create index posts_category_idx on posts(category_id);
create index posts_author_idx on posts(author_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on posts
  for each row execute procedure set_updated_at();

-- ─── Media ─────────────────────────────────────────────────
create table media (
  id          uuid primary key default gen_random_uuid(),
  filename    text not null,
  url         text not null,
  mime_type   text not null,
  size_bytes  integer,
  width       integer,
  height      integer,
  alt_text    text,
  uploaded_by uuid references authors(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ─── Playlists (user feature) ──────────────────────────────
create table playlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,     -- from auth.users
  name       text not null,
  is_public  boolean not null default false,
  created_at timestamptz not null default now()
);

create table playlist_items (
  id                uuid primary key default gen_random_uuid(),
  playlist_id       uuid not null references playlists(id) on delete cascade,
  spotify_track_id  text not null,
  title             text not null,
  artist            text not null,
  added_at          timestamptz not null default now(),
  unique(playlist_id, spotify_track_id)
);

-- ─── Row Level Security ────────────────────────────────────
alter table posts      enable row level security;
alter table categories enable row level security;
alter table tags       enable row level security;
alter table authors    enable row level security;
alter table media      enable row level security;
alter table playlists  enable row level security;

-- Public can read published posts
create policy "published posts are public"
  on posts for select
  using (status = 'published');

-- Public can read categories and tags
create policy "categories are public" on categories for select using (true);
create policy "tags are public"       on tags       for select using (true);
create policy "authors are public"    on authors    for select using (true);
