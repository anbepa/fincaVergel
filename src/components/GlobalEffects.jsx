import React, { useEffect, useRef, useState } from 'react';
import './GlobalEffects.css';

/* ═══════════════════════════════════════════════════════
   PRELOADER — branded loading screen
   ═══════════════════════════════════════════════════════ */
function Preloader({ onDone }) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Allow at least 1.4s for the animation to play
    const t = setTimeout(() => {
      setHiding(true);
      setTimeout(onDone, 600); // matches CSS exit animation
    }, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`preloader${hiding ? ' preloader--exit' : ''}`}>
      <div className="preloader-inner">
        <div className="preloader-line" />
        <span className="preloader-text">FINCA EL VERGEL</span>
        <div className="preloader-line" />
      </div>
    </div>
  );
}

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
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    const onLeave = () => {
      visible.current = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    // Ring follows with lag via rAF
    let raf;
    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;
      ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) scale(${hovering.current ? 1.6 : 1})`;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    // Detect hoverable elements for "grow" effect
    const onOver = (e) => {
      if (e.target.closest('a, button, .home-card, .lp-tricard-item, input, textarea, .btn-light, .btn-primary, .nav-anchor')) {
        hovering.current = true;
        dot.classList.add('cursor-dot--hover');
      }
    };
    const onOut = () => {
      hovering.current = false;
      dot.classList.remove('cursor-dot--hover');
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
  const [loaded, setLoaded] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Skip preloader entirely for reduced-motion users
  useEffect(() => {
    if (reducedMotion) setLoaded(true);
  }, [reducedMotion]);

  return (
    <>
      {!loaded && <Preloader onDone={() => setLoaded(true)} />}
      <CustomCursor />
      <ScrollProgress />
      {!reducedMotion && <div className="film-grain" aria-hidden="true" />}
    </>
  );
}
