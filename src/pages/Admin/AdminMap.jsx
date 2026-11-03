import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_MAP, MapIllustration } from '../../components/FarmMap';
import { useAdminSession, uploadPublicFile, loadSettings, saveSettings } from './adminUtils';
import './Admin.css';
import './AdminModules.css';

const BASE = { enabled: true, title: DEFAULT_MAP.title, intro: DEFAULT_MAP.intro, mapImage: '', points: [] };
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = v => Math.min(98, Math.max(2, Math.round(v * 10) / 10));

export default function AdminMap() {
  const session = useAdminSession();
  const [cfg, setCfg] = useState(BASE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [ratio, setRatio] = useState('16 / 10');
  const canvasRef = useRef(null);
  const drag = useRef(null);

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  const setPoint = (id, patch) => setCfg(c => ({ ...c, points: c.points.map(p => (p.id === id ? { ...p, ...patch } : p)) }));

  useEffect(() => {
    if (!session) return;
    loadSettings('farmmap', BASE)
      .then(c => setCfg({ ...BASE, ...c, points: (c.points || []).map(p => ({ id: p.id || uid(), ...p })) }))
      .catch(e => alert(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const posFromEvent = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };

  /* Click empty map → add a point there */
  const onCanvasClick = (e) => {
    if (e.target.closest('.am-pin')) return;
    const { x, y } = posFromEvent(e);
    const p = { id: uid(), x, y, title: `Point ${cfg.points.length + 1}`, text: '', image: '' };
    setCfg(c => ({ ...c, points: [...c.points, p] }));
    setSelected(p.id);
  };

  /* Drag pins with mouse or touch */
  const onPinDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    drag.current = id;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPinMove = (e) => {
    if (!drag.current) return;
    setPoint(drag.current, posFromEvent(e));
  };
  const onPinUp = () => { drag.current = null; };

  const removePoint = (id) => {
    setCfg(c => ({ ...c, points: c.points.filter(p => p.id !== id) }));
    if (selected === id) setSelected(null);
  };
  const movePoint = (id, dir) => setCfg(c => {
    const i = c.points.findIndex(p => p.id === id);
    const j = i + dir;
    if (j < 0 || j >= c.points.length) return c;
    const pts = [...c.points];
    [pts[i], pts[j]] = [pts[j], pts[i]];
    return { ...c, points: pts };
  });

  const upload = async (file, onDone) => {
    setUploading(true);
    try { onDone(await uploadPublicFile(file, 'map')); }
    catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await saveSettings('farmmap', 'Farm Map', cfg); alert('Farm map saved!'); }
    catch (err) { alert('Error saving: ' + err.message); }
    finally { setSaving(false); }
  };

  if (!session || loading) return <div className="admin-page-container">Loading…</div>;
  const sel = cfg.points.find(p => p.id === selected);

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Dashboard</Link>
        <h1 className="admin-title">Farm Map</h1>
      </div>

      <form onSubmit={save} className="am-form">
        <label className="am-switch am-switch--big">
          <input type="checkbox" checked={cfg.enabled !== false} onChange={e => set('enabled', e.target.checked)} />
          <span>{cfg.enabled !== false ? 'Map visible on the homepage' : 'Map hidden'}</span>
        </label>

        <div className="am-grid2">
          <label className="am-field">Section title
            <input value={cfg.title} onChange={e => set('title', e.target.value)} />
          </label>
          <label className="am-field">Intro text
            <input value={cfg.intro} onChange={e => set('intro', e.target.value)} />
          </label>
        </div>

        <fieldset className="am-fieldset">
          <legend>Map image</legend>
          <p className="am-hint">
            Upload an aerial photo, drone shot or illustrated map of the farm. Without one, a stylised
            topographic map is shown.
          </p>
          <div className="am-media-actions am-media-actions--row">
            <label className="am-btn">
              {uploading ? 'Uploading…' : (cfg.mapImage ? 'Replace map image' : 'Upload map image')}
              <input type="file" accept="image/*" hidden disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, url => set('mapImage', url)); e.target.value = ''; }} />
            </label>
            {cfg.mapImage && <button type="button" className="am-btn am-danger" onClick={() => set('mapImage', '')}>Use illustrated map</button>}
            {cfg.points.length === 0 && (
              <button type="button" className="am-btn" onClick={() => set('points', DEFAULT_MAP.points.map(p => ({ ...p, id: uid() })))}>
                Load example points
              </button>
            )}
          </div>
        </fieldset>

        <fieldset className="am-fieldset">
          <legend>Points — click the map to add, drag to move</legend>
          <div className="am-map-layout">
            <div
              ref={canvasRef}
              className="am-map"
              style={{ aspectRatio: cfg.mapImage ? ratio : '16 / 10' }}
              onClick={onCanvasClick}
              onPointerMove={onPinMove}
              onPointerUp={onPinUp}
              onPointerCancel={onPinUp}
            >
              {cfg.mapImage
                ? <img src={cfg.mapImage} alt="" draggable={false}
                    onLoad={e => setRatio(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)} />
                : <MapIllustration />}
              {cfg.points.map((p, i) => (
                <button key={p.id} type="button"
                  className={`am-pin${p.id === selected ? ' is-selected' : ''}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onPointerDown={e => onPinDown(e, p.id)}
                  title={p.title}
                >{i + 1}</button>
              ))}
            </div>

            <div className="am-points">
              {cfg.points.length === 0 && <p className="am-hint">No points yet — click anywhere on the map.</p>}
              {cfg.points.map((p, i) => (
                <div key={p.id} className={`am-point${p.id === selected ? ' is-selected' : ''}`}>
                  <button type="button" className="am-point-head" onClick={() => setSelected(s => (s === p.id ? null : p.id))}>
                    <span className="am-point-num">{i + 1}</span>
                    <strong>{p.title || 'Untitled'}</strong>
                    <span className="am-muted">{p.x}%, {p.y}%</span>
                  </button>
                  {p.id === selected && sel && (
                    <div className="am-point-body">
                      <label className="am-field">Title
                        <input value={sel.title} onChange={e => setPoint(p.id, { title: e.target.value })} />
                      </label>
                      <label className="am-field">Text
                        <textarea rows={3} value={sel.text || ''} onChange={e => setPoint(p.id, { text: e.target.value })} />
                      </label>
                      <div className="am-media-row">
                        {sel.image ? <img className="am-media-preview am-media-preview--sm" src={sel.image} alt="" /> : null}
                        <div className="am-media-actions am-media-actions--row">
                          <label className="am-btn">
                            {sel.image ? 'Replace photo' : 'Add photo'}
                            <input type="file" accept="image/*" hidden disabled={uploading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, url => setPoint(p.id, { image: url })); e.target.value = ''; }} />
                          </label>
                          {sel.image && <button type="button" className="am-btn am-danger" onClick={() => setPoint(p.id, { image: '' })}>Remove photo</button>}
                        </div>
                      </div>
                      <div className="am-row-actions">
                        <button type="button" onClick={() => movePoint(p.id, -1)} disabled={i === 0}>↑ Earlier</button>
                        <button type="button" onClick={() => movePoint(p.id, 1)} disabled={i === cfg.points.length - 1}>↓ Later</button>
                        <button type="button" className="am-danger" onClick={() => removePoint(p.id)}>Delete point</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        <button type="submit" className="am-btn am-btn--primary am-save" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save map'}</button>
      </form>
    </div>
  );
}
