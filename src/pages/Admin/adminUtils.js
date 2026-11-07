import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { invalidatePages } from '../../lib/content';

/** Redirects to /admin when there is no session. Returns the session (or null while checking). */
export function useAdminSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) navigate('/admin');
      else setSession(session);
    });
    /* Keep watching: if the session ends while a long form is open
       (revoked, refresh expired, signed out in another tab), leave the
       screen instead of failing silently on Save. */
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!active) return;
      if (!sess) navigate('/admin');
      else setSession(sess);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [navigate]);
  return session;
}

/** Uploads a file to the public 'page-images' bucket and returns its public URL. */
export async function uploadPublicFile(file, folder) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('page-images').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('page-images').getPublicUrl(path);
  return data.publicUrl;
}

/** Reads a JSON settings row from content_pages. */
export async function loadSettings(slug, fallback) {
  const { data, error } = await supabase.from('content_pages').select('*').eq('slug', slug).single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data?.content) return fallback;
  try { return { ...fallback, ...JSON.parse(data.content) }; } catch { return fallback; }
}

/** Saves a JSON settings row to content_pages. */
export async function saveSettings(slug, title, value) {
  const { error } = await supabase.from('content_pages').upsert({
    slug,
    title,
    content: JSON.stringify(value),
    images: [],
    updated_at: new Date(),
  });
  if (error) throw error;
  invalidatePages();
}
