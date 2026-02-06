import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { supabase } from '../supabaseClient';

const defaultImages = [];

const defaultContent = `
<p>Our employees are one of the crucial aspects of our success. Through their energy, consistency and local insights we have been able to build and maintain Hacienda Sonora. Their well-being is essential for us and for the tranquility of the farm.</p>
<p>One of the many things that make Hacienda Sonora so different from other farms is the fact that we provide free accommodation for each worker and their families at the farm's houses. For each house, Hacienda Sonora covers for the cost of water, trash allocation, and a portion of their electricity. Every employee fully enjoys the benefits of the Costa Rica Health Insurance system.</p>
<p>We enjoy a personal relationship built on respect with all our workers. We encourage our staff to become the best they can, and we are proud to often see them grow to greater opportunities in life.</p>
<p>Pura vida!</p>
`;

const OurStaff = () => {
  const [title, setTitle] = useState("Our Staff");
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
      .eq('slug', 'our-staff')
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

export default OurStaff;
