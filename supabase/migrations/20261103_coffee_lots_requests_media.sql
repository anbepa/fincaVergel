-- ════════════════════════════════════════════════════════════════════
-- Finca El Vergel — Coffee lots catalog, sample requests, hero video and
-- interactive farm map.
--
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
-- Assumes (as the rest of the admin does) that every authenticated user is
-- an admin: keep public sign-ups DISABLED in Authentication → Providers.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 1. Coffee lots ─────────────────────────────────────────────────
create table if not exists public.coffee_lots (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  varietal      text,
  process       text,                    -- e.g. Honey, Natural, Washed
  altitude_m    integer,
  score         numeric(4,2),            -- SCA cupping score, e.g. 86.50
  harvest       text,                    -- e.g. 2025/26
  bag_size      text,                    -- e.g. 30 kg GrainPro
  flavor_notes  text[] not null default '{}',
  profile       jsonb  not null default '{"aroma":4,"acidity":4,"body":3,"sweetness":4,"aftertaste":4}',
  description   text,
  image_url     text,
  available     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists coffee_lots_sort_idx on public.coffee_lots (sort_order, created_at);

alter table public.coffee_lots enable row level security;

drop policy if exists "Lots are public"            on public.coffee_lots;
drop policy if exists "Admins manage lots"         on public.coffee_lots;
create policy "Lots are public"
  on public.coffee_lots for select
  using (true);
create policy "Admins manage lots"
  on public.coffee_lots for all
  to authenticated
  using (true) with check (true);

-- ── 2. Sample requests ─────────────────────────────────────────────
create table if not exists public.sample_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  lot_id      uuid references public.coffee_lots(id) on delete set null,
  lot_name    text,
  name        text not null,
  company     text,
  email       text not null,
  country     text,
  quantity    text,
  message     text,
  status      text not null default 'new'   -- new | contacted | sent | closed
);

create index if not exists sample_requests_created_idx on public.sample_requests (created_at desc);

alter table public.sample_requests enable row level security;

drop policy if exists "Anyone can request a sample"  on public.sample_requests;
drop policy if exists "Admins read requests"         on public.sample_requests;
drop policy if exists "Admins update requests"       on public.sample_requests;
drop policy if exists "Admins delete requests"       on public.sample_requests;

-- Visitors can only INSERT (never read). Basic size limits deter abuse.
create policy "Anyone can request a sample"
  on public.sample_requests for insert
  to anon, authenticated
  with check (
    status = 'new'
    and char_length(name)  between 1 and 120
    and char_length(email) between 3 and 200
    and coalesce(char_length(company), 0)  <= 160
    and coalesce(char_length(country), 0)  <= 80
    and coalesce(char_length(quantity), 0) <= 80
    and coalesce(char_length(message), 0)  <= 3000
  );
create policy "Admins read requests"
  on public.sample_requests for select to authenticated using (true);
create policy "Admins update requests"
  on public.sample_requests for update to authenticated using (true) with check (true);
create policy "Admins delete requests"
  on public.sample_requests for delete to authenticated using (true);

-- ── 3. updated_at trigger for lots ─────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists coffee_lots_touch on public.coffee_lots;
create trigger coffee_lots_touch before update on public.coffee_lots
  for each row execute function public.touch_updated_at();

-- ── 4. Settings rows (hero video + farm map) in content_pages ──────
-- Both are edited from the admin; these just create empty rows.
insert into public.content_pages (slug, title, content, images)
values
  ('heromedia', 'Hero Video', '{"enabled":false,"videoUrl":"","posterUrl":"","mobileVideoUrl":""}', '[]'::jsonb),
  ('farmmap',   'Farm Map',   '{"enabled":true,"title":"Explore the farm","intro":"","mapImage":"","points":[]}', '[]'::jsonb)
on conflict (slug) do nothing;

-- ── 5. Storage: allow short videos in the existing bucket ──────────
-- Only needed if your 'page-images' bucket restricts MIME types or size.
-- Uncomment to allow images + MP4/WebM up to 50 MB:
-- update storage.buckets
--   set allowed_mime_types = array['image/*','video/mp4','video/webm'],
--       file_size_limit = 52428800
--   where id = 'page-images';
