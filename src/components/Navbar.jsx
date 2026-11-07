import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { subscribePage } from '../lib/content';
import { subscribeLots } from '../lib/lots';
import useSectionNav from '../lib/useSectionNav';
import './Navbar.css';

const Navbar = () => {
  const [isOpen,      setIsOpen]      = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [logoUrl,     setLogoUrl]     = useState(null);
  const [headerTitle, setHeaderTitle] = useState('FINCA VERGEL');
  const [labels, setLabels] = useState({
    home: 'Inicio', about: 'Nosotros', contact: 'Contacto', coffees: 'Nuestros cafés',
  });
  const [hasLots, setHasLots] = useState(false);
  const location  = useLocation();
  const goTo = useSectionNav();
  const isHeroPage = location.pathname === '/';

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setScrolled(window.scrollY > 60); ticking = false; });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => subscribePage('layout', (data) => {
    if (!data?.content?.startsWith('{')) return;
    try {
      const p = JSON.parse(data.content);
      if (p.headerTitle) setHeaderTitle(p.headerTitle);
      if (p.navLabels) setLabels(prev => ({ ...prev, ...p.navLabels }));
      if (p.headerLogo) setLogoUrl(p.headerLogo);
      else if (data.images?.[0]) setLogoUrl(data.images[0]);
    } catch { /* ignore */ }
  }), []);

  useEffect(() => subscribeLots(l => setHasLots(Array.isArray(l) && l.length > 0)), []);

  /* Close the menu on route change, lock page scroll + Escape while open */
  useEffect(() => { setIsOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isOpen]);

  const isTransparent = isHeroPage && !scrolled && !isOpen;
  const go = (id) => { setIsOpen(false); goTo(id); };

  return (
    <nav className={`navbar ${isTransparent ? 'navbar-transparent' : 'navbar-solid'}${isOpen ? ' navbar-open' : ''}`} aria-label="Principal">
      <div className="navbar-container">
        <Link
          to="/"
          className="navbar-brand"
          onClick={(e) => { if (isHeroPage) { e.preventDefault(); go('top'); } else setIsOpen(false); }}
        >
          {logoUrl
            ? <img src={logoUrl} alt={headerTitle} className="navbar-logo" height="40" decoding="async" />
            : headerTitle}
        </Link>

        <ul id="primary-nav" className={`nav-links${isOpen ? ' active' : ''}`}>
          <li><button type="button" className="nav-anchor" onClick={() => go('top')}>{labels.home}</button></li>
          {hasLots && <li><button type="button" className="nav-anchor" onClick={() => go('coffees')}>{labels.coffees}</button></li>}
          <li><button type="button" className="nav-anchor" onClick={() => go('our-story')}>{labels.about}</button></li>
          <li><button type="button" className="nav-anchor nav-anchor--cta" onClick={() => go('contact')}>{labels.contact}</button></li>
        </ul>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsOpen(o => !o)}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
          aria-controls="primary-nav"
        >
          <span className={`hamburger${isOpen ? ' active' : ''}`} aria-hidden="true">
            <span /><span /><span />
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
