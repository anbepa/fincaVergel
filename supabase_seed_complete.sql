-- ================================================================
-- SCRIPT COMPLETO PARA BASE DE DATOS - FINCA EL VERGEL
-- ================================================================
-- Este script inserta datos iniciales para todas las secciones
-- de la nueva estructura single-page + admin compatible
-- ================================================================

-- Limpiar datos existentes (opcional - descomentar si necesitas reset)
-- DELETE FROM content_pages;

-- ================================================================
-- 1. LANDING PAGE (HERO)
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'landing',
  'FINCA EL VERGEL',
  'Specialty Coffee · Costa Rica|FINCA EL VERGEL|Grown at the foot of the Poás Volcano. Shade-grown, sun-dried, and crafted with purpose.',
  '[
    "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w",
    "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w",
    "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w",
    "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w"
  ]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 2. LAYOUT (navbar, social links, labels)
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'layout',
  'Site Layout',
  '{
    "headerTitle": "FINCA VERGEL",
    "facebook": "https://facebook.com/fincavergel",
    "instagram": "https://instagram.com/fincavergel",
    "navLabels": {
      "home": "Home",
      "about": "About Us",
      "contact": "Contact",
      "admin": "Admin",
      "landingBtn": "Discover Our Farm"
    }
  }',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- ================================================================
-- 3. THE FARM
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'thefarm',
  'The Farm',
  '<p>Hacienda Sonora is located in the Central Valley of Costa Rica, at the foot of the world renowned Poás Volcano. The farm''s area is approximately 100 hectares: 55 hectares of shaded coffee, 35 hectares of wild forest reserve, and 10 hectares of sugar cane. The average altitude is 1,200 m (3,900 ft) above sea level.</p><p>Our coffee grows surrounded by exotic trees and native vegetation, providing ideal conditions for quality and improving the already naturally rich volcanic soil. Thanks to the farm''s diverse ecosystem, many species of birds and animals seek refuge in our land.</p>',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 4. OUR PROCESS
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'ourprocess',
  'Our Process',
  '<p>Right next to our 150-year-old sugar cane mill sits our micro coffee mill, the heart of our operation. Here, we oversee every step from harvested cherry to exportable parchment. We specialize in honey and natural processing methods — a conscious choice that saves over 3 gallons of water per pound of coffee compared to washed processing.</p><p>The cherry pulp is composted and returned to the soil; drying energy comes directly from the farm. Every decision honors the land and elevates the cup.</p>',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 5. GET TO KNOW US
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'gettoknowus',
  'Get to Know Us',
  '{
    "business": "We grow 8 varietals of specialty-grade Arabica and export micro-lots of green coffee to roasters worldwide who share our commitment to quality and traceability.",
    "commitment": "Our commitment is to quality at every level — from soil health to staff well-being — always in harmony with the natural environment that makes our coffee unique.",
    "goal": "Our goal is simple: to have fun, meet amazing people, and create a positive impact on the environment and our community — one exceptional cup at a time."
  }',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 6. PERFECT COFFEE
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'perfectcoffee',
  'Perfect Coffee',
  '<p>Great coffee begins long before the roast. It starts with altitude, varietals, harvest timing, and the care taken at every processing stage. At Finca El Vergel we control all these variables — from planting under the shade of native trees to hand-selecting only ripe cherries at harvest.</p><p>The result: complex, clean, specialty-grade lots that express the unique terroir of Alajuela, Costa Rica.</p>',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 7. GREEN ENERGY
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'greenenergy',
  'Green Energy',
  '<p>Sustainability is not a marketing word for us — it is how we operate. The farm harnesses natural resources at every opportunity: compost from coffee pulp feeds the soil, gravity-fed water systems reduce pump energy, and we continually invest in reducing our carbon footprint.</p><p>We believe the most delicious coffee is also the most responsible one.</p>',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 8. OUR STAFF
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'our-staff',
  'Our Staff',
  '<p>Our employees are one of the crucial aspects of our success. Through their energy, consistency and local insights we have been able to build and maintain Hacienda Sonora. Their well-being is essential for us and for the tranquility of the farm.</p><p>One of the many things that make Hacienda Sonora so different from other farms is the fact that we provide free accommodation for each worker and their families at the farm''s houses. We encourage our staff to become the best they can, and we are proud to often see them grow to greater opportunities in life.</p><p>Pura vida!</p>',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111883773-8ETHQP1ZM0NGRSCIOEFT/DSC_2477a.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 9. ABOUT US
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'aboutus',
  'Our Story',
  '{
    "sections": [
      {
        "title": "Our Story",
        "content": "Finca El Vergel is a family-owned coffee estate nestled in the highlands of Alajuela, Costa Rica. For generations we have cultivated specialty-grade Arabica under the shade of native trees, guided by a single belief: that great coffee is the fruit of great land, cared for with patience and respect."
      },
      {
        "title": "Our Heritage",
        "content": "From the early days when our grandparents first planted coffee on this land, we have been committed to preserving the ecosystem that surrounds us. Every harvest season is a celebration of tradition, innovation, and the deep connection between people and place."
      },
      {
        "title": "Our Vision",
        "content": "We believe in transparency, sustainability, and quality. Our goal is to produce exceptional coffee that honors the land, supports our community, and brings joy to every cup."
      }
    ]
  }',
  '[
    "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779286905-2891KWL99R9NS8ME0HAE/facy0274.jpg?format=2500w",
    "https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1444779276309-IF76N2JLK3KXBXDVF5S3/facy0263.jpg?format=2500w"
  ]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 10. CONTACT PAGE
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'contact',
  'Get in Touch',
  '{
    "intro": "If you have questions about us, or are interested in our green coffee, please don''t hesitate to reach out.",
    "visit": "If you want to visit the farm, let us know a little about yourself and what you''d like to see. We''ll put together a package that suits you perfectly."
  }',
  '["https://images.squarespace-cdn.com/content/v1/5616f13ae4b0b56d478e2c2c/1447111900910-F6QKQPU0HONZDOBSHXX7/DSC_3499a.jpg?format=2500w"]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  images = EXCLUDED.images,
  updated_at = NOW();

-- ================================================================
-- 11. HOME PAGE (topic grid - legacy routing)
-- ================================================================
INSERT INTO content_pages (slug, title, content, images, updated_at)
VALUES (
  'home',
  'Explore Our World',
  '["The Farm", "Our Process", "Get to Know Us", "Perfect Coffee", "Green Energy", "Our Staff"]',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  updated_at = NOW();

-- ================================================================
-- VERIFICACIÓN: Mostrar todos los registros insertados
-- ================================================================
SELECT 
  slug,
  title,
  CASE 
    WHEN length(content) > 100 THEN substring(content, 1, 100) || '...'
    ELSE content
  END as content_preview,
  jsonb_array_length(images) as image_count,
  updated_at
FROM content_pages
ORDER BY 
  CASE slug
    WHEN 'landing' THEN 1
    WHEN 'layout' THEN 2
    WHEN 'thefarm' THEN 3
    WHEN 'ourprocess' THEN 4
    WHEN 'gettoknowus' THEN 5
    WHEN 'perfectcoffee' THEN 6
    WHEN 'greenenergy' THEN 7
    WHEN 'our-staff' THEN 8
    WHEN 'aboutus' THEN 9
    WHEN 'contact' THEN 10
    WHEN 'home' THEN 11
    ELSE 99
  END;

-- ================================================================
-- NOTAS DE USO:
-- ================================================================
-- 1. Este script usa ON CONFLICT para actualizar registros existentes
-- 2. Todas las imágenes son URLs de ejemplo - reemplazar con tus propias imágenes
-- 3. El contenido está en español/inglés según el diseño original
-- 4. Los slugs DEBEN coincidir exactamente con los usados en el código
-- 5. Para ejecutar: copiar y pegar en Supabase SQL Editor
