import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import { PROFILE_AXES, invalidateLots } from '../../lib/lots';
import { ProfileRadar } from '../../components/CoffeeLots';
import { useAdminSession, uploadPublicFile } from './adminUtils';
import './Admin.css';
import './AdminModules.css';

const EMPTY = {
  name: '', varietal: '', process: '', altitude_m: '', score: '', harvest: '', bag_size: '',
  flavor_notes: [], profile: { aroma: 4, acidity: 4, body: 3, sweetness: 4, aftertaste: 4 },
  description: '', image_url: '', available: true,
};

const PROCESS_SUGGESTIONS = ['Washed', 'Honey', 'Yellow Honey', 'Red Honey', 'Black Honey', 'Natural', 'Anaerobic'];

export default function AdminLots() {
  const session = useAdminSession();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);   // lot object being edited (or EMPTY clone)
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coffee_lots').select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) setError(error.message.includes('does not exist')
      ? 'The coffee_lots table does not exist yet. Run the SQL migration in supabase/migrations first.'
      : error.message);
    else { setLots(data || []); setError(''); }
    setLoading(false);
  };

  useEffect(() => { if (session) load(); }, [session]);

  const startNew = () => setEditing({ ...EMPTY, profile: { ...EMPTY.profile }, sort_order: lots.length });
  const set = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const row = {
      name: editing.name.trim(),
      varietal: editing.varietal || null,
      process: editing.process || null,
      altitude_m: editing.altitude_m === '' ? null : Number(editing.altitude_m),
      score: editing.score === '' ? null : Number(editing.score),
      harvest: editing.harvest || null,
      bag_size: editing.bag_size || null,
      flavor_notes: (editing.flavor_notes || []).map(s => s.trim()).filter(Boolean),
      profile: editing.profile,
      description: editing.description || null,
      image_url: editing.image_url || null,
      available: !!editing.available,
      sort_order: editing.sort_order ?? lots.length,
    };
    const q = editing.id
      ? supabase.from('coffee_lots').update(row).eq('id', editing.id)
      : supabase.from('coffee_lots').insert(row);
    const { error } = await q;
    setSaving(false);
    if (error) { alert('Error saving: ' + error.message); return; }
    invalidateLots();
    setEditing(null);
    load();
  };

  const remove = async (lot) => {
    if (!window.confirm(`Delete "${lot.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('coffee_lots').delete().eq('id', lot.id);
    if (error) { alert(error.message); return; }
    invalidateLots();
    load();
  };

  const toggleAvailable = async (lot) => {
    const { error } = await supabase.from('coffee_lots').update({ available: !lot.available }).eq('id', lot.id);
    if (error) { alert(error.message); return; }
    invalidateLots();
    setLots(ls => ls.map(l => (l.id === lot.id ? { ...l, available: !l.available } : l)));
  };

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= lots.length) return;
    const prev = lots;
    const next = [...lots];
    [next[index], next[j]] = [next[j], next[index]];
    setLots(next);
    const results = await Promise.all(next.map((l, i) => supabase.from('coffee_lots').update({ sort_order: i }).eq('id', l.id)));
    const failed = results.find(r => r.error);
    if (failed) {
      /* Do not leave the screen showing an order the database rejected. */
      setLots(prev);
      setError('Could not save the new order: ' + failed.error.message);
      load();
      return;
    }
    invalidateLots();
  };

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { set('image_url', await uploadPublicFile(file, 'lots')); }
    catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  if (!session) return <div className="admin-page-container">Loading…</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Dashboard</Link>
        <h1 className="admin-title">Coffee Lots</h1>
        <button type="button" className="am-btn am-btn--primary" onClick={startNew}>+ New lot</button>
      </div>

      <p className="am-hint">
        Lots appear in the <b>“Our Coffees”</b> section of the homepage (it stays hidden while the list is empty).
        Visitors can request a sample of each lot; requests arrive in <Link to="/admin/requests">Sample Requests</Link> and by email.
      </p>

      {error && <div className="am-error">{error}</div>}
      {loading ? <p>Loading…</p> : lots.length === 0 && !error ? (
        <div className="am-empty">
          <p>No lots yet.</p>
          <button type="button" className="am-btn am-btn--primary" onClick={startNew}>Create the first lot</button>
        </div>
      ) : (
        <ul className="am-list">
          {lots.map((lot, i) => (
            <li key={lot.id} className={`am-row${lot.available ? '' : ' is-muted'}`}>
              <div className="am-thumb">{lot.image_url ? <img src={lot.image_url} alt="" /> : <span>{lot.name?.[0]}</span>}</div>
              <div className="am-row-main">
                <strong>{lot.name}</strong>
                <span>{[lot.varietal, lot.process, lot.altitude_m && `${lot.altitude_m} m`, lot.score && `${lot.score} pts`].filter(Boolean).join(' · ')}</span>
              </div>
              <label className="am-switch" title="Available">
                <input type="checkbox" checked={!!lot.available} onChange={() => toggleAvailable(lot)} />
                <span>{lot.available ? 'Available' : 'Sold out'}</span>
              </label>
              <div className="am-row-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === lots.length - 1} aria-label="Move down">↓</button>
                <button type="button" onClick={() => setEditing({ ...EMPTY, ...lot, profile: { ...EMPTY.profile, ...(lot.profile || {}) } })}>Edit</button>
                <button type="button" className="am-danger" onClick={() => remove(lot)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && createPortal(
        <div className="am-drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <form className="am-drawer" onSubmit={save}>
            <div className="am-drawer-head">
              <h2>{editing.id ? 'Edit lot' : 'New lot'}</h2>
              <button type="button" className="am-close" onClick={() => setEditing(null)} aria-label="Close">×</button>
            </div>

            <div className="am-grid2">
              <label className="am-field am-span2">Name *
                <input required value={editing.name} onChange={e => set('name', e.target.value)} placeholder="e.g. La Quebrada — Red Honey" />
              </label>
              <label className="am-field">Varietal
                <input value={editing.varietal || ''} onChange={e => set('varietal', e.target.value)} placeholder="Caturra, Catuaí, Geisha…" />
              </label>
              <label className="am-field">Process
                <input list="process-list" value={editing.process || ''} onChange={e => set('process', e.target.value)} placeholder="Honey" />
                <datalist id="process-list">{PROCESS_SUGGESTIONS.map(p => <option key={p} value={p} />)}</datalist>
              </label>
              <label className="am-field">Altitude (m)
                <input type="number" min="0" value={editing.altitude_m ?? ''} onChange={e => set('altitude_m', e.target.value)} />
              </label>
              <label className="am-field">SCA score
                <input type="number" step="0.25" min="0" max="100" value={editing.score ?? ''} onChange={e => set('score', e.target.value)} placeholder="86.5" />
              </label>
              <label className="am-field">Harvest
                <input value={editing.harvest || ''} onChange={e => set('harvest', e.target.value)} placeholder="2025/26" />
              </label>
              <label className="am-field">Bag size
                <input value={editing.bag_size || ''} onChange={e => set('bag_size', e.target.value)} placeholder="30 kg GrainPro" />
              </label>
              <label className="am-field am-span2">Tasting notes <small>(comma separated)</small>
                <input
                  value={(editing.flavor_notes || []).join(', ')}
                  onChange={e => set('flavor_notes', e.target.value.split(','))}
                  placeholder="Panela, red apple, cacao nibs"
                />
              </label>
              <label className="am-field am-span2">Short description
                <textarea rows={3} maxLength={400} value={editing.description || ''} onChange={e => set('description', e.target.value)} />
              </label>
            </div>

            <fieldset className="am-fieldset">
              <legend>Flavor profile (0–5)</legend>
              <div className="am-profile">
                <div className="am-sliders">
                  {PROFILE_AXES.map(ax => (
                    <label key={ax.key} className="am-slider">
                      <span>{ax.label}</span>
                      <input type="range" min="0" max="5" step="0.5"
                        value={editing.profile?.[ax.key] ?? 0}
                        onChange={e => set('profile', { ...editing.profile, [ax.key]: Number(e.target.value) })} />
                      <b>{editing.profile?.[ax.key] ?? 0}</b>
                    </label>
                  ))}
                </div>
                <ProfileRadar profile={editing.profile} size={170} />
              </div>
            </fieldset>

            <fieldset className="am-fieldset">
              <legend>Photo</legend>
              <div className="am-media-row">
                {editing.image_url
                  ? <img className="am-media-preview" src={editing.image_url} alt="" />
                  : <div className="am-media-preview am-media-empty">No photo</div>}
                <div className="am-media-actions">
                  <label className="am-btn">
                    {uploading ? 'Uploading…' : 'Upload photo'}
                    <input type="file" accept="image/*" onChange={onImage} disabled={uploading} hidden />
                  </label>
                  {editing.image_url && <button type="button" className="am-btn am-danger" onClick={() => set('image_url', '')}>Remove</button>}
                  <small>Landscape, ~1200 px wide works best.</small>
                </div>
              </div>
            </fieldset>

            <label className="am-switch am-switch--big">
              <input type="checkbox" checked={!!editing.available} onChange={e => set('available', e.target.checked)} />
              <span>{editing.available ? 'Available — visitors can request samples' : 'Sold out — visitors can join a waitlist'}</span>
            </label>

            <div className="am-drawer-foot">
              <button type="button" className="am-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="am-btn am-btn--primary" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save lot'}</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
