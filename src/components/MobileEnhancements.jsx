import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import useSectionNav from '../lib/useSectionNav';
import './MobileEnhancements.css';

/* ═══════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════ */
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════
   FLOATING ACTION BUTTON — Go to Contact
   ═══════════════════════════════════════════════════════ */
export function ContactFAB() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();
  const goTo = useSectionNav();

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      // Hide near the contact section itself (no point offering it there)
      const contact = document.getElementById('contact');
      const nearContact = contact && contact.getBoundingClientRect().top < window.innerHeight * 0.8;
      setVisible(window.scrollY > 400 && !nearContact);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;

  const handleClick = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    goTo('contact');
  };

  return (
    <button
      className={`fab-contact ${visible ? 'fab-visible' : ''}`}
      onClick={handleClick}
      aria-label="Contáctanos"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC THEME COLOR — changes per section
   ═══════════════════════════════════════════════════════ */
export function DynamicThemeColor() {
  useEffect(() => {
    const meta = document.getElementById('theme-color-meta');
    if (!meta) return;

    const sections = [
      { selector: '.lp-hero',       color: '#111111' },
      { selector: '.lp-manifesto',  color: '#111111' },
      { selector: '.lp-split--light', color: '#f7f3ee' },
      { selector: '.lp-split--dark',  color: '#111111' },
      { selector: '.journey',       color: '#0d0d0b' },
      { selector: '.lp-tricard',    color: '#f7f3ee' },
      { selector: '.lp-staff',      color: '#111111' },
      { selector: '.lp-contact',    color: '#111111' },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const match = sections.find(s => entry.target.matches(s.selector));
            if (match) meta.setAttribute('content', match.color);
          }
        }
      },
      { threshold: [0.3] }
    );

    // Small delay to let DOM mount
    const timer = setTimeout(() => {
      sections.forEach(s => {
        document.querySelectorAll(s.selector).forEach(el => observer.observe(el));
      });
    }, 500);

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  return null;
}

/* ═══════════════════════════════════════════════════════
   GYROSCOPE PARALLAX — subtle tilt on hero (mobile)
   ═══════════════════════════════════════════════════════ */
export function useGyroParallax(ref) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;
    if (!window.matchMedia('(hover: none)').matches) return; // only mobile

    let gamma = 0, beta = 0;
    const onOrientation = (e) => {
      gamma = (e.gamma || 0) * 0.3; // left-right tilt
      beta  = ((e.beta || 0) - 45) * 0.2; // front-back tilt (offset for hand angle)
      el.style.transform = `translate(${gamma}px, ${beta}px) scale(1.04)`;
    };

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Will be triggered by user gesture in hero tap
      el.addEventListener('click', async () => {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', onOrientation, { passive: true });
          }
        } catch {}
      }, { once: true });
    } else {
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    }

    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [ref]);
}

/* ═══════════════════════════════════════════════════════
   PAUSE OFFSCREEN ANIMATIONS — IntersectionObserver
   ═══════════════════════════════════════════════════════ */
export function usePauseOffscreen() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      '.marquee-track, .film-grain, .lp-scroll-line, .preloader-line'
    );
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          e.target.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
        });
      },
      { threshold: 0 }
    );

    targets.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════
   ROUTE PREFETCH — preload on hover/touch
   ═══════════════════════════════════════════════════════ */
export function usePrefetchRoutes() {
  useEffect(() => {
    const lazyImports = {
      '/thefarm':       () => import('../pages/TheFarm'),
      '/ourprocess':    () => import('../pages/OurProcess'),
      '/gettoknowus':   () => import('../pages/GetToKnowUs'),
      '/perfectcoffee': () => import('../pages/PerfectCoffee'),
      '/greenenergy':   () => import('../pages/GreenEnergy'),
      '/our-staff':     () => import('../pages/OurStaff'),
      '/aboutus':       () => import('../pages/AboutUs'),
      '/contact':       () => import('../pages/Contact'),
      '/home':          () => import('../pages/Home'),
    };

    const prefetched = new Set();

    const handler = (e) => {
      if (!(e.target instanceof Element)) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      const path = link.getAttribute('href');
      if (path && lazyImports[path] && !prefetched.has(path)) {
        prefetched.add(path);
        lazyImports[path](); // fire and forget
      }
    };

    document.addEventListener('pointerenter', handler, { passive: true, capture: true });
    document.addEventListener('touchstart', handler, { passive: true, capture: true });

    // Page chunks are tiny (1–4 KB): warm them all once the browser is idle
    // so navigation is instant, unless the user is on a data-saver connection.
    const saveData = navigator.connection?.saveData;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2500));
    const cancelIdle = window.cancelIdleCallback || clearTimeout;
    const idleId = saveData ? null : idle(() => {
      Object.entries(lazyImports).forEach(([path, load]) => {
        if (!prefetched.has(path)) { prefetched.add(path); load(); }
      });
    }, { timeout: 5000 });

    return () => {
      document.removeEventListener('pointerenter', handler, true);
      document.removeEventListener('touchstart', handler, true);
      if (idleId != null) cancelIdle(idleId);
    };
  }, []);
}

/* ═══════════════════════════════════════════════════════
   HAPTIC FEEDBACK — subtle vibration on button press
   ═══════════════════════════════════════════════════════ */
export function useHapticFeedback() {
  useEffect(() => {
    if (!navigator.vibrate) return;
    const handler = (e) => {
      if (e.target instanceof Element && e.target.closest('button, .btn-primary, .btn-light, .home-card, .fab-contact')) {
        navigator.vibrate(8);
      }
    };
    document.addEventListener('touchstart', handler, { passive: true });
    return () => document.removeEventListener('touchstart', handler);
  }, []);
}

/* ═══════════════════════════════════════════════════════
   SKELETON SCREEN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function Skeleton({ width = '100%', height = '1em', radius = '4px', style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page">
      <Skeleton width="40%" height="12px" />
      <Skeleton width="70%" height="48px" style={{ marginTop: '16px' }} />
      <Skeleton width="100%" height="300px" radius="0" style={{ marginTop: '32px' }} />
      <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton width="100%" height="14px" />
        <Skeleton width="95%" height="14px" />
        <Skeleton width="88%" height="14px" />
        <Skeleton width="60%" height="14px" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER — counts up when visible
   ═══════════════════════════════════════════════════════ */
export function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="animated-counter">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   LINE-BY-LINE TEXT REVEAL
   ═══════════════════════════════════════════════════════ */
export function TextRevealByLine({ text, className = '' }) {
  const ref = useRef(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const lines = text.split('\n').filter(Boolean);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= lines.length) clearInterval(interval);
          }, 180);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lines.length]);

  return (
    <div ref={ref} className={`text-reveal-container ${className}`}>
      {lines.map((line, i) => (
        <span
          key={i}
          className={`text-reveal-line ${i < visibleLines ? 'text-reveal-line--visible' : ''}`}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BOTTOM MOBILE NAV
   ═══════════════════════════════════════════════════════ */
export function BottomNav() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  const [active, setActive] = useState('top');
  const lastScroll = useRef(0);
  const goTo = useSectionNav();
  const isLanding = pathname === '/';

  // Hide on scroll down, show on scroll up (rAF-throttled, ignores tiny jitter)
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const delta = y - lastScroll.current;
      if (Math.abs(delta) < 6) return;
      setVisible(delta < 0 || y < 100);
      lastScroll.current = y;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view
  useEffect(() => {
    if (!isLanding) { setActive(null); return; }
    setActive('top');
    const ids = ['hero', 'farm', 'our-story', 'contact'];
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) setActive(e.target.id === 'hero' ? 'top' : e.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    const t = setTimeout(() => ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }), 100);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [isLanding]);

  if (pathname.startsWith('/admin')) return null;

  const scrollToSection = (id) => {
    if (navigator.vibrate) navigator.vibrate(8);
    goTo(id);
  };
  const scrollToTop = () => scrollToSection('top');
  const cls = (id) => `bottom-nav-item${active === id ? ' is-active' : ''}`;

  return (
    <nav className={`bottom-nav ${visible ? '' : 'bottom-nav--hidden'}`} aria-label="Navegación móvil">
      <button type="button" className={cls('top')} aria-current={active === 'top' ? 'true' : undefined} onClick={scrollToTop}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12l9-9 9 9"/><path d="M12 3v18"/></svg>
        <span>Inicio</span>
      </button>
      <button type="button" className={cls('farm')} aria-current={active === 'farm' ? 'true' : undefined} onClick={() => scrollToSection('farm')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10"/><path d="M12 2a15 15 0 0 0-4 10 15 15 0 0 0 4 10"/><path d="M2 12h20"/></svg>
        <span>Explora</span>
      </button>
      <button type="button" className={cls('our-story')} aria-current={active === 'our-story' ? 'true' : undefined} onClick={() => scrollToSection('our-story')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Nosotros</span>
      </button>
      <button type="button" className={cls('contact')} aria-current={active === 'contact' ? 'true' : undefined} onClick={() => scrollToSection('contact')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Contacto</span>
      </button>
    </nav>
  );
}
