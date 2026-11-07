/* ══════════════════════════════════════════════════════
   SEO metadata per public route.
   Shared by the build (vite.config.js → static HTML per route,
   sitemap.xml) and the app (document.title on navigation).
   Plain JS only — no JSX/browser APIs.
   ══════════════════════════════════════════════════════ */

export const SITE_NAME = 'Finca El Vergel';
export const DEFAULT_SITE_URL = 'https://fincavergel.vercel.app';
/* Google Search Console (HTML tag method) — public, safe to commit */
export const GOOGLE_SITE_VERIFICATION = 'w9ablEGXGf30e_bXYKIwX3yWw9AUr1O4w0XkPwng9vw';
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
    title: 'Finca El Vergel — Café de especialidad de la Sierra Nevada de Santa Marta, Colombia',
    description: 'Finca El Vergel es una finca de café de especialidad en la Sierra Nevada de Santa Marta, Colombia. Conoce nuestra finca, nuestro proceso y nuestros microlotes actuales, y pide muestras de café verde.',
    h1: 'Finca El Vergel — Café de especialidad de Colombia',
    priority: 1.0,
  },
  { path: '/thefarm',       title: 'La finca',        h1: 'La finca',        priority: 0.8,
    description: 'Conoce Finca El Vergel, nuestra finca cafetera en las montañas de la Sierra Nevada de Santa Marta, Colombia.' },
  { path: '/ourprocess',    title: 'Nuestro proceso', h1: 'Nuestro proceso', priority: 0.8,
    description: 'De la cereza madura al café verde: cómo seleccionamos, procesamos y secamos cada lote en Finca El Vergel.' },
  { path: '/perfectcoffee', title: 'Café perfecto',   h1: 'Café perfecto',   priority: 0.7,
    description: 'Qué hace grande a una taza: altitud, variedades, cosecha y cuidado en cada etapa en Finca El Vergel.' },
  { path: '/greenenergy',   title: 'Energía verde',   h1: 'Energía verde',   priority: 0.6,
    description: 'Sostenibilidad en Finca El Vergel: cómo cuidamos la tierra, el agua y el bosque.' },
  { path: '/our-staff',     title: 'Nuestro equipo',  h1: 'Nuestro equipo',  priority: 0.6,
    description: 'Conoce a las personas detrás de cada cosecha en Finca El Vergel.' },
  { path: '/gettoknowus',   title: 'Conócenos',       h1: 'Conócenos',       priority: 0.6,
    description: 'Nuestro negocio, nuestro compromiso y nuestro objetivo en Finca El Vergel.' },
  { path: '/aboutus',       title: 'Nuestra historia', h1: 'Nuestra historia', priority: 0.7,
    description: 'La historia de Finca El Vergel, una finca cafetera familiar en la Sierra Nevada de Santa Marta, Colombia.' },
  { path: '/contact',       title: 'Contacto',        h1: 'Contacto',        priority: 0.7,
    description: 'Contacta a Finca El Vergel: muestras de café verde, consultas de tostadores y visitas a la finca.' },
  { path: '/home',          title: 'Explorar',        h1: 'Explora Finca El Vergel', priority: 0.4,
    description: 'Explora cada rincón de Finca El Vergel: la finca, el proceso, el café y su gente.' },
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
      knowsAbout: ['Café de especialidad', 'Café verde', 'Cultivo de café', 'Sierra Nevada de Santa Marta'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: SITE_NAME,
      url: `${siteUrl}/`,
      inLanguage: 'es',
      publisher: { '@id': `${siteUrl}/#farm` },
    },
  ];
}
