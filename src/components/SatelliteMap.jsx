import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SatelliteMap.css';

/* Free satellite imagery (no API key). Attribution is required by Esri. */
const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics';

const hasLatLng = p => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng));

function pinIcon(n, active) {
  return L.divIcon({
    className: 'sat-pin-wrap',
    html: `<span class="sat-pin${active ? ' is-active' : ''}">${n}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}
function farmIcon(label) {
  return L.divIcon({
    className: 'sat-pin-wrap',
    html: `<span class="sat-farm"><span class="sat-farm-dot"></span><span class="sat-farm-label">${
      String(label || '').replace(/[<>&"]/g, '')}</span></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/**
 * Satellite map of the farm with numbered points.
 * - Public: click a pin → onSelect(index). `active` pans to that point.
 * - Admin (`editable`): click the map → onAdd({lat,lng}); drag pins → onMove(index, {lat,lng}).
 */
export default function SatelliteMap({
  location, points = [], active = -1, onSelect, editable = false, onAdd, onMove, onView, onFail,
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const cb = useRef({});
  cb.current = { onSelect, onAdd, onMove, onView, onFail };

  /* Create the map once */
  useEffect(() => {
    if (!elRef.current || !location) return;
    const touch = window.matchMedia('(hover: none)').matches;
    const map = L.map(elRef.current, {
      center: [Number(location.lat), Number(location.lng)],
      zoom: Number(location.zoom) || 15,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: true,
      scrollWheelZoom: editable,          // don't hijack page scroll on the public site
      dragging: editable || !touch,       // one-finger drag would trap scrolling on phones
      tap: false,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    /* Leaflet's zoom buttons ship English titles; localize them */
    const zin = elRef.current.querySelector('.leaflet-control-zoom-in');
    if (zin) { zin.title = 'Acercar'; zin.setAttribute('aria-label', 'Acercar'); }
    const zout = elRef.current.querySelector('.leaflet-control-zoom-out');
    if (zout) { zout.title = 'Alejar'; zout.setAttribute('aria-label', 'Alejar'); }
    const imagery = L.tileLayer(IMAGERY, { maxZoom: 19, maxNativeZoom: 18, attribution: ATTRIBUTION }).addTo(map);
    // If the imagery host is blocked (network, ad-blocker…), report it so the
    // section can fall back to the illustrated map instead of an empty box.
    let loadedTiles = 0, failedTiles = 0, reported = false;
    imagery.on('tileload', () => { loadedTiles += 1; });
    imagery.on('tileerror', () => {
      failedTiles += 1;
      if (!reported && loadedTiles === 0 && failedTiles >= 4) { reported = true; cb.current.onFail?.(); }
    });
    const failTimer = setTimeout(() => {
      if (!reported && loadedTiles === 0) { reported = true; cb.current.onFail?.(); }
    }, 12000);
    L.tileLayer(LABELS, { maxZoom: 19, maxNativeZoom: 18, opacity: 0.85 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Public map: enable wheel zoom only after the visitor clicks into it
    if (!editable) {
      map.on('click', () => map.scrollWheelZoom.enable());
      map.on('mouseout', () => map.scrollWheelZoom.disable());
    } else {
      map.on('click', e => cb.current.onAdd?.({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }));
      map.on('moveend zoomend', () => {
        const c = map.getCenter();
        cb.current.onView?.({ lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6), zoom: map.getZoom() });
      });
    }
    // Keep Leaflet in sync with the real container size (mobile address bar,
    // rotation, late layout) — otherwise it can render blank until resized.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.invalidateSize()) : null;
    ro?.observe(elRef.current);
    const t1 = setTimeout(() => map.invalidateSize(), 300);
    const t2 = setTimeout(() => map.invalidateSize(), 1200);

    return () => {
      clearTimeout(failTimer); clearTimeout(t1); clearTimeout(t2);
      ro?.disconnect();
      map.remove(); mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, editable]);

  /* Keep the view in sync when the configured zoom/center changes (admin) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location || editable) return;
    map.setView([Number(location.lat), Number(location.lng)], Number(location.zoom) || 15, { animate: false });
  }, [location?.zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Draw markers */
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    L.marker([Number(location.lat), Number(location.lng)], {
      icon: farmIcon(location.label || 'Finca El Vergel'),
      interactive: false,
      keyboard: false,
      zIndexOffset: -100,
    }).addTo(layer);

    points.forEach((p, i) => {
      if (!hasLatLng(p)) return;
      const m = L.marker([Number(p.lat), Number(p.lng)], {
        icon: pinIcon(i + 1, i === active),
        draggable: editable,
        title: p.title || `Punto ${i + 1}`,
        riseOnHover: true,
        zIndexOffset: i === active ? 1000 : 0,
      }).addTo(layer);
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        cb.current.onSelect?.(i);
      });
      if (editable) {
        m.on('dragend', () => {
          const ll = m.getLatLng();
          cb.current.onMove?.(i, { lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) });
        });
      }
    });
  }, [points, active, editable, location]);

  /* Pan to the active point (public) */
  useEffect(() => {
    const map = mapRef.current;
    const p = points[active];
    if (!map || editable || !hasLatLng(p)) return;
    map.panTo([Number(p.lat), Number(p.lng)], { animate: true, duration: 0.6 });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!location) return null;
  return <div ref={elRef} className="sat-map" aria-label="Mapa satelital de la finca" role="region" />;
}
