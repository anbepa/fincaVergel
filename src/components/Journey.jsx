import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LazyBackground from './LazyBackground';
import './Journey.css';

/* Plain-text excerpt from CMS HTML (first paragraph or two) */
export function htmlExcerpt(html, maxChars = 260) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const paras = Array.from(tmp.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
  let text = (paras.length ? paras : [tmp.textContent.trim()]).join(' ');
  if (text.length > maxChars) text = text.slice(0, maxChars).replace(/\s+\S*$/, '') + '…';
  return text;
}

/**
 * "De la cereza a la taza" — an immersive chapter journey.
 * Desktop: the section is pinned and vertical scroll moves the chapters
 * horizontally (native scroll, no scroll-jacking).
 * Mobile / reduced motion: full-screen cards that stack over each other.
 */
export default function Journey({ id, eyebrow, title, chapters }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(0);
  const [horizontal, setHorizontal] = useState(false);
  const n = chapters.length;

  /* Decide layout */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    const update = () => setHorizontal(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  /* Start loading chapter images shortly before the section arrives */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Scroll → horizontal progress (desktop only) */
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    if (!horizontal) {
      track.style.transform = '';
      return;
    }
    let ticking = false;
    let inView = false;
    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      track.style.transform = `translate3d(${(-p * (n - 1) * 100 / n).toFixed(3)}%, 0, 0)`;
      if (barRef.current) barRef.current.style.transform = `scaleX(${(p * (n - 1) + 1) / n})`;
      const idx = Math.min(n - 1, Math.round(p * (n - 1)));
      setActive(a => (a === idx ? a : idx));
    };
    const onScroll = () => {
      if (inView && !ticking) { ticking = true; requestAnimationFrame(update); }
    };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) update(); });
    io.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [horizontal, n]);

  /* Jump to a chapter from the progress dots */
  const goToChapter = (i) => {
    const section = sectionRef.current;
    if (!section) return;
    const total = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY + (total * i) / (n - 1);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`journey ${horizontal ? 'journey--h' : 'journey--stack'}`}
      style={horizontal ? { height: `${n * 100}vh` } : undefined}
      aria-label={title}
      data-nav="dark"
    >
      <div className="journey-sticky">
        {horizontal && (
          <div className="journey-hud" aria-hidden="true">
            <span className="journey-hud-eyebrow">{eyebrow}</span>
            <span className="journey-hud-count">
              <b>{String(active + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}
            </span>
          </div>
        )}

        <div
          ref={trackRef}
          className="journey-track"
          style={horizontal ? { width: `${n * 100}%` } : undefined}
        >
          {chapters.map((c, i) => {
            const Bg = near ? LazyBackground : 'div';
            const bgProps = near ? { src: c.image, eager: true } : {};
            return (
              <article
                key={c.key}
                id={c.anchor}
                className={`journey-panel${i === active ? ' is-active' : ''}`}
                style={horizontal ? { width: `${100 / n}%` } : undefined}
              >
                <Bg className="journey-bg" {...bgProps} aria-hidden="true" />
                <div className="journey-shade" aria-hidden="true" />
                <span className="journey-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="journey-content">
                  <p className="journey-eyebrow">{String(i + 1).padStart(2, '0')} — {c.eyebrow}</p>
                  <h2 className="journey-title">{c.title}</h2>
                  <p className="journey-text">{c.text}</p>
                  {c.href && (
                    <Link to={c.href} className="journey-link">
                      Descubre más <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {horizontal && (
          <div className="journey-progress">
            <div className="journey-progress-bar"><span ref={barRef} /></div>
            <div className="journey-dots">
              {chapters.map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  className={`journey-dot${i === active ? ' is-active' : ''}`}
                  onClick={() => goToChapter(i)}
                  aria-label={`Ir a ${c.title}`}
                  aria-current={i === active ? 'step' : undefined}
                >
                  <span>{c.eyebrow}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
