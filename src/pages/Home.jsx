import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Home.css';

const defaultItems = [
  { id: '01', title: 'The Farm',       description: 'Explore our 100-hectare estate at the foot of Poás Volcano.',  href: '/thefarm' },
  { id: '02', title: 'Our Process',    description: 'From cherry to cup — quality at every step of the harvest.',   href: '/ourprocess' },
  { id: '03', title: 'Get to Know Us', description: 'The story and values behind Finca El Vergel.',                 href: '/gettoknowus' },
  { id: '04', title: 'Perfect Coffee', description: 'What makes our specialty coffee stand apart in every brew.',   href: '/perfectcoffee' },
  { id: '05', title: 'Green Energy',   description: 'Our commitment to sustainable, clean power on the farm.',      href: '/greenenergy' },
  { id: '06', title: 'Our Staff',      description: 'The dedicated hands and hearts behind every harvest.',         href: '/our-staff' },
];

const Home = () => {
  const [items, setItems] = useState(defaultItems);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('content_pages').select('*').eq('slug', 'home').single();
      if (data?.content) {
        try {
          const titles = JSON.parse(data.content);
          if (Array.isArray(titles) && titles.length > 0) {
            setItems(cur => cur.map((item, i) => ({ ...item, title: titles[i] || item.title })));
          }
        } catch {}
      }
    })();
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="eyebrow">Explore</p>
        <h1 className="home-headline">Our World</h1>
      </section>

      <section className="home-grid">
        {items.map((item) => (
          <Link to={item.href} key={item.id} className="home-card">
            <span className="home-card-num">{item.id}</span>
            <div className="home-card-body">
              <h2 className="home-card-title">{item.title}</h2>
              <p className="home-card-desc">{item.description}</p>
            </div>
            <span className="home-card-arrow">→</span>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default Home;
