import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './GlobalEffects.css';

/* ═══════════════════════════════════════════════════════
   CUSTOM CURSOR — dot + ring (desktop only)
   ═══════════════════════════════════════════════════════ */
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const visible = useRef(false);
  const hovering = useRef(false);

  useEffect(() => {
    // Don't enable on touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      kick();
    };

    const onLeave = () => {
      visible.current = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    // Ring follows with lag via rAF — the loop stops once it has caught up
    let raf = 0;
    const animate = () => {
      const dx = pos.current.x - ringPos.current.x;
      const dy = pos.current.y - ringPos.current.y;
      ringPos.current.x += dx * 0.18;
      ringPos.current.y += dy * 0.18;
      ring.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) scale(${hovering.current ? 1.6 : 1})`;
      raf = (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) ? requestAnimationFrame(animate) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(animate); };

    // Detect hoverable elements for "grow" effect
    const onOver = (e) => {
      if (e.target instanceof Element && e.target.closest('a, button, .home-card, .lp-tricard-item, input, textarea, .btn-light, .btn-primary, .nav-anchor')) {
        hovering.current = true;
        dot.classList.add('cursor-dot--hover');
        kick();
      }
    };
    const onOut = () => {
      hovering.current = false;
      dot.classList.remove('cursor-dot--hover');
      kick();
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseout', onOut, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  // Don't render on touch
  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════ */
function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
          const progress = scrollTop / (scrollHeight - clientHeight);
          if (barRef.current) {
            barRef.current.style.transform = `scaleX(${Math.min(progress, 1)})`;
          }
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div ref={barRef} className="scroll-progress" />;
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT — all effects bundled
   ═══════════════════════════════════════════════════════ */
export default function GlobalEffects() {
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // The admin uses the native cursor (precise editing, drag & drop)
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  useEffect(() => {
    document.documentElement.classList.toggle('native-cursor', isAdmin);
  }, [isAdmin]);

  // Remove the static HTML splash (index.html) as soon as React has painted
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (!splash) return;
    splash.classList.add('splash--hide');
    const t = setTimeout(() => splash.remove(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {!isAdmin && <CustomCursor />}
      <ScrollProgress />
      {!reducedMotion && <div className="film-grain" aria-hidden="true" />}
    </>
  );
}
