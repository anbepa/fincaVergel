import React, { useEffect, useState, useRef } from 'react';
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
  const gridRef = useRef(null);

  /* Scroll-reveal for cards */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    grid.querySelectorAll('.home-card.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  /* 3D tilt effect on desktop */
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('.home-card');
    const handleMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
    };
    const handleLeave = (e) => {
      e.currentTarget.style.transform = '';
    };
    cards.forEach(c => {
      c.addEventListener('mousemove', handleMove, { passive: true });
      c.addEventListener('mouseleave', handleLeave);
    });
    return () => {
      cards.forEach(c => {
        c.removeEventListener('mousemove', handleMove);
        c.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, [items]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('content_pages').select('*').eq('slug', 'home').single();
      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Legacy format: array of titles only
            setItems(cur => cur.map((item, i) => ({ ...item, title: parsed[i] || item.title })));
          } else if (parsed.titles) {
            // New format: {titles, descriptions}
            setItems(cur => cur.map((item, i) => ({
              ...item,
              title: parsed.titles[i] || item.title,
              description: parsed.descriptions?.[i] || item.description,
            })));
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

      <section className="home-grid" ref={gridRef}>
        {items.map((item) => (
          <Link to={item.href} key={item.id} className="home-card reveal">
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
