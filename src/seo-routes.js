/* ══════════════════════════════════════════════════════
   SEO metadata per public route.
   Shared by the build (vite.config.js → static HTML per route,
   sitemap.xml) and the app (document.title on navigation).
   Plain JS only — no JSX/browser APIs.
   ══════════════════════════════════════════════════════ */

export const SITE_NAME = 'Finca El Vergel';
export const DEFAULT_SITE_URL = 'https://fincavergel.vercel.app';
export const INSTAGRAM_URL = 'https://www.instagram.com/fincaelvergel/';

export const FARM = {
  region: 'Sierra Nevada de Santa Marta',
  locality: 'Ciénaga',
  state: 'Magdalena',
  country: 'CO',
  lat: 10.84976,
  lng: -74.015902,
};

export const ROUTES = [
  {
    path: '/',
    title: 'Finca El Vergel — Specialty Coffee from the Sierra Nevada de Santa Marta, Colombia',
    description: 'Finca El Vergel is a specialty coffee farm in the Sierra Nevada de Santa Marta, Colombia. Discover our farm, our process and our current micro-lots, and request green coffee samples.',
    h1: 'Finca El Vergel — Specialty Coffee from Colombia',
    priority: 1.0,
  },
  { path: '/thefarm',       title: 'The Farm',        h1: 'The Farm',        priority: 0.8,
    description: 'Discover Finca El Vergel, our coffee farm in the mountains of the Sierra Nevada de Santa Marta, Colombia.' },
  { path: '/ourprocess',    title: 'Our Process',     h1: 'Our Process',     priority: 0.8,
    description: 'From ripe cherry to green coffee: how we pick, process and dry every lot at Finca El Vergel.' },
  { path: '/perfectcoffee', title: 'Perfect Coffee',  h1: 'Perfect Coffee',  priority: 0.7,
    description: 'What makes a great cup: altitude, varietals, harvest and care at every stage at Finca El Vergel.' },
  { path: '/greenenergy',   title: 'Green Energy',    h1: 'Green Energy',    priority: 0.6,
    description: 'Sustainability at Finca El Vergel: how we care for the land, the water and the forest.' },
  { path: '/our-staff',     title: 'Our Staff',       h1: 'Our Staff',       priority: 0.6,
    description: 'Meet the people behind every harvest at Finca El Vergel.' },
  { path: '/gettoknowus',   title: 'Get to Know Us',  h1: 'Get to Know Us',  priority: 0.6,
    description: 'Our business, our commitment and our goals at Finca El Vergel.' },
  { path: '/aboutus',       title: 'Our Story',       h1: 'Our Story',       priority: 0.7,
    description: 'The story of Finca El Vergel, a family coffee farm in the Sierra Nevada de Santa Marta, Colombia.' },
  { path: '/contact',       title: 'Contact',         h1: 'Contact',         priority: 0.7,
    description: 'Contact Finca El Vergel: green coffee samples, roaster enquiries and farm visits.' },
  { path: '/home',          title: 'Explore',         h1: 'Explore Finca El Vergel', priority: 0.4,
    description: 'Explore every corner of Finca El Vergel: the farm, the process, the coffee and the people.' },
];

/** Full <title> for a route */
export function fullTitle(route) {
  return route.path === '/' ? route.title : `${route.title} | ${SITE_NAME}`;
}

export function findRoute(pathname) {
  const clean = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  return ROUTES.find(r => r.path === clean) || null;
}

/** schema.org structured data for the farm */
export function structuredData(siteUrl) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}/#farm`,
      name: SITE_NAME,
      description: ROUTES[0].description,
      url: `${siteUrl}/`,
      image: `${siteUrl}/og-image.jpg`,
      logo: `${siteUrl}/icon-512.png`,
      sameAs: [INSTAGRAM_URL],
      address: {
        '@type': 'PostalAddress',
        addressLocality: FARM.locality,
        addressRegion: FARM.state,
        addressCountry: FARM.country,
      },
      geo: { '@type': 'GeoCoordinates', latitude: FARM.lat, longitude: FARM.lng },
      hasMap: `https://www.google.com/maps/search/?api=1&query=${FARM.lat},${FARM.lng}`,
      areaServed: 'Worldwide',
      knowsAbout: ['Specialty coffee', 'Green coffee', 'Coffee farming', 'Sierra Nevada de Santa Marta'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: SITE_NAME,
      url: `${siteUrl}/`,
      inLanguage: 'en',
      publisher: { '@id': `${siteUrl}/#farm` },
    },
  ];
}
