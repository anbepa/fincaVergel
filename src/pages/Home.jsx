import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Home.css';

const defaultItems = [
  {"title":"The Farm","href":"/thefarm","imgSrc":""},
  {"title":"Our process","href":"/ourprocess","imgSrc":""},
  {"title":"Get to know us","href":"/gettoknowus","imgSrc":""},
  {"title":"Perfect coffee","href":"/perfectcoffee","imgSrc":""},
  {"title":"Green Energy","href":"/greenenergy","imgSrc":""},
  {"title":"Our Staff","href":"/our-staff","imgSrc":""}
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
        
        if (data) {
            let currentItems = [...defaultItems];

            // 1. Check for custom titles in 'content' (stored as JSON array)
            if (data.content) {
                try {
                    const titles = JSON.parse(data.content);
                    if (Array.isArray(titles) && titles.length === defaultItems.length) {
                        currentItems = currentItems.map((item, index) => ({
                            ...item,
                            title: titles[index] || item.title
                        }));
                    }
                } catch (e) {
                    console.log("Could not parse Home titles JSON", e);
                }
            }

            // 2. Check for uploaded images
            if (data.images && data.images.length > 0) {
                currentItems = currentItems.map((item, index) => {
                    // If there is an image at this index in the database, use it.
                    if (data.images[index]) {
                        return { ...item, imgSrc: data.images[index] };
                    }
                    return item;
                });
            }

            setItems(currentItems);
        }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="home-container">
      <div className="grid-container">
        {items.map((item, index) => (
          <Link to={item.href} key={index} className="grid-item">
            <div className="img-wrapper">
              {item.imgSrc ? (
                 <img 
                    src={item.imgSrc} 
                    alt={item.title} 
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                 />
              ) : (
                <div style={{
                    position: 'absolute',  
                    top:0, left:0, width:'100%', height:'100%', 
                    backgroundColor: '#e6e6e6', 
                    display: 'flex', alignItems:'center', justifyContent:'center',
                    color: '#999', fontSize: '0.9rem', flexDirection:'column'
                }}>
                   <span style={{fontSize:'2rem', marginBottom:'10px'}}>☕</span>
                   <span>No Image</span>
                </div>
              )}
              <div className="overlay">
                <h2 className="grid-title">{item.title}</h2>
                <h3 className="grid-subtitle">— view —</h3>
              </div>
            </div>
            <div className="mobile-title">
              <h2>{item.title}</h2>
              <h3>— view —</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
