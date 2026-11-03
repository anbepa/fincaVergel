import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_MAP, MapIllustration, mapMode, validLocation } from '../../components/FarmMap';
import { useAdminSession, uploadPublicFile, loadSettings, saveSettings } from './adminUtils';
import './Admin.css';
import './AdminModules.css';

const SatelliteMap = lazy(() => import('../../components/SatelliteMap'));

const BASE = {
  enabled: true, title: DEFAULT_MAP.title, intro: DEFAULT_MAP.intro, mapImage: '', points: [],
  mode: '', location: { lat: '', lng: '', zoom: 15, label: 'Finca El Vergel', region: '', timezone: 'auto' },
  altitude: '', harvestMonths: [], liveWidget: true,
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Extract "lat,lng" from coordinates or any full Google Maps URL */
export function parseCoords(text) {
  if (!text) return null;
  const t = decodeURIComponent(String(text));
  const pats = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,           // place data
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,             // @lat,lng,zoom
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/,
    /\/(?:search|place|dir)\/(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/,      // plain "lat, lng"
  ];
  for (const re of pats) {
    const m = t.match(re);
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    }
  }
  return null;
}
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
  const setLoc = (patch) => setCfg(c => ({ ...c, location: { ...c.location, ...patch } }));
  const [coordInput, setCoordInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const setPoint = (id, patch) => setCfg(c => ({ ...c, points: c.points.map(p => (p.id === id ? { ...p, ...patch } : p)) }));

  useEffect(() => {
    if (!session) return;
    loadSettings('farmmap', BASE)
      .then(c => {
        setCfg({
          ...BASE, ...c,
          location: { ...BASE.location, ...(c.location || {}) },
          points: (c.points || []).map(p => ({ id: p.id || uid(), ...p })),
        });
        if (validLocation(c.location)) setCoordInput(`${c.location.lat}, ${c.location.lng}`);
      })
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
    const p = { id: uid(), x, y, title: `Point ${flatPoints.length + 1}`, text: '', image: '' };
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

  const applyCoords = () => {
    if (/maps\.app\.goo\.gl|goo\.gl\/maps/.test(coordInput)) {
      alert('Short links can’t be read directly. Open the link, then right-click the farm in Google Maps and click the coordinates to copy them (e.g. 10.849760, -74.015902), and paste them here.');
      return;
    }
    const c = parseCoords(coordInput);
    if (!c) { alert('Couldn’t find coordinates. Paste something like 10.849760, -74.015902 or a full Google Maps URL.'); return; }
    setLoc(c);
    setCoordInput(`${c.lat}, ${c.lng}`);
    if (!cfg.mode) set('mode', 'satellite');
  };

  const detectAltitude = async () => {
    if (!validLocation(cfg.location)) return;
    setDetecting(true);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${cfg.location.lat}&longitude=${cfg.location.lng}`);
      const j = await r.json();
      if (Array.isArray(j.elevation)) set('altitude', Math.round(j.elevation[0]));
      else alert(j.reason || 'Could not detect the altitude.');
    } catch (e) { alert('Could not detect the altitude: ' + e.message); }
    finally { setDetecting(false); }
  };

  const toggleMonth = (m) => set('harvestMonths',
    cfg.harvestMonths.includes(m) ? cfg.harvestMonths.filter(x => x !== m) : [...cfg.harvestMonths, m].sort((a, b) => a - b));

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
  const isSat = mapMode(cfg) === 'satellite';
  const satPoints = cfg.points.filter(p => Number.isFinite(Number(p.lat)) && p.lat !== '' && Number.isFinite(Number(p.lng)));
  const flatPoints = cfg.points.filter(p => Number.isFinite(Number(p.x)) && p.x !== '');
  const listPoints = isSat ? satPoints : flatPoints;

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
          <legend>Farm location</legend>
          <p className="am-hint">
            Paste the coordinates from Google Maps (right-click the farm → click the numbers to copy them)
            or a full Google Maps URL. Used for the satellite view, the “Get directions” button and the live weather.
          </p>
          <div className="am-media-actions am-media-actions--row">
            <input className="am-input" style={{ flex: 1, minWidth: 260 }} value={coordInput}
              onChange={e => setCoordInput(e.target.value)} placeholder="10.849760, -74.015902"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoords(); } }} />
            <button type="button" className="am-btn" onClick={applyCoords}>Set location</button>
            {validLocation(cfg.location) && (
              <a className="am-btn" href={`https://www.google.com/maps/search/?api=1&query=${cfg.location.lat},${cfg.location.lng}`} target="_blank" rel="noopener noreferrer">Check in Google Maps ↗</a>
            )}
          </div>
          {validLocation(cfg.location) && (
            <div className="am-grid2" style={{ marginTop: 14 }}>
              <label className="am-field">Marker label
                <input value={cfg.location.label || ''} onChange={e => setLoc({ label: e.target.value })} placeholder="Finca El Vergel" />
              </label>
              <label className="am-field">Region (shown under the map)
                <input value={cfg.location.region || ''} onChange={e => setLoc({ region: e.target.value })} placeholder="Sierra Nevada de Santa Marta, Colombia" />
              </label>
              <label className="am-field">Altitude (m a.s.l.)
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" style={{ flex: 1 }} value={cfg.altitude ?? ''} onChange={e => set('altitude', e.target.value)} />
                  <button type="button" className="am-btn" onClick={detectAltitude} disabled={detecting}>{detecting ? '…' : 'Detect'}</button>
                </div>
              </label>
              <label className="am-field">Time zone
                <input value={cfg.location.timezone || ''} onChange={e => setLoc({ timezone: e.target.value })} placeholder="America/Bogota" />
              </label>
              <label className="am-field am-span2">Initial zoom: {cfg.location.zoom || 15}
                <input type="range" min="10" max="18" value={cfg.location.zoom || 15} onChange={e => setLoc({ zoom: Number(e.target.value) })} />
              </label>
            </div>
          )}
        </fieldset>

        <fieldset className="am-fieldset">
          <legend>Map style</legend>
          <div className="am-media-actions am-media-actions--row">
            {[
              { id: 'satellite', label: 'Satellite (real)', disabled: !validLocation(cfg.location) },
              { id: 'image', label: 'My uploaded image', disabled: !cfg.mapImage },
              { id: 'illustration', label: 'Illustrated map' },
            ].map(o => (
              <label key={o.id} className={`am-radio${o.disabled ? ' is-disabled' : ''}`}>
                <input type="radio" name="map-mode" checked={mapMode(cfg) === o.id} disabled={o.disabled}
                  onChange={() => set('mode', o.id)} />
                {o.label}
              </label>
            ))}
          </div>
          {mapMode(cfg) === 'satellite' && (
            <p className="am-hint" style={{ marginTop: 12 }}>
              Satellite points use real coordinates — click the satellite map below to add them. Points placed on an image or the illustration are kept separately.
            </p>
          )}
        </fieldset>

        <fieldset className="am-fieldset">
          <legend>Live widget on the homepage</legend>
          <label className="am-switch">
            <input type="checkbox" checked={cfg.liveWidget !== false} onChange={e => set('liveWidget', e.target.checked)} />
            <span>Show “Live from the farm” (real temperature &amp; weather at the location)</span>
          </label>
          <p className="am-hint" style={{ margin: '14px 0 8px' }}>Harvest months — the widget shows “Harvest season” during these months:</p>
          <div className="am-months">
            {MONTHS.map((m, i) => (
              <button key={m} type="button" className={`am-month${cfg.harvestMonths.includes(i) ? ' is-on' : ''}`}
                aria-pressed={cfg.harvestMonths.includes(i)} onClick={() => toggleMonth(i)}>{m}</button>
            ))}
          </div>
        </fieldset>

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
            {mapMode(cfg) === 'satellite' ? (
              <div className="am-map am-map--sat">
                <Suspense fallback={<p className="am-hint">Loading satellite…</p>}>
                  <SatelliteMap
                    editable
                    location={cfg.location}
                    points={satPoints}
                    active={satPoints.findIndex(p => p.id === selected)}
                    onSelect={i => setSelected(satPoints[i]?.id)}
                    onAdd={({ lat, lng }) => {
                      const p = { id: uid(), lat, lng, title: `Point ${satPoints.length + 1}`, text: '', image: '' };
                      setCfg(c => ({ ...c, points: [...c.points, p] }));
                      setSelected(p.id);
                    }}
                    onMove={(i, ll) => setPoint(satPoints[i].id, ll)}
                  />
                </Suspense>
              </div>
            ) : (
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
              {flatPoints.map((p, i) => (
                <button key={p.id} type="button"
                  className={`am-pin${p.id === selected ? ' is-selected' : ''}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onPointerDown={e => onPinDown(e, p.id)}
                  title={p.title}
                >{i + 1}</button>
              ))}
            </div>
            )}

            <div className="am-points">
              {listPoints.length === 0 && <p className="am-hint">No points yet — click anywhere on the map.</p>}
              {listPoints.map((p, i) => (
                <div key={p.id} className={`am-point${p.id === selected ? ' is-selected' : ''}`}>
                  <button type="button" className="am-point-head" onClick={() => setSelected(s => (s === p.id ? null : p.id))}>
                    <span className="am-point-num">{i + 1}</span>
                    <strong>{p.title || 'Untitled'}</strong>
                    <span className="am-muted">{isSat ? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}` : `${p.x}%, ${p.y}%`}</span>
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
                        <button type="button" onClick={() => movePoint(p.id, 1)} disabled={i === listPoints.length - 1}>↓ Later</button>
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
