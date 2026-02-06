import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { supabase } from '../supabaseClient';

const defaultImages = [];

const defaultContent = `
<p>Hacienda Sonora is located in the Central Valley of Costa Rica, at the foot of the world renowned, Poas Volcano. The farm’s area is approximately 100 hectares, which is composed of 55 hectares of shaded coffee, 35 hectares of wild forest reserve, and 10 hectares of sugar cane. The average altitude is 1,200 m (or 3,900 ft) above sea level.</p>

<p>Our coffee grows in an environment surrounded by exotic trees and other vegetation, providing a great condition for quality, as well as improving the chemistry of the already naturally rich volcanic soil. Thanks to the farm’s diverse ecosystem, many different species of birds and animals seek refuge in our land.</p>
`;

const TheFarm = () => {
  const [title, setTitle] = useState("The Farm");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState(defaultContent);
  const [captions, setCaptions] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', 'thefarm')
      .single();

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
  };

  return (
    <ProjectLayout
      title={title}
      images={images}
      captions={captions}
    >
      <div 
        className="project-text-content dynamic-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </ProjectLayout>
  );
};

export default TheFarm;
