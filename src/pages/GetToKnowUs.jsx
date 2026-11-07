import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { getPage } from '../lib/content';

const defaultImages = [];

const defaultContent = `
<p><strong>Nuestro negocio</strong> es crear microlotes de café verde de alta calidad que cosechamos en nuestra tierra. Producimos ocho variedades de café, que procesamos con técnicas especiales como los métodos honey y natural.</p>
<p><strong>Nuestro compromiso</strong> es lograr la mejor calidad en nuestras diferentes variedades, manteniendo una armonía perfecta con la naturaleza y con nuestro equipo.</p>
<p><strong>Nuestro objetivo</strong> es disfrutar el camino, conocer gente maravillosa de diferentes partes del mundo y tener un impacto positivo en el medio ambiente y en las personas que rodean nuestro negocio, produciendo cafés sobresalientes.</p>
`;

const GetToKnowUs = () => {
  const [title, setTitle] = useState("Conócenos");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState(defaultContent);
  const [captions, setCaptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getPage('gettoknowus');

      if (data) {
        if (data.title) setTitle(data.title);
        
        // Check for rich content (JSON with captions)
        if (data.content) {
            try {
               if (data.content.trim().startsWith('{')) {
                   const parsed = JSON.parse(data.content);
                   if (parsed.isRichContent) {
                       setContent(parsed.text);
                       setCaptions(parsed.captions || {});
                   } else if (parsed.business !== undefined) {
                       // Format saved by admin: {business, commitment, goal}
                       const html = [
                         parsed.business   ? `<p><strong>Nuestro negocio</strong><br/>${parsed.business}</p>`   : '',
                         parsed.commitment ? `<p><strong>Nuestro compromiso</strong><br/>${parsed.commitment}</p>` : '',
                         parsed.goal       ? `<p><strong>Nuestro objetivo</strong><br/>${parsed.goal}</p>`             : '',
                       ].join('');
                       setContent(html || defaultContent);
                   } else {
                       setContent(data.content);
                   }
               } else {
                   setContent(data.content);
               }
            } catch(e) {
                setContent(data.content);
            }
        }

        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProjectLayout title="" images={[]} captions={{}}>
         <div className="page-loading">Cargando...</div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout
      title={title}
      images={images}
      captions={captions}
    >
      <div 
        className="project-text-content dynamic-content" 
        style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </ProjectLayout>
  );
};

export default GetToKnowUs;
