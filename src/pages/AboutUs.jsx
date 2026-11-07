import React, { useEffect, useState } from 'react';
import { getPage } from '../lib/content';
import ImageCarousel from '../components/ImageCarousel';
import './AboutUs.css';

const AboutUs = () => {
  const [loading, setLoading]   = useState(true);
  const [images,  setImages]    = useState([]);
  const [title,   setTitle]     = useState('Nuestra historia');
  const [content, setContent]   = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await getPage('aboutus');
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.images?.length) setImages(data.images);
        if (data.content?.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.content);
            if (parsed.sections?.length) {
              setContent(parsed.sections);
            } else {
              setContent([
                { title: 'Nuestro negocio',    content: parsed.business   || '' },
                { title: 'Nuestro compromiso', content: parsed.commitment || '' },
                { title: 'Nuestro objetivo',   content: parsed.goal       || '' },
              ]);
            }
          } catch {}
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="page-loading">Cargando…</div>;
  }

  return (
    <div className="about-page">
      {images.length > 0 && (
        <div className="about-carousel-wrap">
          <ImageCarousel images={images} altTitle={title} />
        </div>
      )}

      <div className="about-body container">
        <header className="about-header">
          <p className="eyebrow">Nosotros</p>
          <h1 className="about-title">{title}</h1>
        </header>

        <div className="about-sections">
          {content.map((block, i) => (
            <div className="about-block" key={i}>
              {block.title && <h3 className="about-block-heading">{block.title}</h3>}
              <p className="about-block-text">{block.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
