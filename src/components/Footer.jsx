import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Footer.css';

const Footer = () => {
  const [footerText, setFooterText] = useState('Specialty Coffee · Costa Rica');
  const [footerLogo, setFooterLogo] = useState(null);
  const [brandName, setBrandName]   = useState('FINCA VERGEL');
  const [links, setLinks] = useState({
    facebook:  '',
    instagram: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('content_pages').select('*').eq('slug', 'layout').single();
      if (data?.content?.startsWith('{')) {
        try {
          const p = JSON.parse(data.content);
          if (p.text)        setFooterText(p.text);
          if (p.headerTitle) setBrandName(p.headerTitle);
          if (p.footerLogo)  setFooterLogo(p.footerLogo);
          else if (data.images?.[1]) setFooterLogo(data.images[1]);
          setLinks({
            facebook:  p.facebook  || '',
            instagram: p.instagram || '',
          });
        } catch {}
      }
    })();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Brand column */}
        <div className="footer-brand-col">
          {footerLogo
            ? <img src={footerLogo} alt={brandName} className="footer-logo" />
            : <Link to="/" className="footer-brand">{brandName}</Link>}
          <p className="footer-tagline" dangerouslySetInnerHTML={{ __html: footerText }} />
          <div className="footer-social">
            {links.facebook && (
              <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.15 5.96C15.21 5.96 16.12 6.04 16.12 6.04V8.51H15.02C13.78 8.51 13.39 9.28 13.39 10.07V12.06H16.18L15.74 14.96H13.39V21.96C18.16 21.21 21.82 17.06 21.82 12.06C21.82 6.53 17.32 2.04 12 2.04Z"/></svg>
              </a>
            )}
            {links.instagram && (
              <a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2C22,19.4 19.4,22 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8C2,4.6 4.6,2 7.8,2M7.6,4C5.6,4 4,5.6 4,7.6V16.4C4,18.4 5.6,20 7.6,20H16.4C18.4,20 20,18.4 20,16.4V7.6C20,5.6 18.4,4 16.4,4H7.6M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M19,5A1,1 0 0,1 20,6A1,1 0 0,1 19,7A1,1 0 0,1 18,6A1,1 0 0,1 19,5Z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* Navigation column */}
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/aboutus">About Us</Link></li>
            <li><Link to="/thefarm">The Farm</Link></li>
            <li><Link to="/ourprocess">Our Process</Link></li>
            <li><Link to="/perfectcoffee">Perfect Coffee</Link></li>
            <li><Link to="/greenenergy">Green Energy</Link></li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="footer-col">
          <h4>Connect</h4>
          <ul>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/gettoknowus">Get to Know Us</Link></li>
            <li><Link to="/our-staff">Our Staff</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">Never settle for good enough. &copy; {new Date().getFullYear()} Finca Vergel. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
