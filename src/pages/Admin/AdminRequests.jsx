import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAdminSession } from './adminUtils';
import './Admin.css';
import './AdminModules.css';

const STATUSES = [
  { id: 'new',       label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'sent',      label: 'Sample sent' },
  { id: 'closed',    label: 'Closed' },
];

function toCsv(rows) {
  const cols = ['created_at', 'status', 'lot_name', 'name', 'company', 'email', 'country', 'quantity', 'message'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
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
      ? 'The sample_requests table does not exist yet. Run the SQL migration in supabase/migrations first.'
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
    if (!window.confirm(`Delete the request from ${row.name}?`)) return;
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

  if (!session) return <div className="admin-page-container">Loading…</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <Link to="/admin/dashboard" className="am-back">← Dashboard</Link>
        <h1 className="admin-title">Sample Requests</h1>
        <button type="button" className="am-btn" onClick={exportCsv} disabled={!visible.length}>Export CSV</button>
      </div>

      <div className="am-tabs" role="tablist">
        {[{ id: 'all', label: 'All' }, ...STATUSES].map(s => (
          <button key={s.id} type="button" role="tab" aria-selected={filter === s.id}
            className={`am-tab${filter === s.id ? ' is-active' : ''}`} onClick={() => setFilter(s.id)}>
            {s.label} <span>{counts[s.id] || 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="am-error">{error}</div>}
      {loading ? <p>Loading…</p> : visible.length === 0 ? (
        <div className="am-empty"><p>No requests here yet.</p></div>
      ) : (
        <ul className="am-list">
          {visible.map(r => (
            <li key={r.id} className={`am-request${r.status === 'new' ? ' is-new' : ''}`}>
              <button type="button" className="am-request-head" onClick={() => setOpen(o => (o === r.id ? null : r.id))} aria-expanded={open === r.id}>
                <span className={`am-status am-status--${r.status}`}>{STATUSES.find(s => s.id === r.status)?.label || r.status}</span>
                <strong>{r.name}</strong>
                <span className="am-muted">{[r.company, r.country].filter(Boolean).join(' · ')}</span>
                <span className="am-lot">{r.lot_name || 'General enquiry'}</span>
                <time className="am-muted">{new Date(r.created_at).toLocaleDateString()}</time>
              </button>
              {open === r.id && (
                <div className="am-request-body">
                  <dl>
                    <div><dt>Email</dt><dd><a href={`mailto:${r.email}?subject=${encodeURIComponent(`Finca El Vergel — ${r.lot_name || 'your enquiry'}`)}`}>{r.email}</a></dd></div>
                    <div><dt>Looking for</dt><dd>{r.quantity || '—'}</dd></div>
                    <div><dt>Received</dt><dd>{new Date(r.created_at).toLocaleString()}</dd></div>
                  </dl>
                  {r.message && <p className="am-message">{r.message}</p>}
                  <div className="am-request-actions">
                    <label>Status{' '}
                      <select value={r.status} onChange={e => setStatus(r, e.target.value)}>
                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </label>
                    <a className="am-btn am-btn--primary" href={`mailto:${r.email}?subject=${encodeURIComponent(`Finca El Vergel — ${r.lot_name || 'your enquiry'}`)}`}
                      onClick={() => r.status === 'new' && setStatus(r, 'contacted')}>Reply by email</a>
                    <button type="button" className="am-btn am-danger" onClick={() => remove(r)}>Delete</button>
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
