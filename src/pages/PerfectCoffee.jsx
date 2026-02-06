import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { supabase } from '../supabaseClient';

const defaultImages = [];

const PerfectCoffee = () => {
  const [title, setTitle] = useState("Perfect coffee");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState("");
  const [captions, setCaptions] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from('content_pages')
      .select('*')
      .eq('slug', 'perfectcoffee')
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
         /* Render HTML safely since it comes from our admin or default */
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </ProjectLayout>
  );
};

export default PerfectCoffee;
