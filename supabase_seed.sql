-- ══════════════════════════════════════════════════════════════════════════
--  FINCA EL VERGEL — Full Database Seed (matches current Landing.jsx structure)
--  Run this in the Supabase SQL Editor to populate all content_pages rows.
--  Uses INSERT ... ON CONFLICT (slug) DO UPDATE to safely re-seed.
-- ══════════════════════════════════════════════════════════════════════════

-- ── TABLE & SECURITY (run once on a fresh project) ──────────────────────
create table if not exists content_pages (
  slug        text primary key,
  title       text not null,
  content     text,
  images      jsonb default '[]'::jsonb,
  updated_at  timestamp with time zone default timezone('utc'::text, now())
);

alter table content_pages enable row level security;

-- Public read
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'content_pages' and policyname = 'Public pages are viewable by everyone'
  ) then
    execute $pol$
      create policy "Public pages are viewable by everyone"
        on content_pages for select using ( true )
    $pol$;
  end if;
end $$;

-- Auth write
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'content_pages' and policyname = 'Authenticated users can update pages'
  ) then
    execute $pol$
      create policy "Authenticated users can update pages"
        on content_pages for update using ( auth.role() = 'authenticated' )
    $pol$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'content_pages' and policyname = 'Authenticated users can insert pages'
  ) then
    execute $pol$
      create policy "Authenticated users can insert pages"
        on content_pages for insert with check ( auth.role() = 'authenticated' )
    $pol$;
  end if;
end $$;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('page-images', 'page-images', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'Public Access'
  ) then
    execute $pol$
      create policy "Public Access" on storage.objects for select using ( bucket_id = 'page-images' )
    $pol$;
  end if;
end $$;

-- ── SEED DATA ────────────────────────────────────────────────────────────
-- Content format per slug:
--   landing      → "subtitle|title|desc"   + images[] = hero slideshow
--   thefarm      → { isRichContent, text (HTML), captions {} }
--   ourprocess   → { isRichContent, text (HTML), captions {} }
--   gettoknowus  → { business, commitment, goal }     ← NEW format
--   perfectcoffee→ { isRichContent, text (HTML), captions {} }
--   greenenergy  → { isRichContent, text (HTML), captions {} }
--   our-staff    → { isRichContent, text (HTML), captions {} }
--   aboutus      → { sections: [{title, content}] }
--   contact      → { intro, visit }
--   layout       → { text, facebook, instagram, headerTitle, headerLogo, footerLogo, navLabels }
--   home         → JSON array of 6 strings (legacy, unused by public page)

-- ── 1. LANDING (hero) ────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'landing',
  'Landing Page',
  'Specialty Coffee · Costa Rica|FINCA EL VERGEL|Grown at the foot of the Poás Volcano. Shade-grown, sun-dried, and crafted with purpose.',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w","https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w","https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w","https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w"]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 2. THE FARM ──────────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'thefarm',
  'The Farm',
  '{"isRichContent":true,"text":"<p>Hacienda Sonora is located in the Central Valley of Costa Rica, at the foot of the world renowned Poás Volcano. The farm''s area is approximately 100 hectares: 55 hectares of shaded coffee, 35 hectares of wild forest reserve, and 10 hectares of sugar cane. The average altitude is 1,200 m (3,900 ft) above sea level.</p><p>Our coffee grows surrounded by exotic trees and native vegetation, providing ideal conditions for quality and improving the already naturally rich volcanic soil. Thanks to the farm''s diverse ecosystem, many species of birds and animals seek refuge in our land.</p>","captions":{}}',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w","https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w"]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 3. OUR PROCESS ───────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'ourprocess',
  'Our Process',
  '{"isRichContent":true,"text":"<p>Right next to our 150-year-old sugar cane mill sits our micro coffee mill, the heart of our operation. Here, we oversee every step from harvested cherry to exportable parchment. We specialize in honey and natural processing methods — a conscious choice that saves over 3 gallons of water per pound of coffee compared to washed processing.</p><p>The cherry pulp is composted and returned to the soil; drying energy comes directly from the farm. Every decision honors the land and elevates the cup.</p>","captions":{}}',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w","https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w"]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 4. GET TO KNOW US ─────────────────────────────────────────────────────
-- NEW FORMAT: { business, commitment, goal } — matches Landing.jsx SectionGetToKnow
insert into content_pages (slug, title, content, images) values (
  'gettoknowus',
  'Get to Know Us',
  '{"business":"We grow 8 varietals of specialty-grade Arabica and export micro-lots of green coffee to roasters worldwide who share our commitment to quality and traceability.","commitment":"Our commitment is to quality at every level — from soil health to staff well-being — always in harmony with the natural environment that makes our coffee unique.","goal":"Our goal is simple: to have fun, meet amazing people, and create a positive impact on the environment and our community — one exceptional cup at a time."}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 5. PERFECT COFFEE ────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'perfectcoffee',
  'Perfect Coffee',
  '{"isRichContent":true,"text":"<p>Great coffee begins long before the roast. It starts with altitude, varietals, harvest timing, and the care taken at every processing stage. At Finca El Vergel we control all these variables — from planting under the shade of native trees to hand-selecting only ripe cherries at harvest.</p><p>The result: complex, clean, specialty-grade lots that express the unique terroir of Alajuela, Costa Rica.</p>","captions":{}}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 6. GREEN ENERGY ──────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'greenenergy',
  'Green Energy',
  '{"isRichContent":true,"text":"<p>Sustainability is not a marketing word for us — it is how we operate. The farm harnesses natural resources at every opportunity: compost from coffee pulp feeds the soil, gravity-fed water systems reduce pump energy, and we continually invest in reducing our carbon footprint.</p><p>We believe the most delicious coffee is also the most responsible one.</p>","captions":{}}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 7. OUR STAFF ─────────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'our-staff',
  'Our Staff',
  '{"isRichContent":true,"text":"<p>Our employees are one of the crucial aspects of our success. Through their energy, consistency and local insights we have been able to build and maintain Hacienda Sonora. Their well-being is essential for us and for the tranquility of the farm.</p><p>One of the many things that make Hacienda Sonora so different from other farms is the fact that we provide free accommodation for each worker and their families at the farm''s houses. We encourage our staff to become the best they can, and we are proud to often see them grow to greater opportunities in life.</p><p>Pura vida!</p>","captions":{}}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 8. ABOUT US ──────────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'aboutus',
  'Our Story',
  '{"sections":[{"title":"Our Story","content":"Finca El Vergel is a family-owned coffee estate nestled in the highlands of Alajuela, Costa Rica. For generations we have cultivated specialty-grade Arabica under the shade of native trees, guided by a single belief: that great coffee is the fruit of great land, cared for with patience and respect."},{"title":"Our Mission","content":"We journey to grow the finest specialty coffee in the highlands of Costa Rica — with purpose, passion, and deep respect for the land and the people who work it every day."},{"title":"Our Values","content":"Quality, sustainability, and community are at the heart of everything we do. We believe the best cup of coffee tells a story — of the land, the harvest, and the hands that made it possible."}]}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 9. CONTACT ───────────────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'contact',
  'Contact',
  '{"intro":"If you have any questions about us, or if you are interested in obtaining our green coffee, please don''t hesitate to reach out.","visit":"If you want to come visit our farm please let us know a little about yourself and what you are interested in seeing or learning. We''ll put together a package that suits you perfectly."}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 10. LAYOUT (Global) ───────────────────────────────────────────────────
insert into content_pages (slug, title, content, images) values (
  'layout',
  'Global Layout',
  '{"text":"© Finca El Vergel · Alajuela, Costa Rica","facebook":"","instagram":"","headerTitle":"FINCA VERGEL","headerLogo":"","footerLogo":"","navLabels":{"home":"Home","about":"About Us","contact":"Contact","admin":"Admin","landingBtn":"Discover Our Farm"}}',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ── 11. HOME (legacy grid, kept for /home route) ─────────────────────────
insert into content_pages (slug, title, content, images) values (
  'home',
  'Explore (Legacy)',
  '["The Farm","Our Process","Get to Know Us","Perfect Coffee","Green Energy","Our Staff"]',
  '[]'
) on conflict (slug) do update set
  title   = excluded.title,
  content = excluded.content,
  images  = excluded.images,
  updated_at = now();

-- ══════════════════════════════════════════════════════════════════════════
--  VERIFY (optional — run to confirm all rows exist)
-- ══════════════════════════════════════════════════════════════════════════
-- select slug, title, length(content) as content_len, jsonb_array_length(images) as img_count
-- from content_pages
-- order by slug;
