import React, { useEffect, useState } from 'react';

/* Finca location — slopes of Poás Volcano, Alajuela (approx.) */
const LAT = 10.08;
const LON = -84.23;
const CACHE_KEY = 'fv-weather-v1';
const CACHE_MS = 30 * 60 * 1000;

/* WMO weather codes → short label */
function describe(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Misty';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Cool & cloudy';
  if (code <= 82) return 'Showers';
  return 'Tropical storm';
}

/* Central Valley calendar: harvest ≈ Nov–Mar, flowering ≈ Apr–May */
function season(month) {
  if (month >= 10 || month <= 2) return 'Harvest season';
  if (month <= 4) return 'Flowering season';
  return 'Growing season';
}

function readCache() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < CACHE_MS) return c.w;
  } catch { /* ignore */ }
  return null;
}

/**
 * "Live from the farm" pill: real temperature + conditions at the farm
 * and the current stage of the coffee year. Hides itself on any failure.
 */
export default function FarmLive() {
  const [weather, setWeather] = useState(readCache);

  useEffect(() => {
    if (weather) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    // Wait until the browser is idle so this never competes with the hero image
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const id = idle(async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=America%2FCosta_Rica`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const j = await res.json();
        const w = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code };
        if (Number.isFinite(w.temp)) {
          setWeather(w);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), w })); } catch { /* ignore */ }
        }
      } catch { /* offline / blocked → stay hidden */ }
    });
    return () => { ctrl.abort(); clearTimeout(timer); (window.cancelIdleCallback || clearTimeout)(id); };
  }, [weather]);

  if (!weather) return null;

  const crMonth = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' })).getMonth();

  return (
    <div className="farm-live" role="status" aria-label="Live conditions at the farm">
      <span className="farm-live-dot" aria-hidden="true" />
      <span className="farm-live-label">Live from the farm</span>
      <span className="farm-live-sep" aria-hidden="true" />
      <span><b>{weather.temp}°C</b> · {describe(weather.code)}</span>
      <span className="farm-live-sep" aria-hidden="true" />
      <span>{season(crMonth)}</span>
    </div>
  );
}
