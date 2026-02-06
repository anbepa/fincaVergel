import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Landing.css';

const defaultImages = [];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '' });
  const [btnLabel, setBtnLabel] = useState("Get to know us");
  const [landingData, setLandingData] = useState({
    images: defaultImages,
    subtitle: "Costa Rican Specialty coffee",
    title: "FINCA EL VERGEL",
    desc: "Costa Rican Specialty Coffee"
  });

  useEffect(() => {
    // Fetch Landing specific data
    const fetchLandingData = async () => {
      const { data } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', 'landing')
        .single();

      if (data) {
        // Parse content field which we stored as pipe separated string or similar structure
        // Or we can just use simple logic if user puts all text in content
        // For simplicity let's assume content has: subtitle|title|desc
        let newSubtitle = landingData.subtitle;
        let newTitle = landingData.title;
        let newDesc = landingData.desc;

        if (data.content) {
            const parts = data.content.split('|');
            if (parts.length >= 1) newSubtitle = parts[0];
            if (parts.length >= 2) newTitle = parts[1];
            if (parts.length >= 3) newDesc = parts[2];
        }

        setLandingData({
          images: (data.images && data.images.length > 0) ? data.images : defaultImages,
          subtitle: newSubtitle,
          title: newTitle,
          desc: newDesc
        });
      }
    };

    // Fetch Global Layout data for Social Links (Reusing Admin logic from Footer)
    const fetchLoyoutData = async () => {
        const { data } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', 'layout')
        .single();
        
        if (data && data.content && data.content.startsWith('{')) {
            try {
                const parsed = JSON.parse(data.content);
                setSocialLinks({
                    facebook: parsed.facebook || '',
                    instagram: parsed.instagram || ''
                });
            } catch (e) {
                console.error("Error parsing layout JSON:", e);
            }
        }
    };

    fetchLandingData();
    // fetchLoyoutData logic was here but better to separate or reuse logic
    const fetchLoyoutData = async () => {
        const { data } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', 'layout')
        .single();
        
        if (data && data.content && data.content.startsWith('{')) {
            try {
                const parsed = JSON.parse(data.content);
                setSocialLinks({
                    facebook: parsed.facebook || '',
                    instagram: parsed.instagram || ''
                });
                if (parsed.navLabels && parsed.navLabels.landingBtn) {
                    setBtnLabel(parsed.navLabels.landingBtn);
                }
            } catch (e) {
                console.error("Error parsing layout JSON:", e);
            }
        }
    };
    fetchLoyoutData();
    
    // Slider logic
    const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % ((landingData.images || defaultImages).length));
    }, 5000);
    return () => clearInterval(interval);
  }, [landingData.images.length]); // Re-run effect if images count changes, though mostly for the interval

  return (
    <div className="landing-page">
      <div className="bg-slider">
        {landingData.images.map((img, index) => (
          <div 
            key={index} 
            className={`bg-slide ${index === currentImage ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>
      
      <div className="landing-content">
        <h2 className="landing-subtitle">{landingData.subtitle}</h2>
        <h1 className="landing-title">{landingData.title}</h1>
        <p className="landing-desc">{landingData.desc}</p>
        <Link to="/home" className="btn-landing">{btnLabel}</Link>
        
        <div className="landing-socials">
             {/* Dynamic Social Icons from Admin */}
             {socialLinks.facebook && (
                 <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="social-icon" style={{color:'#333'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                 </a>
             )}
             {socialLinks.instagram && (
                 <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="social-icon" style={{color:'#333'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                 </a>
             )}
        </div>
      </div>
      
       {/* Instruction for admin (hidden from view but useful for dev context)
           Admin should enter text as: Subtitle|Title|Description
       */}
    </div>
  );
};

export default Landing;
