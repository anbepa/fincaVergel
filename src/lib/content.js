/* ══════════════════════════════════════════════════════
   CONTENT CACHE
   One batched Supabase query for every public page, shared by
   Navbar, Footer, Landing and inner pages. Results are kept in
   memory and sessionStorage (stale-while-revalidate) so repeat
   visits and route changes render instantly.
   ══════════════════════════════════════════════════════ */
import { supabase } from '../supabaseClient';

export const PUBLIC_SLUGS = [
  'landing', 'layout', 'home', 'contact', 'aboutus',
  'thefarm', 'ourprocess', 'gettoknowus', 'perfectcoffee',
  'greenenergy', 'our-staff', 'heromedia', 'farmmap',
];

const STORAGE_KEY = 'fv-content-v2';
const cache = new Map();      // slug -> row | null
const inflight = new Map();   // slug -> Promise<row|null>
let batchPromise = null;

/* Hydrate from sessionStorage synchronously (instant first paint on reload) */
try {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) Object.entries(JSON.parse(raw)).forEach(([k, v]) => cache.set(k, v));
} catch { /* storage unavailable */ }

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch { /* quota / private mode */ }
}

/** Fetch all public pages in a single request (deduped). */
export function prefetchAllPages() {
  if (batchPromise) return batchPromise;
  batchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('content_pages')
        .select('*')
        .in('slug', PUBLIC_SLUGS);
      if (error || !Array.isArray(data)) return false;
      PUBLIC_SLUGS.forEach(slug => cache.set(slug, null));
      data.forEach(row => cache.set(row.slug, row));
      persist();
      return true;
    } catch {
      return false;
    }
  })();
  return batchPromise;
}

/** Synchronous read of whatever is cached (undefined = never fetched). */
export function getCachedPage(slug) {
  return cache.get(slug);
}

/**
 * Returns `{ data }` like the Supabase `.single()` call it replaces.
 * Serves from cache when possible, waiting on the batched request if
 * one is in flight, and falls back to a single-row query otherwise.
 */
export async function getPage(slug) {
  if (cache.has(slug) && batchPromise) {
    await batchPromise; // ensure freshest copy for this session
    return { data: cache.get(slug) ?? null };
  }
  if (PUBLIC_SLUGS.includes(slug)) {
    const ok = await prefetchAllPages();
    if (ok || cache.has(slug)) return { data: cache.get(slug) ?? null };
  }
  if (!inflight.has(slug)) {
    inflight.set(slug, (async () => {
      try {
        const { data } = await supabase
          .from('content_pages').select('*').eq('slug', slug).single();
        cache.set(slug, data || null);
        persist();
        return data || null;
      } catch {
        return null;
      } finally {
        inflight.delete(slug);
      }
    })());
  }
  return { data: await inflight.get(slug) };
}

/** Called by the admin after saving so visitors in this tab see fresh data. */
export function invalidatePages() {
  cache.clear();
  batchPromise = null;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/**
 * Cache-first subscription: calls `cb(row)` synchronously with cached data
 * (if any), then again with fresh data only if it changed. Returns a cleanup
 * function so callers can use it directly as a useEffect return value.
 */
export function subscribePage(slug, cb) {
  let active = true;
  const cached = cache.get(slug);
  if (cached !== undefined) cb(cached);
  getPage(slug).then(({ data }) => {
    if (!active) return;
    if (cached === undefined || JSON.stringify(data) !== JSON.stringify(cached)) cb(data);
  });
  return () => { active = false; };
}
