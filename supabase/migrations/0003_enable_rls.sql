-- Tables created without RLS in the initial migration
alter table post_tags      enable row level security;
alter table playlist_items enable row level security;

-- Ensure RLS stays enabled on all public content tables
alter table posts      enable row level security;
alter table categories enable row level security;
alter table tags       enable row level security;
alter table authors    enable row level security;
alter table media      enable row level security;
alter table playlists  enable row level security;

-- post_tags: public can read tags only for published posts
drop policy if exists "post_tags for published posts are public" on post_tags;
create policy "post_tags for published posts are public"
  on post_tags for select
  using (
    exists (
      select 1 from posts
      where posts.id = post_tags.post_id
        and posts.status = 'published'
    )
  );

-- playlists: owners manage their own; public playlists are readable
drop policy if exists "users manage own playlists" on playlists;
create policy "users manage own playlists"
  on playlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "public playlists are readable" on playlists;
create policy "public playlists are readable"
  on playlists for select
  using (is_public = true);

-- playlist_items: follow playlist ownership / visibility
drop policy if exists "users manage own playlist items" on playlist_items;
create policy "users manage own playlist items"
  on playlist_items for all
  using (
    exists (
      select 1 from playlists
      where playlists.id = playlist_items.playlist_id
        and playlists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from playlists
      where playlists.id = playlist_items.playlist_id
        and playlists.user_id = auth.uid()
    )
  );

drop policy if exists "public playlist items are readable" on playlist_items;
create policy "public playlist items are readable"
  on playlist_items for select
  using (
    exists (
      select 1 from playlists
      where playlists.id = playlist_items.playlist_id
        and playlists.is_public = true
    )
  );
