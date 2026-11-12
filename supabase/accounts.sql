-- SNDT accounts: cloud maps, share links and a public gallery.
-- DRAFT for review: not applied to the sndt project yet.
--
-- Sign-in is Supabase Auth (Google, email link). Every signed-in person owns their maps; nobody else can read or change them
-- unless the owner shares one by link or publishes it to the gallery.

-- one row per map; json is the whole map as SNDT saves it
create table public.maps (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  local_id    text not null,                       -- the map's id in the app, so the same map syncs across devices
  name        text not null default '',
  json        text not null,
  size        int  generated always as (octet_length(json)) stored,
  visibility  text not null default 'private' check (visibility in ('private','link','public')),
  share_slug  text unique,                         -- random, set when the owner makes a share link
  published_at timestamptz,                        -- when it went into the gallery
  thumb_path  text,                                -- gallery picture in storage bucket 'thumbs'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner, local_id)
);
create index maps_owner_idx   on public.maps(owner, updated_at desc);
create index maps_gallery_idx on public.maps(published_at desc) where visibility = 'public';

-- the previous version of a map, kept when a save from another device would overwrite newer work (nothing is lost silently)
create table public.map_backups (
  id         bigint generated always as identity primary key,
  map_id     uuid not null references public.maps(id) on delete cascade,
  owner      uuid not null references auth.users(id) on delete cascade,
  json       text not null,
  saved_at   timestamptz not null default now()
);

-- reports on gallery or shared maps; only the project owner reads them (dashboard / service role)
create table public.map_reports (
  id         bigint generated always as identity primary key,
  map_id     uuid not null references public.maps(id) on delete cascade,
  reporter   uuid references auth.users(id) on delete set null,
  reason     text not null check (char_length(reason) between 1 and 1000),
  status     text not null default 'open' check (status in ('open','dismissed','removed')),
  created_at timestamptz not null default now()
);

alter table public.maps        enable row level security;
alter table public.map_backups enable row level security;
alter table public.map_reports enable row level security;

-- owners do everything with their own maps
create policy maps_own on public.maps for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
-- anyone (also signed out) can read gallery maps
create policy maps_gallery_read on public.maps for select to anon, authenticated
  using (visibility = 'public');
-- link-shared maps are read only through get_shared_map(slug), so they can't be listed

create policy backups_own on public.map_backups for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

create policy reports_insert on public.map_reports for insert to authenticated
  with check (reporter = auth.uid());

-- a shared map by its link (link or gallery maps only)
create function public.get_shared_map(slug text)
returns table (name text, json text, updated_at timestamptz)
language sql security definer set search_path = public stable as $$
  select m.name, m.json, m.updated_at from public.maps m
  where m.share_slug = slug and m.visibility in ('link','public')
$$;
grant execute on function public.get_shared_map(text) to anon, authenticated;

-- limits per account: 50 maps, 5 MB per map, 50 MB in all; updated_at set by the server
create function public.maps_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if octet_length(new.json) > 5000000 then raise exception 'map_too_large'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.maps where owner = new.owner) >= 50 then raise exception 'too_many_maps'; end if;
  if (select coalesce(sum(size),0) from public.maps where owner = new.owner and id <> new.id) + octet_length(new.json) > 50000000
    then raise exception 'account_full'; end if;
  new.updated_at := now();
  if new.visibility = 'public' and new.published_at is null then new.published_at := now(); end if;
  if new.visibility <> 'public' then new.published_at := null; end if;
  return new;
end $$;
create trigger maps_guard before insert or update on public.maps for each row execute function public.maps_guard();

-- keep at most 5 backups per map
create function public.backups_trim() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.map_backups where map_id = new.map_id and id not in
    (select id from public.map_backups where map_id = new.map_id order by saved_at desc limit 5);
  return null;
end $$;
create trigger backups_trim after insert on public.map_backups for each row execute function public.backups_trim();

-- "Delete my account": removes the person and (by cascade) all their maps, backups and the reports they made point nowhere
create function public.delete_me() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
grant execute on function public.delete_me() to authenticated;

-- gallery pictures: public read, each person writes only under their own folder (thumbs/<user id>/...)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('thumbs', 'thumbs', true, 500000, array['image/png','image/webp']);
create policy thumbs_write on storage.objects for insert to authenticated
  with check (bucket_id = 'thumbs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy thumbs_update on storage.objects for update to authenticated
  using (bucket_id = 'thumbs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy thumbs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'thumbs' and (storage.foldername(name))[1] = auth.uid()::text);
