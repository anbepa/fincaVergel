import React, { useEffect, useState } from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { getPage } from '../lib/content';

const defaultImages = [];

const defaultContent = `
<p>Finca El Vergel is a specialty coffee farm in the mountains of the Sierra Nevada de Santa Marta, Colombia.</p>
<p>Our coffee grows surrounded by native trees and vegetation, in a rich ecosystem that gives every cup its character.</p>
`;

const TheFarm = () => {
  const [title, setTitle] = useState("The Farm");
  const [images, setImages] = useState(defaultImages);
  const [content, setContent] = useState(defaultContent);
  const [captions, setCaptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await getPage('thefarm');

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
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </ProjectLayout>
  );
};

export default TheFarm;
