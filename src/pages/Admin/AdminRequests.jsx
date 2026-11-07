import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAdminSession } from './adminUtils';
import './Admin.css';
import './AdminModules.css';

const STATUSES = [
  { id: 'new',       label: 'Nueva' },
  { id: 'contacted', label: 'Contactada' },
  { id: 'sent',      label: 'Muestra enviada' },
  { id: 'closed',    label: 'Cerrada' },
];

function toCsv(rows) {
  const cols = ['created_at', 'status', 'lot_name', 'name', 'company', 'email', 'country', 'quantity', 'message'];
  /* These fields come from the public form: a cell starting with = + - @
     (after spaces) would run as a formula when the CSV is opened in a
     spreadsheet. Neutralize it with a leading apostrophe. */
  const safe = v => {
    const s = String(v ?? '');
    return /^[ \t]*[=+\-@]/.test(s) ? `'${s}` : s;
  };
  const esc = v => `"${safe(v).replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

export default function AdminRequests() {
  const session = useAdminSession();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sample_requests').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) setError(error.message.includes('does not exist')
      ? 'La tabla sample_requests aún no existe. Ejecuta primero la migración SQL en supabase/migrations.'
      : error.message);
    else { setRows(data || []); setError(''); }
    setLoading(false);
  };
  useEffect(() => { if (session) load(); }, [session]);

  const counts = useMemo(() => {
    const c = { all: rows.length };
    STATUSES.forEach(s => { c[s.id] = rows.filter(r => r.status === s.id).length; });
    return c;
  }, [rows]);
  const visible = filter === 'all' ? rows : rows.filter(r => r.status === filter);

  const setStatus = async (row, status) => {
    setRows(rs => rs.map(r => (r.id === row.id ? { ...r, status } : r)));
    const { error } = await supabase.from('sample_requests').update({ status }).eq('id', row.id);
    if (error) { alert(error.message); load(); }
  };

  const remove = async (row) => {
    if (!window.confirm(`¿Eliminar la solicitud de ${row.name}?`)) return;
    const { error } = await supabase.from('sample_requests').delete().eq('id', row.id);
    if (error) { alert(error.message); return; }
    setRows(rs => rs.filter(r => r.id !== row.id));
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(visible)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sample-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!session) return <div className="admin-page-container">Cargando…</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Panel</Link>
        <h1 className="admin-title">Solicitudes de muestra</h1>
        <button type="button" className="am-btn" onClick={exportCsv} disabled={!visible.length}>Exportar CSV</button>
      </div>

      <div className="am-tabs" role="tablist">
        {[{ id: 'all', label: 'Todas' }, ...STATUSES].map(s => (
          <button key={s.id} type="button" role="tab" aria-selected={filter === s.id}
            className={`am-tab${filter === s.id ? ' is-active' : ''}`} onClick={() => setFilter(s.id)}>
            {s.label} <span>{counts[s.id] || 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="am-error">{error}</div>}
      {loading ? <p>Cargando…</p> : visible.length === 0 ? (
        <div className="am-empty"><p>Aún no hay solicitudes aquí.</p></div>
      ) : (
        <ul className="am-list">
          {visible.map(r => (
            <li key={r.id} className={`am-request${r.status === 'new' ? ' is-new' : ''}`}>
              <button type="button" className="am-request-head" onClick={() => setOpen(o => (o === r.id ? null : r.id))} aria-expanded={open === r.id}>
                <span className={`am-status am-status--${r.status}`}>{STATUSES.find(s => s.id === r.status)?.label || r.status}</span>
                <strong>{r.name}</strong>
                <span className="am-muted">{[r.company, r.country].filter(Boolean).join(' · ')}</span>
                <span className="am-lot">{r.lot_name || 'Consulta general'}</span>
                <time className="am-muted">{new Date(r.created_at).toLocaleDateString()}</time>
              </button>
              {open === r.id && (
                <div className="am-request-body">
                  <dl>
                    <div><dt>Correo</dt><dd><a href={`mailto:${r.email}?subject=${encodeURIComponent(`Finca El Vergel — ${r.lot_name || 'tu consulta'}`)}`}>{r.email}</a></dd></div>
                    <div><dt>Busca</dt><dd>{r.quantity || '—'}</dd></div>
                    <div><dt>Recibida</dt><dd>{new Date(r.created_at).toLocaleString()}</dd></div>
                  </dl>
                  {r.message && <p className="am-message">{r.message}</p>}
                  <div className="am-request-actions">
                    <label>Estado{' '}
                      <select value={r.status} onChange={e => setStatus(r, e.target.value)}>
                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </label>
                    <a className="am-btn am-btn--primary" href={`mailto:${r.email}?subject=${encodeURIComponent(`Finca El Vergel — ${r.lot_name || 'tu consulta'}`)}`}
                      onClick={() => r.status === 'new' && setStatus(r, 'contacted')}>Responder por correo</a>
                    <button type="button" className="am-btn am-danger" onClick={() => remove(r)}>Eliminar</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
