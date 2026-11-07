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
      ? 'La tabla coffee_lots aún no existe. Ejecuta primero la migración SQL en supabase/migrations.'
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
    if (error) { alert('Error al guardar: ' + error.message); return; }
    invalidateLots();
    setEditing(null);
    load();
  };

  const remove = async (lot) => {
    if (!window.confirm(`¿Eliminar "${lot.name}"? Esto no se puede deshacer.`)) return;
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
      setError('No se pudo guardar el nuevo orden: ' + failed.error.message);
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
    catch (err) { alert('Error al subir: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  if (!session) return <div className="admin-page-container">Cargando…</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Panel</Link>
        <h1 className="admin-title">Lotes de café</h1>
        <button type="button" className="am-btn am-btn--primary" onClick={startNew}>+ Nuevo lote</button>
      </div>

      <p className="am-hint">
        Los lotes aparecen en la sección <b>“Nuestros cafés”</b> de la página principal.
        Los visitantes pueden pedir una muestra de cada lote; las solicitudes llegan a <Link to="/admin/requests">Solicitudes de muestra</Link> y por correo.
      </p>

      {error && <div className="am-error">{error}</div>}
      {loading ? <p>Cargando…</p> : lots.length === 0 && !error ? (
        <div className="am-empty">
          <p>Aún no hay lotes.</p>
          <button type="button" className="am-btn am-btn--primary" onClick={startNew}>Crear el primer lote</button>
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
              <label className="am-switch" title="Disponible">
                <input type="checkbox" checked={!!lot.available} onChange={() => toggleAvailable(lot)} />
                <span>{lot.available ? 'Disponible' : 'Agotado'}</span>
              </label>
              <div className="am-row-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === lots.length - 1} aria-label="Bajar">↓</button>
                <button type="button" onClick={() => setEditing({ ...EMPTY, ...lot, profile: { ...EMPTY.profile, ...(lot.profile || {}) } })}>Editar</button>
                <button type="button" className="am-danger" onClick={() => remove(lot)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && createPortal(
        <div className="am-drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <form className="am-drawer" onSubmit={save}>
            <div className="am-drawer-head">
              <h2>{editing.id ? 'Editar lote' : 'Nuevo lote'}</h2>
              <button type="button" className="am-close" onClick={() => setEditing(null)} aria-label="Cerrar">×</button>
            </div>

            <div className="am-grid2">
              <label className="am-field am-span2">Nombre *
                <input required value={editing.name} onChange={e => set('name', e.target.value)} placeholder="ej. La Quebrada — Honey rojo" />
              </label>
              <label className="am-field">Variedad
                <input value={editing.varietal || ''} onChange={e => set('varietal', e.target.value)} placeholder="Caturra, Catuaí, Geisha…" />
              </label>
              <label className="am-field">Proceso
                <input list="process-list" value={editing.process || ''} onChange={e => set('process', e.target.value)} placeholder="Honey" />
                <datalist id="process-list">{PROCESS_SUGGESTIONS.map(p => <option key={p} value={p} />)}</datalist>
              </label>
              <label className="am-field">Altitud (m)
                <input type="number" min="0" value={editing.altitude_m ?? ''} onChange={e => set('altitude_m', e.target.value)} />
              </label>
              <label className="am-field">Puntaje SCA
                <input type="number" step="0.25" min="0" max="100" value={editing.score ?? ''} onChange={e => set('score', e.target.value)} placeholder="86.5" />
              </label>
              <label className="am-field">Cosecha
                <input value={editing.harvest || ''} onChange={e => set('harvest', e.target.value)} placeholder="2025/26" />
              </label>
              <label className="am-field">Tamaño de bolsa
                <input value={editing.bag_size || ''} onChange={e => set('bag_size', e.target.value)} placeholder="30 kg GrainPro" />
              </label>
              <label className="am-field am-span2">Notas de cata <small>(separadas por comas)</small>
                <input
                  value={(editing.flavor_notes || []).join(', ')}
                  onChange={e => set('flavor_notes', e.target.value.split(','))}
                  placeholder="Panela, manzana roja, nibs de cacao"
                />
              </label>
              <label className="am-field am-span2">Descripción corta
                <textarea rows={3} maxLength={400} value={editing.description || ''} onChange={e => set('description', e.target.value)} />
              </label>
            </div>

            <fieldset className="am-fieldset">
              <legend>Perfil de sabor (0–5)</legend>
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
              <legend>Foto</legend>
              <div className="am-media-row">
                {editing.image_url
                  ? <img className="am-media-preview" src={editing.image_url} alt="" />
                  : <div className="am-media-preview am-media-empty">Sin foto</div>}
                <div className="am-media-actions">
                  <label className="am-btn">
                    {uploading ? 'Subiendo…' : 'Subir foto'}
                    <input type="file" accept="image/*" onChange={onImage} disabled={uploading} hidden />
                  </label>
                  {editing.image_url && <button type="button" className="am-btn am-danger" onClick={() => set('image_url', '')}>Quitar</button>}
                  <small>Horizontal, de ~1200 px de ancho funciona mejor.</small>
                </div>
              </div>
            </fieldset>

            <label className="am-switch am-switch--big">
              <input type="checkbox" checked={!!editing.available} onChange={e => set('available', e.target.checked)} />
              <span>{editing.available ? 'Disponible: los visitantes pueden pedir muestras' : 'Agotado: los visitantes pueden unirse a la lista de espera'}</span>
            </label>

            <div className="am-drawer-foot">
              <button type="button" className="am-btn" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="am-btn am-btn--primary" disabled={saving || uploading}>{saving ? 'Guardando…' : 'Guardar lote'}</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
