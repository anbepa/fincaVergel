import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Navbar.css';

function smoothScroll(id) {
  // If we're already on '/' just scroll, otherwise navigate then scroll
  if (window.location.pathname === '/') {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = `/#${id}`;
  }
}

const Navbar = () => {
  const [isOpen,      setIsOpen]      = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [logoUrl,     setLogoUrl]     = useState(null);
  const [headerTitle, setHeaderTitle] = useState('FINCA VERGEL');
  const [labels, setLabels] = useState({
    home: 'Home', about: 'About Us', contact: 'Contact', admin: 'Admin',
  });
  const location  = useLocation();
  const isHeroPage = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('content_pages').select('*').eq('slug', 'layout').single();
      if (data?.content?.startsWith('{')) {
        try {
          const p = JSON.parse(data.content);
          if (p.headerTitle) setHeaderTitle(p.headerTitle);
          if (p.navLabels) setLabels(prev => ({ ...prev, ...p.navLabels }));
          if (p.headerLogo) setLogoUrl(p.headerLogo);
          else if (data.images?.[0]) setLogoUrl(data.images[0]);
        } catch {}
      }
    })();
  }, []);

  const isTransparent = isHeroPage && !scrolled && !isOpen;
  const close = () => setIsOpen(false);

  return (
    <nav className={`navbar ${isTransparent ? 'navbar-transparent' : 'navbar-solid'}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={close}>
          {logoUrl
            ? <img src={logoUrl} alt="Finca Vergel" className="navbar-logo" />
            : headerTitle}
        </Link>

        <ul className={`nav-links${isOpen ? ' active' : ''}`}>
          <li>
            <button className="nav-anchor" onClick={() => { close(); smoothScroll('farm'); }}>
              {labels.home}
            </button>
          </li>
          <li>
            <button className="nav-anchor" onClick={() => { close(); smoothScroll('our-story'); }}>
              {labels.about}
            </button>
          </li>
          <li>
            <button className="nav-anchor" onClick={() => { close(); smoothScroll('contact'); }}>
              {labels.contact}
            </button>
          </li>
          <li>
            <Link to="/admin" onClick={close} className="admin-link">{labels.admin}</Link>
          </li>
        </ul>

        <button className="mobile-menu-btn" onClick={() => setIsOpen(o => !o)} aria-label="Menu">
          <div className={`hamburger${isOpen ? ' active' : ''}`}>
            <span /><span /><span />
          </div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
