import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PROFILE_AXES, subscribeLots, submitSampleRequest } from '../lib/lots';
import { getCachedPage } from '../lib/content';
import { sizedImage } from '../lib/images';
import { useToast } from './MobileEnhancements';
import './CoffeeLots.css';

/* ── Flavor profile radar (pure SVG) ── */
export function ProfileRadar({ profile = {}, size = 132 }) {
  const c = size / 2;
  const r = c - 20;
  const n = PROFILE_AXES.length;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
  };
  const values = PROFILE_AXES.map(ax => Math.min(5, Math.max(0, Number(profile?.[ax.key]) || 0)) / 5);
  const poly = values.map((v, i) => pt(i, v).join(',')).join(' ');
  return (
    <svg className="radar" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={`Perfil de sabor: ${PROFILE_AXES.map((ax, i) => `${ax.label} ${Math.round(values[i] * 5)} de 5`).join(', ')}`}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} className="radar-ring"
          points={PROFILE_AXES.map((_, i) => pt(i, f).join(',')).join(' ')} />
      ))}
      {PROFILE_AXES.map((ax, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.28);
        return (
          <g key={ax.key}>
            <line className="radar-axis" x1={c} y1={c} x2={x} y2={y} />
            <text className="radar-label" x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
              {ax.label}
            </text>
          </g>
        );
      })}
      <polygon className="radar-shape" points={poly} />
      {values.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} className="radar-dot" cx={x} cy={y} r="2.5" />; })}
    </svg>
  );
}

/* ── Sample request dialog ── */
function SampleDialog({ lot, onClose }) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const dialogRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        // Simple focus trap
        const f = dialogRef.current.querySelectorAll('button, input, select, textarea, a[href]');
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const fd = Object.fromEntries(new FormData(e.target).entries());
    if (fd.website) return; // honeypot
    setSending(true);
    const req = { ...fd, lot_id: lot?.id, lot_name: lot?.name };

    // Also notify by email (same service as the contact form). The mail
    // service is slow, so it must NOT hold the visitor waiting: the request
    // counts as received as soon as it is stored (the admin inbox is the
    // record); the email goes out in the background.
    let email = 'rosanabernal26@gmail.com';
    try { const c = JSON.parse(getCachedPage('contact')?.content || '{}'); if (c.email) email = c.email; } catch { /* ignore */ }
    const mailPromise = fetch(`https://formsubmit.co/ajax/${email}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Solicitud de muestra: ${lot?.name || 'General'}`,
        _template: 'table',
        lot: lot?.name || '—', name: fd.name, company: fd.company, email: fd.email,
        country: fd.country, quantity: fd.quantity, message: fd.message,
      }),
    }).then(r => r.ok).catch(() => false);

    const { ok } = await submitSampleRequest(req);
    const mailed = ok ? false : await mailPromise;

    setSending(false);
    if (ok || mailed) {
      setDone(true);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    } else {
      toast?.('Algo salió mal. Inténtalo de nuevo o escríbenos por correo.', 'error');
    }
  };

  return createPortal(
    <div className="sample-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="sample-dialog" role="dialog" aria-modal="true" aria-labelledby="sample-title">
        <button type="button" className="sample-close" onClick={onClose} aria-label="Cerrar">×</button>
        {done ? (
          <div className="sample-done" role="status">
            <span className="sample-done-icon" aria-hidden="true">✓</span>
            <h3 id="sample-title">Solicitud recibida</h3>
            <p>¡Gracias! Te responderemos muy pronto{lot ? <> sobre <b>{lot.name}</b></> : null}.</p>
            <button type="button" className="lots-btn" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <p className="sample-eyebrow">{lot?.available === false ? 'Lista de espera' : 'Pide una muestra'}</p>
            <h3 id="sample-title" className="sample-title">{lot?.name || 'Muestras de café verde'}</h3>
            {lot && (
              <p className="sample-meta">
                {[lot.varietal, lot.process, lot.altitude_m && `${lot.altitude_m} m`].filter(Boolean).join(' · ')}
              </p>
            )}
            <form className="sample-form" onSubmit={handleSubmit}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
              <div className="sample-row">
                <label>Nombre *<input ref={firstRef} name="name" required maxLength={120} autoComplete="name" /></label>
                <label>Empresa / Tostadora<input name="company" maxLength={160} autoComplete="organization" /></label>
              </div>
              <div className="sample-row">
                <label>Correo electrónico *<input name="email" type="email" required maxLength={200} autoComplete="email" inputMode="email" /></label>
                <label>País *<input name="country" required maxLength={80} autoComplete="country-name" /></label>
              </div>
              <label>¿Qué estás buscando?
                <select name="quantity" defaultValue={lot?.available === false ? 'Avísenme cuando esté disponible' : 'Muestra (≈250 g)'}>
                  <option>Muestra (≈250 g)</option>
                  <option>1–4 bolsas</option>
                  <option>5+ bolsas</option>
                  <option>Avísenme cuando esté disponible</option>
                  <option>Visita a la finca / otro</option>
                </select>
              </label>
              <label>Mensaje<textarea name="message" rows={3} maxLength={3000} /></label>
              <button type="submit" className="lots-btn lots-btn--solid" disabled={sending} aria-busy={sending}>
                {sending ? <><span className="btn-spinner" aria-hidden="true" />Enviando…</> : 'Enviar solicitud'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Lot card ── */
function LotCard({ lot, onRequest, index }) {
  const notes = Array.isArray(lot.flavor_notes) ? lot.flavor_notes.filter(Boolean) : [];
  const soldOut = lot.available === false;
  return (
    <article className={`lot-card${soldOut ? ' is-soldout' : ''}`} style={{ '--i': index }}>
      <div className="lot-media">
        {lot.image_url
          ? <img src={sizedImage(lot.image_url, 520)} alt="" loading="lazy" decoding="async" />
          : <div className="lot-media-fallback" aria-hidden="true">{lot.name?.[0] || '·'}</div>}
        {lot.score ? (
          <span className="lot-score" aria-label={`Puntaje SCA ${Number(lot.score)}`}>
            <b>{Number(lot.score).toString()}</b><small>SCA</small>
          </span>
        ) : null}
        {soldOut ? <span className="lot-badge">Agotado</span> : <span className="lot-badge lot-badge--available">Disponible</span>}
      </div>

      <div className="lot-body">
        <p className="lot-eyebrow">{[lot.process, lot.harvest].filter(Boolean).join(' · ') || 'Microlote'}</p>
        <h3 className="lot-name">{lot.name}</h3>
        <dl className="lot-specs">
          {lot.varietal && <div><dt>Variedad</dt><dd>{lot.varietal}</dd></div>}
          {lot.altitude_m && <div><dt>Altitud</dt><dd>{lot.altitude_m} m</dd></div>}
          {lot.bag_size && <div><dt>Bolsa</dt><dd>{lot.bag_size}</dd></div>}
        </dl>
        {notes.length > 0 && (
          <ul className="lot-notes" aria-label="Notas de cata">
            {notes.map(n => <li key={n}>{n}</li>)}
          </ul>
        )}
        <div className="lot-flip">
          <ProfileRadar profile={lot.profile} />
          {lot.description && <p className="lot-desc">{lot.description}</p>}
        </div>
        <button type="button" className="lots-btn" onClick={() => onRequest(lot)}>
          {soldOut ? 'Unirme a la lista de espera' : 'Pedir una muestra'} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

/* ── Section ── */
export default function CoffeeLots() {
  const [lots, setLots] = useState(null);
  const [filter, setFilter] = useState('All');
  const [requesting, setRequesting] = useState(undefined); // undefined = closed, null = general

  useEffect(() => subscribeLots(setLots), []);
  const close = useCallback(() => setRequesting(undefined), []);

  const processes = useMemo(() => {
    const set = new Set((lots || []).map(l => l.process).filter(Boolean));
    return ['All', ...set];
  }, [lots]);

  if (!lots) return null; // still loading
  if (lots.length === 0) {
    // No lots published yet: keep the section visible with a direct
    // invitation instead of making the catalog (and its nav link) vanish.
    return (
      <section id="coffees" className="lots">
        <div className="lots-head">
          <div>
            <p className="lp-section-eyebrow">Nuestros cafés</p>
            <h2 className="lots-title">Microlotes<br />actuales</h2>
          </div>
          <div className="lots-head-side">
            <p className="lots-intro">
              Los lotes de la nueva cosecha están en catación y puntaje. Pregúntanos
              qué está saliendo de la finca en este momento o pide una muestra de
              los lotes en preparación.
            </p>
            <a className="lots-btn lots-empty-cta" href="/contact">Contacta la finca</a>
          </div>
        </div>
      </section>
    );
  }

  const visible = filter === 'All' ? lots : lots.filter(l => l.process === filter);

  return (
    <section id="coffees" className="lots">
      <div className="lots-head">
        <div>
          <p className="lp-section-eyebrow">Nuestros cafés</p>
          <h2 className="lots-title">Microlotes<br />actuales</h2>
        </div>
        <div className="lots-head-side">
          <p className="lots-intro">
            Café verde trazable de una sola finca. Cada lote se cata, se puntúa y está
            disponible para tostadores como muestra gratuita.
          </p>
          {processes.length > 2 && (
            <div className="lots-filter" role="group" aria-label="Filtrar por proceso">
              {processes.map(p => (
                <button key={p} type="button"
                  className={`lots-chip${filter === p ? ' is-active' : ''}`}
                  aria-pressed={filter === p}
                  onClick={() => setFilter(p)}>{p === 'All' ? 'Todos' : p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lots-rail">
        {visible.map((lot, i) => <LotCard key={lot.id} lot={lot} index={i} onRequest={setRequesting} />)}
      </div>

      <div className="lots-cta">
        <span>¿Buscas algo en especial?</span>
        <button type="button" className="lots-btn lots-btn--solid" onClick={() => setRequesting(null)}>
          Hablemos de café verde
        </button>
      </div>

      {requesting !== undefined && (
        <SampleDialog lot={requesting} onClose={close} />
      )}
    </section>
  );
}
