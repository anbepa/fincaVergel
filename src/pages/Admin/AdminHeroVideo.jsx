import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminSession, uploadPublicFile, loadSettings, saveSettings } from './adminUtils';
import './Admin.css';
import './AdminModules.css';

const DEFAULTS = { enabled: false, videoUrl: '', mobileVideoUrl: '', posterUrl: '' };
const MAX_MB = 50;

function MediaField({ label, hint, value, onChange, accept, folder, kind }) {
  const [uploading, setUploading] = useState(false);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { alert(`El archivo supera los ${MAX_MB} MB. Comprímelo primero.`); return; }
    if (kind === 'video' && file.size > 12 * 1024 * 1024
      && !window.confirm(`Este video pesa ${(file.size / 1048576).toFixed(1)} MB. Los videos de menos de ~8 MB cargan mucho más rápido en celulares. ¿Subirlo de todos modos?`)) return;
    setUploading(true);
    try { onChange(await uploadPublicFile(file, folder)); }
    catch (err) {
      alert(`Error al subir: ${err.message}\n\nSi el bucket solo permite imágenes, ejecuta la sentencia opcional "storage" al final de la migración SQL.`);
    } finally { setUploading(false); e.target.value = ''; }
  };
  return (
    <fieldset className="am-fieldset">
      <legend>{label}</legend>
      {hint && <p className="am-hint">{hint}</p>}
      <div className="am-media-row">
        {value
          ? (kind === 'video'
              ? <video className="am-media-preview" src={value} muted loop autoPlay playsInline />
              : <img className="am-media-preview" src={value} alt="" />)
          : <div className="am-media-preview am-media-empty">Ninguno</div>}
        <div className="am-media-actions">
          <label className="am-btn">
            {uploading ? 'Subiendo…' : (kind === 'video' ? 'Subir video' : 'Subir imagen')}
            <input type="file" accept={accept} onChange={onFile} disabled={uploading} hidden />
          </label>
          <input className="am-input" type="url" placeholder="…o pega una URL" value={value} onChange={e => onChange(e.target.value)} />
          {value && <button type="button" className="am-btn am-danger" onClick={() => onChange('')}>Quitar</button>}
        </div>
      </div>
    </fieldset>
  );
}

export default function AdminHeroVideo() {
  const session = useAdminSession();
  const [cfg, setCfg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  useEffect(() => {
    if (!session) return;
    loadSettings('heromedia', DEFAULTS)
      .then(setCfg)
      .catch(e => alert(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await saveSettings('heromedia', 'Hero Video', cfg); alert('¡Video principal guardado!'); }
    catch (err) { alert('Error al guardar: ' + err.message); }
    finally { setSaving(false); }
  };

  if (!session || loading) return <div className="admin-page-container">Cargando…</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Panel</Link>
        <h1 className="admin-title">Video principal</h1>
      </div>

      <form onSubmit={save} className="am-form">
        <p className="am-hint">
          Un bucle corto y silencioso (6–12 s) se reproduce detrás del título de la portada en lugar del carrusel de fotos.
          Las fotos del carrusel quedan como respaldo mientras el video carga, en conexiones con ahorro de datos y para
          visitantes que prefieren movimiento reducido. Consejo: exporta en MP4 (H.264), 1920×1080, sin audio, menos de ~8 MB.
        </p>

        <label className="am-switch am-switch--big">
          <input type="checkbox" checked={!!cfg.enabled} onChange={e => set('enabled', e.target.checked)} />
          <span>{cfg.enabled ? 'Video activado en la portada' : 'Video desactivado (solo carrusel de fotos)'}</span>
        </label>

        <MediaField label="Video de escritorio" kind="video" accept="video/mp4,video/webm" folder="hero"
          value={cfg.videoUrl} onChange={v => set('videoUrl', v)}
          hint="Horizontal (16:9). Se usa en tabletas y computadores, y en celulares si no hay video móvil definido." />
        <MediaField label="Video móvil (opcional)" kind="video" accept="video/mp4,video/webm" folder="hero"
          value={cfg.mobileVideoUrl} onChange={v => set('mobileVideoUrl', v)}
          hint="Vertical (9:16), archivo más liviano (~3–5 MB). Se usa en pantallas de menos de 768 px." />
        <MediaField label="Imagen de portada (opcional)" kind="image" accept="image/*" folder="hero"
          value={cfg.posterUrl} onChange={v => set('posterUrl', v)}
          hint="Primer cuadro que se muestra mientras el video arranca. Por defecto, la primera foto del carrusel." />

        <button type="submit" className="am-btn am-btn--primary am-save" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </form>
    </div>
  );
}
