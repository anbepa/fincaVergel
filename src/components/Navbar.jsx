import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [headerTitle, setHeaderTitle] = useState("");

  useEffect(() => {
    fetchLayoutData();
  }, []);

  const fetchLayoutData = async () => {
    // We use the 'layout' slug for global settings like Header/Footer
    const { data } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', 'layout')
      .single();

    if (data) {
        let foundLogo = false;
        // Parse Title and Logo from JSON if available
        if (data.content && data.content.startsWith('{')) {
             try {
                 const parsed = JSON.parse(data.content);
                 if (parsed.headerTitle) setHeaderTitle(parsed.headerTitle);
                 if (parsed.headerLogo) {
                     setLogoUrl(parsed.headerLogo);
                     foundLogo = true;
                 }
             } catch (e) {
                 // ignore
             }
        }

        if (!foundLogo && data.images && data.images.length > 0) {
            // Fallback: Assuming the first image is the Header Logo
            setLogoUrl(data.images[0]);
        }
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/aboutus" onClick={closeMenu}>About us</Link></li>
          <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
          <li><Link to="/admin" onClick={closeMenu} className="admin-link">ADMIN</Link></li>
        </ul>

        <div className="mobile-menu-btn" onClick={toggleMenu}>
          <div className={`hamburger ${isOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <Link to="/" className="brand" onClick={closeMenu}>
          {logoUrl ? (
             <img src={logoUrl} alt="Sonora Coffee" className="navbar-logo" style={{ maxHeight: '40px' }} />
          ) : (
            headerTitle
          )}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
