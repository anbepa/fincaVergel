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
    if (file.size > MAX_MB * 1024 * 1024) { alert(`File is larger than ${MAX_MB} MB. Please compress it first.`); return; }
    if (kind === 'video' && file.size > 12 * 1024 * 1024
      && !window.confirm(`This video is ${(file.size / 1048576).toFixed(1)} MB. Videos under ~8 MB load much faster on phones. Upload anyway?`)) return;
    setUploading(true);
    try { onChange(await uploadPublicFile(file, folder)); }
    catch (err) {
      alert(`Upload failed: ${err.message}\n\nIf the bucket only allows images, run the optional "storage" statement at the end of the SQL migration.`);
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
          : <div className="am-media-preview am-media-empty">None</div>}
        <div className="am-media-actions">
          <label className="am-btn">
            {uploading ? 'Uploading…' : `Upload ${kind}`}
            <input type="file" accept={accept} onChange={onFile} disabled={uploading} hidden />
          </label>
          <input className="am-input" type="url" placeholder="…or paste a URL" value={value} onChange={e => onChange(e.target.value)} />
          {value && <button type="button" className="am-btn am-danger" onClick={() => onChange('')}>Remove</button>}
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
    try { await saveSettings('heromedia', 'Hero Video', cfg); alert('Hero video saved!'); }
    catch (err) { alert('Error saving: ' + err.message); }
    finally { setSaving(false); }
  };

  if (!session || loading) return <div className="admin-page-container">Loading…</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Dashboard</Link>
        <h1 className="admin-title">Hero Video</h1>
      </div>

      <form onSubmit={save} className="am-form">
        <p className="am-hint">
          A short silent loop (6–12 s) plays behind the homepage title instead of the photo slideshow.
          The slideshow photos stay as a fallback while the video loads, on data-saver connections and for
          visitors who prefer reduced motion. Tip: export MP4 (H.264), 1920×1080, no audio, under ~8 MB.
        </p>

        <label className="am-switch am-switch--big">
          <input type="checkbox" checked={!!cfg.enabled} onChange={e => set('enabled', e.target.checked)} />
          <span>{cfg.enabled ? 'Video enabled on the homepage' : 'Video disabled (photo slideshow only)'}</span>
        </label>

        <MediaField label="Desktop video" kind="video" accept="video/mp4,video/webm" folder="hero"
          value={cfg.videoUrl} onChange={v => set('videoUrl', v)}
          hint="Landscape (16:9). Used on tablets and computers — and on phones if no mobile video is set." />
        <MediaField label="Mobile video (optional)" kind="video" accept="video/mp4,video/webm" folder="hero"
          value={cfg.mobileVideoUrl} onChange={v => set('mobileVideoUrl', v)}
          hint="Portrait (9:16), smaller file (~3–5 MB). Used on screens under 768 px." />
        <MediaField label="Poster image (optional)" kind="image" accept="image/*" folder="hero"
          value={cfg.posterUrl} onChange={v => set('posterUrl', v)}
          hint="First frame shown while the video starts. Defaults to the first slideshow photo." />

        <button type="submit" className="am-btn am-btn--primary am-save" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
