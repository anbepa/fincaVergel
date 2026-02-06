import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Footer.css';

const Footer = () => {
  const [footerText, setFooterText] = useState("Hacienda Sonora, Costa Rica");
  const [footerLogo, setFooterLogo] = useState(null);
  const [links, setLinks] = useState({
      facebook: "https://www.facebook.com/haciendasonoracoffee/?fref=ts",
      instagram: "http://instagram.com/sonoracoffee"
  });

  useEffect(() => {
    fetchLayoutData();
  }, []);

  const fetchLayoutData = async () => {
    const { data } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', 'layout')
      .single();

    if (data) {
        let foundLogo = false;
        if (data.content) {
             try {
                 // Check if it's the new JSON format
                 if (data.content.startsWith('{')) {
                     const parsed = JSON.parse(data.content);
                     if (parsed.text) setFooterText(parsed.text);
                     
                     if (parsed.footerLogo) {
                         setFooterLogo(parsed.footerLogo);
                         foundLogo = true;
                     }

                     setLinks({
                         facebook: parsed.facebook || "https://www.facebook.com/haciendasonoracoffee/?fref=ts",
                         instagram: parsed.instagram || "http://instagram.com/sonoracoffee"
                     });
                 } else {
                     // Fallback for plain text legacy
                     setFooterText(data.content);
                 }
             } catch (e) {
                 setFooterText(data.content);
             }
        }
      // Assuming second image is Footer Logo if present
      if (!foundLogo && data.images && data.images.length > 1) {
        setFooterLogo(data.images[1]);
      }
    }
  };

  return (
    <footer>
      <div className="social-links">
        {links.facebook && (
            <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.15 5.96C15.21 5.96 16.12 6.04 16.12 6.04V8.51H15.02C13.78 8.51 13.39 9.28 13.39 10.07V12.06H16.18L15.74 14.96H13.39V21.96C18.16 21.21 21.82 17.06 21.82 12.06C21.82 6.53 17.32 2.04 12 2.04Z" />
            </svg>
            </a>
        )}
        {links.instagram && (
            <a href={links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24">
                <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2C22,19.4 19.4,22 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8C2,4.6 4.6,2 7.8,2M7.6,4C5.6,4 4,5.6 4,7.6V16.4C4,18.4 5.6,20 7.6,20H16.4C18.4,20 20,18.4 20,16.4V7.6C20,5.6 18.4,4 16.4,4H7.6M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M19,5A1,1 0 0,1 20,6A1,1 0 0,1 19,7A1,1 0 0,1 18,6A1,1 0 0,1 19,5Z" />
            </svg>
            </a>
        )}
      </div>
      {footerLogo && <img src={footerLogo} alt="Footer Logo" className="footer-logo" style={{ maxHeight: '50px', marginBottom: '1rem' }} />}
      <p dangerouslySetInnerHTML={{ __html: footerText }}></p>
    </footer>
  );
};

export default Footer;
