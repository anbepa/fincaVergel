import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { subscribePage, getCachedPage } from '../lib/content';
import { sizedImage } from '../lib/images';
import './FarmMap.css';

const SatelliteMap = lazy(() => import('./SatelliteMap'));

/* Shown until the admin configures the map (positions in % of the map) */
export const DEFAULT_MAP = {
  enabled: true,
  title: 'Explore the farm',
  intro: 'Tap a point to discover each corner of the estate.',
  mapImage: '',
  points: [
    { id: 'plots',   x: 34, y: 58, title: 'Shaded coffee plots', text: '55 hectares of Arabica growing under native shade trees at around 1,200 m above sea level.', image: '' },
    { id: 'forest',  x: 70, y: 28, title: 'Forest reserve',      text: '35 hectares of wild forest that shelter birds and wildlife and protect our water springs.', image: '' },
    { id: 'mill',    x: 56, y: 70, title: 'Micro-mill',          text: 'Where every lot is processed: honey and natural methods that save water and build flavor.', image: '' },
    { id: 'trapiche',x: 22, y: 32, title: '150-year-old sugar mill', text: 'The historic trapiche next to our micro-mill — the heart of the farm for generations.', image: '' },
    { id: 'drying',  x: 80, y: 62, title: 'Drying patios',       text: 'Cherries dry slowly under the sun on raised beds and patios, turned by hand.', image: '' },
  ],
};

export function parseMap(row) {
  if (!row?.content) return null;
  try {
    const p = JSON.parse(row.content);
    return {
      ...DEFAULT_MAP,
      ...p,
      title: p.title || DEFAULT_MAP.title,
      intro: p.intro || DEFAULT_MAP.intro,
      points: Array.isArray(p.points) ? p.points : [],
    };
  } catch { return null; }
}

export const validLocation = (loc) =>
  !!loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng)) && loc.lat !== '' && loc.lng !== '';

/** 'satellite' | 'image' | 'illustration' (explicit setting, else inferred) */
export function mapMode(cfg) {
  if (cfg.mode === 'satellite' && validLocation(cfg.location)) return 'satellite';
  if (cfg.mode === 'image' && cfg.mapImage) return 'image';
  if (cfg.mode === 'illustration') return 'illustration';
  if (validLocation(cfg.location)) return 'satellite';
  return cfg.mapImage ? 'image' : 'illustration';
}

export function directionsUrl(loc) {
  return validLocation(loc) ? `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}` : null;
}

/* Stylised topographic illustration (no image download) */
export function MapIllustration() {
  const rings = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);
  return (
    <svg className="map-illustration" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="mapGlow" cx="72%" cy="18%" r="75%">
          <stop offset="0" stopColor="#3b4a31" />
          <stop offset=".55" stopColor="#25301f" />
          <stop offset="1" stopColor="#161b13" />
        </radialGradient>
        <pattern id="rows" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          <circle cx="4" cy="11" r="3.2" fill="#4f6b3a" opacity=".55" />
          <circle cx="15" cy="11" r="3.2" fill="#4f6b3a" opacity=".55" />
        </pattern>
      </defs>
      <rect width="1600" height="1000" fill="url(#mapGlow)" />
      {/* Contour lines radiating from the volcano (top right) */}
      {rings.map(i => (
        <path key={i}
          d={`M ${1240 - i * 95} ${-40} C ${1180 - i * 110} ${180 + i * 40}, ${1420 - i * 30} ${260 + i * 70}, ${1700} ${200 + i * 85}`}
          fill="none" stroke="#c8b48f" strokeOpacity={0.22 - i * 0.012} strokeWidth="1.4" />
      ))}
      {rings.map(i => (
        <ellipse key={`e${i}`} cx="1320" cy="-60" rx={160 + i * 120} ry={120 + i * 95}
          fill="none" stroke="#c8b48f" strokeOpacity={0.16 - i * 0.01} strokeWidth="1" strokeDasharray={i % 3 === 0 ? '0' : '3 7'} />
      ))}
      {/* Coffee plots */}
      <path d="M180 520 C 320 430, 560 450, 700 560 S 760 800, 560 860 S 140 820, 160 680 Z" fill="url(#rows)" />
      <path d="M760 420 C 900 380, 1040 430, 1060 520 S 960 640, 840 610 S 700 480, 760 420 Z" fill="url(#rows)" />
      {/* Forest reserve */}
      {Array.from({ length: 70 }, (_, i) => {
        const x = 980 + ((i * 137) % 520), y = 120 + ((i * 89) % 300);
        return <circle key={`t${i}`} cx={x} cy={y} r={14 + (i % 5) * 4} fill="#2f4a2a" opacity=".75" />;
      })}
      {/* River */}
      <path d="M 1600 520 C 1380 560, 1240 470, 1080 600 S 760 760, 520 940 L 480 1000"
        fill="none" stroke="#6fa0b5" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round" />
      {/* Paths */}
      <path d="M 0 360 C 260 380, 380 300, 560 420 S 820 720, 1000 700 S 1300 640, 1600 760"
        fill="none" stroke="#e8dcc4" strokeOpacity=".35" strokeWidth="3" strokeDasharray="10 10" />
      {/* Labels */}
      <g fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" letterSpacing="6" fill="#e8dcc4" fillOpacity=".55" fontSize="22">
        <text x="1250" y="70">▲ POÁS VOLCANO</text>
        <text x="60" y="960" fontSize="18" fillOpacity=".4">ALAJUELA · COSTA RICA</text>
      </g>
      {/* Compass */}
      <g transform="translate(1500 900)" stroke="#e8dcc4" strokeOpacity=".5" fill="none">
        <circle r="34" />
        <path d="M0 -26 L 7 0 L 0 26 L -7 0 Z" fill="#e8dcc4" fillOpacity=".35" />
        <text y="-44" textAnchor="middle" fill="#e8dcc4" fillOpacity=".6" stroke="none" fontSize="16" fontFamily="sans-serif">N</text>
      </g>
    </svg>
  );
}

export default function FarmMap() {
  const [config, setConfig] = useState(() => parseMap(getCachedPage('farmmap')) || DEFAULT_MAP);
  const [active, setActive] = useState(0);
  const [ratio, setRatio] = useState(null); // aspect ratio of an uploaded map image
  const [near, setNear] = useState(false);  // load the satellite map only when close
  const sectionRef = useRef(null);

  useEffect(() => subscribePage('farmmap', row => setConfig(parseMap(row) || DEFAULT_MAP)), []);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mode = mapMode(config);
  const points = mode === 'satellite'
    ? (config.points || []).filter(p => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
    : (config.points?.length ? config.points.filter(p => Number.isFinite(Number(p.x))) : (mode === 'illustration' ? DEFAULT_MAP.points : []));
  useEffect(() => { if (active >= points.length) setActive(0); }, [points.length, active]);

  if (config.enabled === false) return null;
  const current = points[active];
  const loc = validLocation(config.location) ? config.location : null;
  const directions = directionsUrl(loc);

  return (
    <section id="farm-map" className="fmap" data-nav="dark" ref={sectionRef}>
      <div className="fmap-head">
        <p className="lp-section-eyebrow">{mode === 'satellite' ? 'Satellite view' : 'Interactive map'}</p>
        <h2 className="fmap-title">{config.title || DEFAULT_MAP.title}</h2>
        {config.intro && <p className="fmap-intro">{config.intro}</p>}
      </div>

      <div className={`fmap-layout${current ? '' : ' fmap-layout--solo'}`}>
        <div className={`fmap-canvas fmap-canvas--${mode}`} style={mode === 'image' && ratio ? { aspectRatio: ratio } : undefined}>
          {mode === 'satellite' ? (
            near && (
              <Suspense fallback={<div className="fmap-loading">Loading satellite view…</div>}>
                <SatelliteMap location={loc} points={points} active={active} onSelect={setActive} />
              </Suspense>
            )
          ) : mode === 'image' ? (
            <img
              className="fmap-img"
              src={sizedImage(config.mapImage, 1400)}
              alt={`Map of ${config.title || 'the farm'}`}
              loading="lazy"
              decoding="async"
              onLoad={e => setRatio(`${e.currentTarget.naturalWidth} / ${e.currentTarget.naturalHeight}`)}
            />
          ) : <MapIllustration />}

          {mode !== 'satellite' && points.map((pt, i) => (
            <button
              key={pt.id || i}
              type="button"
              className={`fmap-pin${i === active ? ' is-active' : ''}`}
              style={{ left: `${pt.x}%`, top: `${pt.y}%`, '--d': `${i * 0.12}s` }}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-label={pt.title}
              aria-pressed={i === active}
            >
              <span className="fmap-pin-dot">{i + 1}</span>
              <span className="fmap-pin-label" aria-hidden="true">{pt.title}</span>
            </button>
          ))}

          {directions && (
            <a className="fmap-directions" href={directions} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.7 11.3l-9-9a1 1 0 0 0-1.4 0l-9 9a1 1 0 0 0 0 1.4l9 9a1 1 0 0 0 1.4 0l9-9a1 1 0 0 0 0-1.4zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5-3.5 3.5z" /></svg>
              Get directions
            </a>
          )}
        </div>

        {current && (
          <aside className="fmap-card" aria-live="polite">
            {current.image && (
              <img key={current.image} className="fmap-card-img" src={sizedImage(current.image, 520)} alt="" loading="lazy" decoding="async" />
            )}
            <div className="fmap-card-body" key={active}>
              <span className="fmap-card-num">{String(active + 1).padStart(2, '0')} / {String(points.length).padStart(2, '0')}</span>
              <h3 className="fmap-card-title">{current.title}</h3>
              {current.text && <p className="fmap-card-text">{current.text}</p>}
              <div className="fmap-card-nav">
                <button type="button" onClick={() => setActive(a => (a - 1 + points.length) % points.length)} aria-label="Previous point">←</button>
                <button type="button" onClick={() => setActive(a => (a + 1) % points.length)} aria-label="Next point">→</button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {loc && (
        <div className="fmap-facts">
          {loc.label && <span><b>{loc.label}</b></span>}
          {loc.region && <span>{loc.region}</span>}
          {config.altitude ? <span>{Number(config.altitude).toLocaleString('en-US')} m a.s.l.</span> : null}
          <span>{Math.abs(Number(loc.lat)).toFixed(4)}° {Number(loc.lat) >= 0 ? 'N' : 'S'} · {Math.abs(Number(loc.lng)).toFixed(4)}° {Number(loc.lng) >= 0 ? 'E' : 'W'}</span>
        </div>
      )}
    </section>
  );
}
