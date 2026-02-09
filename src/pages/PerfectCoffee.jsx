import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { supabase } from '../supabaseClient';

const defaultImages = [];

const PerfectCoffee = () => {
  const [title, setTitle] = useState("Perfect coffee");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState("");
  const [captions, setCaptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProjectLayout title="" images={[]} captions={{}}>
         <div className="page-loading">Loading...</div>
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

export default PerfectCoffee;
