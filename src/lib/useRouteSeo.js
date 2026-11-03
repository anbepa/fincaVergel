import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findRoute, fullTitle, SITE_NAME } from '../seo-routes';

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const m = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Keeps <title>, description, canonical and robots in sync with the route. */
export default function useRouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const robots = document.head.querySelector('meta[name="robots"]');
    if (pathname.startsWith('/admin')) {
      document.title = `Admin | ${SITE_NAME}`;
      robots?.setAttribute('content', 'noindex, nofollow');
      return;
    }
    robots?.setAttribute('content', 'index, follow, max-image-preview:large');
    const route = findRoute(pathname);
    if (!route) return;
    const url = `${window.location.origin}${route.path}`;
    document.title = fullTitle(route);
    setMeta('meta[name="description"]', 'content', route.description);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:title"]', 'content', fullTitle(route));
    setMeta('meta[property="og:description"]', 'content', route.description);
  }, [pathname]);
}
