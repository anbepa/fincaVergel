import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import InteractivePlant from '../components/InteractivePlant';
import './Home.css';

const defaultItems = [
  {"id": "01", "title": "The Farm",       "description": "Eco-friendly tradition",  "href": "/thefarm"},
  {"id": "02", "title": "Our Process",    "description": "Quality in every step",   "href": "/ourprocess"},
  {"id": "03", "title": "Get to know us", "description": "Meet our coffee family",  "href": "/gettoknowus"},
  {"id": "04", "title": "Perfect Coffee", "description": "Brewing excellence",      "href": "/perfectcoffee"},
  {"id": "05", "title": "Green Energy",   "description": "Sustainable power",       "href": "/greenenergy"},
  {"id": "06", "title": "Our Staff",      "description": "The hands behind the coffee", "href": "/our-staff"}
];

const Home = () => {
  const [items, setItems] = useState(defaultItems);

  useEffect(() => {
    const fetchHomeData = async () => {
        const { data } = await supabase
            .from('content_pages')
            .select('*')
            .eq('slug', 'home')
            .single();
        
        if (data && data.content) {
             try {
                const titles = JSON.parse(data.content);
                if (Array.isArray(titles) && titles.length > 0) {
                    setItems(current => current.map((item, index) => ({
                        ...item,
                        title: titles[index] || item.title
                    })));
                }
             } catch (e) {
                console.error("Could not parse Home titles JSON", e);
             }
        }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="home-container-plant">
      <InteractivePlant items={items} />
    </div>
  );
};

export default Home;
