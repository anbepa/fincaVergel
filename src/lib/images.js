/* ══════════════════════════════════════════════════════
   IMAGE HELPERS — responsive sizes + preloading
   ══════════════════════════════════════════════════════ */

const SQUARESPACE_WIDTHS = [300, 500, 750, 1000, 1500, 2500];

/**
 * Returns a URL sized for `cssWidth` CSS pixels on the current screen.
 * Squarespace CDN images accept `?format=<w>w`; other hosts are returned as-is.
 */
export function sizedImage(url, cssWidth) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('squarespace-cdn.com')) return url;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const target = cssWidth * dpr;
  const w = SQUARESPACE_WIDTHS.find(x => x >= target) || 2500;
  try {
    const u = new URL(url);
    u.searchParams.set('format', `${w}w`);
    return u.toString();
  } catch {
    return url;
  }
}

/** Width of the viewport, or a sensible default during SSR/tests. */
export function viewportWidth() {
  return typeof window !== 'undefined' ? window.innerWidth : 1440;
}

const loaded = new Set();
const pending = new Map();

/** Resolves once the image is decoded (or failed). Deduped per URL. */
export function preloadImage(src) {
  if (!src) return Promise.resolve();
  if (loaded.has(src)) return Promise.resolve();
  if (pending.has(src)) return pending.get(src);
  const p = new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => { loaded.add(src); pending.delete(src); resolve(); };
    img.src = src;
  });
  pending.set(src, p);
  return p;
}

export function isImageLoaded(src) {
  return loaded.has(src);
}
