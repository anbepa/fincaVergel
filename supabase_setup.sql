-- 1. Create table for content pages
create table if not exists content_pages (
  slug text primary key,
  title text not null,
  content text,
  images jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
alter table content_pages enable row level security;

-- 3. Create Policy: Public Read Access
create policy "Public pages are viewable by everyone"
  on content_pages for select
  using ( true );

-- 4. Create Policy: Admin Write Access (Update/Insert)
-- Ideally this checks for authenticated user. 
-- For now, we allow authenticated users to update.
create policy "Authenticated users can update pages"
  on content_pages for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert pages"
  on content_pages for insert
  with check ( auth.role() = 'authenticated' );

-- 5. Storage: Create a bucket for 'page-images'
insert into storage.buckets (id, name, public) 
values ('page-images', 'page-images', true)
on conflict (id) do nothing;

-- 6. Storage Policy: Public Read
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'page-images' );

-- 7. Storage Policy: Authenticated Upload/Delete
create policy "Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'page-images' and auth.role() = 'authenticated' );

create policy "Auth Update"
  on storage.objects for update
  with check ( bucket_id = 'page-images' and auth.role() = 'authenticated' );

create policy "Auth Delete"
  on storage.objects for delete
  using ( bucket_id = 'page-images' and auth.role() = 'authenticated' );

-- 8. Seed Initial Data (Optional but helpful based on current site)
-- Requires JSON formatted strings for images.
-- Replace with actual image URLs from your site if desired, or let the admin fill it.
insert into content_pages (slug, title, content, images) values
('thefarm', 'The Farm', '<p>Hacienda Sonora is located in the Central Valley of Costa Rica, at the foot of the world renowned, Poas Volcano. The farm’s area is approximately 100 hectares, which is composed of 55 hectares of shaded coffee, 35 hectares of wild forest reserve, and 10 hectares of sugar cane. The average altitude is 1,200 m (or 3,900 ft) above sea level.</p><p>Our coffee grows in an environment surrounded by exotic trees and other vegetation, providing a great condition for quality, as well as improving the chemistry of the already naturally rich volcanic soil. Thanks to the farm’s diverse ecosystem, many different species of birds and animals seek refuge in our land.</p>', '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444777877174-LP8BX0VNSN8YGSQ0AN2Z/facy0263.jpg?format=1500w", "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444777698351-A9HBYMJH03IFI0HSYXYK/facy0255.jpg?format=1500w"]')
on conflict (slug) do nothing;

-- Repeat for other pages
insert into content_pages (slug, title, content, images) values
('ourprocess', 'Our process', '<p>Our micro coffee mill is built in the heart of Hacienda Sonora next to a traditional 150-year-old sugar cane mill that is preserved intact. All of our machines in the mill are tuned to perform in the best most efficient manner, using the energy harvested within the farm.</p><p>We process all of our coffee using the honey and natural methods. Both of these methods require a lot more work and care than the traditional fully washed. However, it all makes sense when you taste the results in the cup. By playing and trying different techniques with these two methods we have been able to obtain distinct sweetness, with all types of cacao and enhanced fruit notes that complement the body of our cup profiles in our different varietals.</p><p>Another important advantage is that we save great amounts of water by using the honey and the natural processes. Using the honey method saves more than 3 gallons of water per pound of coffee. Natural processed coffee doesn''t need any water.</p>', '[]'),
('gettoknowus', 'Get to know us', '<p><strong>Our business</strong> is to create high quality green coffee micro-lots that we harvest on our land. We produce eight different coffee varietals, which we process under special techniques such as the honey and natural methods.</p><p><strong>Our commitment</strong> is to achieve the best quality among our different varietals while maintaining perfect harmony with nature and our staff.</p><p><strong>Our goal</strong> is to have fun, meet great people from different parts of the world, have a positive impact on the environment and on the people that surround our business, all while producing outstanding coffees.</p>', '[]'),
('perfectcoffee', 'Perfect coffee', '', '[]'),
('greenenergy', 'Green Energy', '', '[]'),
('our-staff', 'Our Staff', '<p>Our employees are one of the crucial aspects of our success. Through their energy, consistency and local insights we have been able to build and maintain Hacienda Sonora. Their well-being is essential for us and for the tranquility of the farm.</p><p>One of the many things that make Hacienda Sonora so different from other farms is the fact that we provide free accommodation for each worker and their families at the farm''s houses. For each house, Hacienda Sonora covers for the cost of water, trash allocation, and a portion of their electricity. Every employee fully enjoys the benefits of the Costa Rica Health Insurance system.</p><p>We enjoy a personal relationship built on respect with all our workers. We encourage our staff to become the best they can, and we are proud to often see them grow to greater opportunities in life.</p><p>Pura vida!</p>', '[]'),
('landing', 'Landing Page', 'Costa Rican Specialty coffee|SONORA|Harvested and milled in Hacienda Sonora, Costa Rica. We specialize in creating unique green coffee for those who seek exotic and well rounded cups.', '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w", "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w", "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w", "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w"]'),
('home', 'Home Page', '', '[]'),
('layout', 'Global Layout (Header/Footer)', 'Hacienda Sonora, Costa Rica', '[]')
on conflict (slug) do nothing;
