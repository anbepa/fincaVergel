import React, { useEffect, useState } from 'react';
import { getCachedPage, subscribePage } from '../lib/content';

/* Location, time zone and harvest months come from Admin → Farm Map */
const CACHE_KEY = 'fv-weather-v2';
const CACHE_MS = 30 * 60 * 1000;

/* WMO weather codes → short label */
function describe(code) {
  if (code === 0) return 'Cielo despejado';
  if (code <= 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code <= 48) return 'Neblina';
  if (code <= 57) return 'Llovizna';
  if (code <= 67) return 'Lluvia';
  if (code <= 77) return 'Fresco y nublado';
  if (code <= 82) return 'Chubascos';
  return 'Tormenta tropical';
}

function readSettings(row) {
  try {
    const p = JSON.parse(row?.content || 'null');
    const loc = p?.location;
    if (!loc || !Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng)) || loc.lat === '' || loc.lng === '') return null;
    return {
      lat: Number(loc.lat), lng: Number(loc.lng),
      timezone: loc.timezone || 'auto',
      harvestMonths: Array.isArray(p.harvestMonths) ? p.harvestMonths : [],
      live: p.liveWidget !== false,
    };
  } catch { return null; }
}

function readCache(key) {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && c.key === key && Date.now() - c.t < CACHE_MS) return c.w;
  } catch { /* ignore */ }
  return null;
}

/**
 * "Live from the farm" pill: real temperature + conditions at the farm
 * and the current stage of the coffee year. Hides itself on any failure.
 */
export default function FarmLive() {
  const [settings, setSettings] = useState(() => readSettings(getCachedPage('farmmap')));
  useEffect(() => subscribePage('farmmap', row => setSettings(readSettings(row))), []);
  const key = settings ? `${settings.lat},${settings.lng}` : '';
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!settings || !settings.live) return;
    const cached = readCache(key);
    if (cached) { setWeather(cached); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    // Wait until the browser is idle so this never competes with the hero image
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const id = idle(async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${settings.lat}&longitude=${settings.lng}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(settings.timezone)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const j = await res.json();
        const w = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code };
        if (Number.isFinite(w.temp)) {
          setWeather(w);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, t: Date.now(), w })); } catch { /* ignore */ }
        }
      } catch { /* offline / blocked → stay hidden */ }
    });
    return () => { ctrl.abort(); clearTimeout(timer); (window.cancelIdleCallback || clearTimeout)(id); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!settings || !settings.live || !weather) return null;

  let month = new Date().getMonth();
  try {
    if (settings.timezone !== 'auto') month = new Date(new Date().toLocaleString('en-US', { timeZone: settings.timezone })).getMonth();
  } catch { /* invalid tz → local month */ }
  const inHarvest = settings.harvestMonths.includes(month);

  return (
    <div className="farm-live" role="status" aria-label="Condiciones en vivo en la finca">
      <span className="farm-live-dot" aria-hidden="true" />
      <span className="farm-live-label">En vivo desde la finca</span>
      <span className="farm-live-sep" aria-hidden="true" />
      <span><b>{weather.temp}°C</b> · {describe(weather.code)}</span>
      {inHarvest && <><span className="farm-live-sep" aria-hidden="true" /><span>Temporada de cosecha</span></>}
    </div>
  );
}
