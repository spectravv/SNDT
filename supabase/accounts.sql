-- SNDT accounts: cloud maps, share links and a public gallery.
-- Applied to the sndt project as migration 'accounts' (2026-11-12).
--
-- Sign-in is Supabase Auth (Google, email link). Every signed-in person owns their maps; nobody else can read or change them
-- unless the owner shares one by link or publishes it to the gallery.
--
-- Personal data kept to the minimum: there are no passwords (Google and email links only), the name and picture Google sends are
-- removed as soon as they arrive (see strip_profile below), so the only personal detail stored is the email address Supabase needs to
-- sign people in. Our own tables hold no names or emails, only the anonymous user id; the gallery shows a nickname people choose.

-- the nickname shown with gallery maps (chosen by the person, not taken from Google)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null check (char_length(btrim(nickname)) between 2 and 30),
  created_at timestamptz not null default now()
);

-- one row per map; data is the whole map as SNDT saves it (JSON text)
create table public.maps (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  local_id    text not null,                       -- the map's id in the app, so the same map syncs across devices
  name        text not null default '',
  data        text not null,
  size        int  generated always as (octet_length(data)) stored,
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
  data       text not null,
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

alter table public.profiles    enable row level security;
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

create policy profiles_own on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- a nickname is visible to others only once its owner has a map in the gallery
create policy profiles_gallery_read on public.profiles for select to anon, authenticated
  using (exists (select 1 from public.maps m where m.owner = profiles.id and m.visibility = 'public'));

create policy backups_own on public.map_backups for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

create policy reports_insert on public.map_reports for insert to authenticated
  with check (reporter = auth.uid());

-- a shared map by its link (link or gallery maps only)
create function public.get_shared_map(slug text)
returns table (name text, data text, updated_at timestamptz)
language sql security definer set search_path = public stable as $$
  select m.name, m.data, m.updated_at from public.maps m
  where m.share_slug = slug and m.visibility in ('link','public')
$$;
grant execute on function public.get_shared_map(text) to anon, authenticated;

-- the gallery: newest first, with the maker's nickname (no user ids or emails go out)
create function public.list_gallery(lim int default 60, before timestamptz default null)
returns table (id uuid, name text, nickname text, thumb_path text, published_at timestamptz)
language sql security definer set search_path = public stable as $$
  select m.id, m.name, coalesce(p.nickname, 'Anonymous'), m.thumb_path, m.published_at
  from public.maps m left join public.profiles p on p.id = m.owner
  where m.visibility = 'public' and (before is null or m.published_at < before)
  order by m.published_at desc limit least(lim, 100)
$$;
grant execute on function public.list_gallery(int, timestamptz) to anon, authenticated;

-- limits per account: 50 maps, 5 MB per map, 50 MB in all; updated_at set by the server
create function public.maps_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if octet_length(new.data) > 5000000 then raise exception 'map_too_large'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.maps where owner = new.owner) >= 50 then raise exception 'too_many_maps'; end if;
  if (select coalesce(sum(size),0) from public.maps where owner = new.owner and id <> new.id) + octet_length(new.data) > 50000000
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

-- remove the name and picture Google sends (on the user and on its sign-in identity), every time they arrive; Supabase only needs the
-- account ids and the email to sign people in
create function public.strip_profile_data(d jsonb) returns jsonb
language sql immutable as $$
  select coalesce(d, '{}'::jsonb) - 'name' - 'full_name' - 'given_name' - 'family_name' - 'nickname' - 'picture' - 'avatar_url' - 'locale'
$$;
create function public.strip_user_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.raw_user_meta_data := public.strip_profile_data(new.raw_user_meta_data); return new; end $$;
create trigger strip_user_profile before insert or update on auth.users
  for each row execute function public.strip_user_profile();
create function public.strip_identity_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.identity_data := public.strip_profile_data(new.identity_data); return new; end $$;
create trigger strip_identity_profile before insert or update on auth.identities
  for each row execute function public.strip_identity_profile();

-- follow-up migration 'accounts_tidy' (after Supabase's security advisor): trigger functions can't be called through the API, only
-- signed-in people can delete their account, and a fixed search path. The advisor warnings left are intentional: get_shared_map and
-- list_gallery are public on purpose, delete_me is for signed-in people, and the room_* functions belong to live rooms.
revoke execute on function public.maps_guard() from public, anon, authenticated;
revoke execute on function public.backups_trim() from public, anon, authenticated;
revoke execute on function public.strip_user_profile() from public, anon, authenticated;
revoke execute on function public.strip_identity_profile() from public, anon, authenticated;
revoke execute on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
alter function public.strip_profile_data(jsonb) set search_path = '';

-- migration 'accounts_share' (share links and gallery): shared maps come with the nickname and visibility, the gallery gives each map's
-- link and last change, reporting goes by link (signed in, once per person and map, not your own maps), and you can see your own
-- gallery pictures (needed to replace them)
drop function public.get_shared_map(text);
create function public.get_shared_map(slug text)
returns table (name text, data text, updated_at timestamptz, nickname text, visibility text)
language sql security definer set search_path = public stable as $$
  select m.name, m.data, m.updated_at, p.nickname, m.visibility from public.maps m left join public.profiles p on p.id = m.owner
  where m.share_slug = slug and m.visibility in ('link','public')
$$;
grant execute on function public.get_shared_map(text) to anon, authenticated;
drop function public.list_gallery(int, timestamptz);
create function public.list_gallery(lim int default 60, before timestamptz default null)
returns table (name text, nickname text, thumb_path text, published_at timestamptz, updated_at timestamptz, share_slug text)
language sql security definer set search_path = public stable as $$
  select m.name, coalesce(p.nickname, 'Anonymous'), m.thumb_path, m.published_at, m.updated_at, m.share_slug
  from public.maps m left join public.profiles p on p.id = m.owner
  where m.visibility = 'public' and m.share_slug is not null and (before is null or m.published_at < before)
  order by m.published_at desc limit least(lim, 100)
$$;
grant execute on function public.list_gallery(int, timestamptz) to anon, authenticated;
alter table public.map_reports add constraint map_reports_once unique (map_id, reporter);
create function public.report_map(slug text, reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign_in_needed'; end if;
  insert into public.map_reports(map_id, reporter, reason)
    select m.id, auth.uid(), left(btrim(reason), 1000) from public.maps m
    where m.share_slug = slug and m.visibility in ('link','public') and m.owner <> auth.uid()
  on conflict (map_id, reporter) do update set reason = excluded.reason, created_at = now(), status = 'open';
end $$;
revoke execute on function public.report_map(text, text) from public, anon;
grant execute on function public.report_map(text, text) to authenticated;
create policy thumbs_read_own on storage.objects for select to authenticated
  using (bucket_id = 'thumbs' and (storage.foldername(name))[1] = auth.uid()::text);

-- MODERATION (run in the Supabase SQL editor):
--   open reports:   select r.created_at, r.reason, m.name, m.share_slug from map_reports r join maps m on m.id = r.map_id where r.status = 'open' order by r.created_at desc;
--   take a map down (keeps it for its owner, just not shared):
--                   update maps set visibility = 'private', share_slug = null where share_slug = '<slug>';
--                   update map_reports set status = 'removed' where map_id = (select id from maps where name = '<name>' limit 1);
--   dismiss:        update map_reports set status = 'dismissed' where id = <report id>;


-- GALLERY IDS + SEARCH (migration accounts_gallery_ids): every map gets a short public number the first time it goes in the gallery,
-- kept for good (it comes back if the map is published again); the gallery can be searched by that number, the map name or the maker's nickname,
-- and the signed-in person's own maps are left out of it (the app shows them in their own section)
create sequence public.map_code_seq;
alter table public.maps add column code bigint unique;
update public.maps m set code = s.n from (select id, nextval('public.map_code_seq') n from (select id from public.maps where visibility = 'public' order by published_at) o) s where m.id = s.id;
create or replace function public.maps_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if octet_length(new.data) > 5000000 then raise exception 'map_too_large'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.maps where owner = new.owner) >= 50 then raise exception 'too_many_maps'; end if;
  if (select coalesce(sum(size),0) from public.maps where owner = new.owner and id <> new.id) + octet_length(new.data) > 50000000
    then raise exception 'account_full'; end if;
  new.updated_at := now();
  if new.visibility = 'public' and new.published_at is null then new.published_at := now(); end if;
  if new.visibility <> 'public' then new.published_at := null; end if;
  if tg_op = 'INSERT' then new.code := null; else new.code := old.code; end if;
  if new.visibility = 'public' and new.code is null then new.code := nextval('public.map_code_seq'); end if;
  return new;
end $$;
drop function public.list_gallery(int, timestamptz);
create function public.list_gallery(lim int default 30, before timestamptz default null, q text default null)
returns table (name text, nickname text, thumb_path text, published_at timestamptz, updated_at timestamptz, share_slug text, code bigint)
language plpgsql security definer set search_path = public stable as $$
declare s text := nullif(btrim(coalesce(q, '')), ''); n bigint; pat text;
begin
  if s ~ '^#?[0-9]{1,15}$' then n := ltrim(s, '#')::bigint; end if;
  if s is not null then pat := '%' || replace(replace(replace(s, '\', '\\'), '%', '\%'), '_', '\_') || '%'; end if;
  return query
  select m.name, coalesce(p.nickname, 'Anonymous'), m.thumb_path, m.published_at, m.updated_at, m.share_slug, m.code
  from public.maps m left join public.profiles p on p.id = m.owner
  where m.visibility = 'public' and m.share_slug is not null
    and (auth.uid() is null or m.owner <> auth.uid())
    and (before is null or m.published_at < before)
    and (s is null or m.code = n or m.name ilike pat or p.nickname ilike pat)
  order by (m.code = n) desc nulls last, m.published_at desc limit least(lim, 100);
end $$;
grant execute on function public.list_gallery(int, timestamptz, text) to anon, authenticated;
drop function public.get_shared_map(text);
create function public.get_shared_map(slug text)
returns table (name text, data text, updated_at timestamptz, nickname text, visibility text, code bigint)
language sql security definer set search_path = public stable as $$
  select m.name, m.data, m.updated_at, p.nickname, m.visibility, case when m.visibility = 'public' then m.code end
  from public.maps m left join public.profiles p on p.id = m.owner
  where m.share_slug = slug and m.visibility in ('link','public')
$$;
grant execute on function public.get_shared_map(text) to anon, authenticated;


-- UNIQUE NICKNAMES (migration accounts_unique_nicknames, 2026-11-12): no two accounts share a nickname, ignoring case and
-- spaces around it; "Anonymous" is what the gallery shows without a nickname, so nobody can take it
create unique index profiles_nickname_unique on public.profiles (lower(btrim(nickname)));
alter table public.profiles add constraint profiles_nickname_not_reserved check (lower(btrim(nickname)) <> 'anonymous');


-- PLACEHOLDER NICKNAMES (migration accounts_anonymous_numbers, 2026-11-12): every new account gets Anonymous_N (its own number)
-- until the person picks a nickname; nobody can choose Anonymous or Anonymous_N themselves (only keep the one they were given)
create sequence public.anon_nick_seq;
create function public.profile_for_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, nickname) values (new.id, 'Anonymous_' || nextval('public.anon_nick_seq')) on conflict (id) do nothing;
  return new;
end $$;
create trigger profile_for_new_user after insert on auth.users for each row execute function public.profile_for_new_user();
create function public.profiles_nick_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and new.nickname ~* '^\s*anonymous(_\d+)?\s*$'
     and (tg_op = 'INSERT' or lower(btrim(new.nickname)) is distinct from lower(btrim(old.nickname))) then
    raise exception 'nickname_reserved' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger profiles_nick_guard before insert or update of nickname on public.profiles for each row execute function public.profiles_nick_guard();
insert into public.profiles(id, nickname)
  select u.id, 'Anonymous_' || nextval('public.anon_nick_seq') from (select id from auth.users where id not in (select id from public.profiles) order by created_at) u;
