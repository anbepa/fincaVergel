import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import InteractivePlant from '../components/InteractivePlant';
import './Home.css';

const defaultItems = [
  {"title":"The Farm","href":"/thefarm"},
  {"title":"Our process","href":"/ourprocess"},
  {"title":"Get to know us","href":"/gettoknowus"},
  {"title":"Perfect coffee","href":"/perfectcoffee"},
  {"title":"Green Energy","href":"/greenenergy"},
  {"title":"Our Staff","href":"/our-staff"}
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
