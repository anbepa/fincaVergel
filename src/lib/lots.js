/* ══════════════════════════════════════════════════════
   COFFEE LOTS + SAMPLE REQUESTS (Supabase tables)
   ══════════════════════════════════════════════════════ */
import { supabase } from '../supabaseClient';

const KEY = 'fv-lots-v1';
let cache;          // undefined = unknown, [] = none
let promise = null;

try {
  const raw = sessionStorage.getItem(KEY);
  if (raw) cache = JSON.parse(raw);
} catch { /* ignore */ }

export const PROFILE_AXES = [
  { key: 'aroma',      label: 'Aroma' },
  { key: 'acidity',    label: 'Acidez' },
  { key: 'body',       label: 'Cuerpo' },
  { key: 'sweetness',  label: 'Dulzor' },
  { key: 'aftertaste', label: 'Posgusto' },
];

export function fetchLots() {
  if (promise) return promise;
  promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('coffee_lots')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error || !Array.isArray(data)) return cache || [];
      cache = data;
      try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
      return data;
    } catch {
      return cache || [];
    }
  })();
  return promise;
}

/** Cache-first: cb(cached) now (if any), then cb(fresh) if it changed. */
export function subscribeLots(cb) {
  let active = true;
  const before = cache;
  if (before !== undefined) cb(before);
  fetchLots().then(data => {
    if (active && JSON.stringify(data) !== JSON.stringify(before)) cb(data);
  });
  return () => { active = false; };
}

export function invalidateLots() {
  cache = undefined;
  promise = null;
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Store a sample request (visitors may insert, never read). */
export async function submitSampleRequest(req) {
  const row = {
    lot_id: req.lot_id || null,
    lot_name: req.lot_name || null,
    name: req.name.trim(),
    company: req.company?.trim() || null,
    email: req.email.trim(),
    country: req.country?.trim() || null,
    quantity: req.quantity || null,
    message: req.message?.trim() || null,
  };
  const { error } = await supabase.from('sample_requests').insert(row);
  return { ok: !error, error };
}
