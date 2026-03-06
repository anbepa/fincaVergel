import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { supabase } from '../supabaseClient';

const defaultImages = [];

const defaultContent = `
<p><strong>Our business</strong> is to create high quality green coffee micro-lots that we harvest on our land. We produce eight different coffee varietals, which we process under special techniques such as the honey and natural methods.</p>
<p><strong>Our commitment</strong> is to achieve the best quality among our different varietals while maintaining perfect harmony with nature and our staff.</p>
<p><strong>Our goal</strong> is to have fun, meet great people from different parts of the world, have a positive impact on the environment and on the people that surround our business, all while producing outstanding coffees.</p>
`;

const GetToKnowUs = () => {
  const [title, setTitle] = useState("Get to know us");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState(defaultContent);
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
        .eq('slug', 'gettoknowus')
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
                   } else if (parsed.business !== undefined) {
                       // Format saved by admin: {business, commitment, goal}
                       const html = [
                         parsed.business   ? `<p><strong>Our Business</strong><br/>${parsed.business}</p>`   : '',
                         parsed.commitment ? `<p><strong>Our Commitment</strong><br/>${parsed.commitment}</p>` : '',
                         parsed.goal       ? `<p><strong>Our Goal</strong><br/>${parsed.goal}</p>`             : '',
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
        style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </ProjectLayout>
  );
};

export default GetToKnowUs;
