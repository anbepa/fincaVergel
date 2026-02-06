import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { supabase } from '../supabaseClient';

const defaultImages = [];

const defaultContent = `
<p>Our micro coffee mill is built in the heart of Hacienda Sonora next to a traditional 150-year-old sugar cane mill that is preserved intact. All of our machines in the mill are tuned to perform in the best most efficient manner, using the energy harvested within the farm.</p>

<p>We process all of our coffee using the honey and natural methods. Both of these methods require a lot more work and care than the traditional fully washed. However, it all makes sense when you taste the results in the cup. By playing and trying different techniques with these two methods we have been able to obtain distinct sweetness, with all types of cacao and enhanced fruit notes that complement the body of our cup profiles in our different varietals.</p>

<p>Another important advantage is that we save great amounts of water by using the honey and the natural processes. Using the honey method saves more than 3 gallons of water per pound of coffee. Natural processed coffee doesn't need any water.</p>
`;

const OurProcess = () => {
  const [title, setTitle] = useState("Our process");
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
      .eq('slug', 'ourprocess')
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

export default OurProcess;
