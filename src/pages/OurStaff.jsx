import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { getPage } from '../lib/content';

const defaultImages = [];

const defaultContent = `
<p>Nuestro equipo está en el corazón de Finca El Vergel. Su conocimiento de la tierra, su cuidado en cada cosecha y su dedicación diaria hacen posible nuestro café.</p>
<p>Nos llena de orgullo trabajar juntos como comunidad y ver a nuestra gente crecer con la finca.</p>
`;

const OurStaff = () => {
  const [title, setTitle] = useState("Nuestro equipo");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState(defaultContent);
  const [captions, setCaptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getPage('our-staff');

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
         /* Render HTML safely since it comes from our admin or default */
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </ProjectLayout>
  );
};

export default OurStaff;
