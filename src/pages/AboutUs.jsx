import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ImageCarousel from '../components/ImageCarousel';
import './AboutUs.css';

const AboutUs = () => {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  
  const [content, setContent] = useState([]);

  useEffect(() => {
    const fetchAboutData = async () => {
        const { data } = await supabase
            .from('content_pages')
            .select('*')
            .eq('slug', 'aboutus')
            .single();

        if (data) {
            if (data.title) setTitle(data.title);
            if (data.images && data.images.length > 0) {
                setImages(data.images);
            }
            
            // Parse custom JSON content from Admin
            if (data.content && data.content.startsWith('{')) {
                try {
                    const parsed = JSON.parse(data.content);
                    
                    if (parsed.sections && Array.isArray(parsed.sections)) {
                        setContent(parsed.sections);
                    } else {
                        // Fallback logic for previous format if needed, but prefer loaded data
                        const newContent = [
                            { title: "Our business", content: parsed.business || "" },
                            { title: "Our commitment", content: parsed.commitment || "" },
                            { title: "Our goal", content: parsed.goal || "" }
                        ];
                        setContent(newContent);
                    }
                } catch (e) {
                    console.error("Error parsing content", e);
                }
            }
        }
        setLoading(false);
    };
    fetchAboutData();
  }, []);

  if (loading) {
      return (
          <div className='about-mission-page' style={{minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div className="loading-spinner"></div>
              {/* Optional: Add simple CSS spinner here or just text */}
              <p style={{fontFamily: 'var(--font-sans)', color: '#999'}}>Loading...</p>
          </div>
      );
  }

  return (
    <div className='about-mission-page'>
      <div className='mission-carousel-wrapper'>
          <ImageCarousel images={images} altTitle="Mission Image" />
      </div>
      
      <div className='mission-content'>
        <h1 className='mission-title'>{title}</h1>
        {content.map((block, idx) => (
             <div className='mission-text-block' key={idx}>
                <strong>{block.title}</strong> {block.content}
             </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUs;
