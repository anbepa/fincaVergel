import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getPage } from '../lib/content';
import './Home.css';

const defaultItems = [
  { id: '01', title: 'La finca',       description: 'Explora nuestra finca en la Sierra Nevada de Santa Marta.',  href: '/thefarm' },
  { id: '02', title: 'Nuestro proceso', description: 'De la cereza a la taza: calidad en cada paso de la cosecha.',   href: '/ourprocess' },
  { id: '03', title: 'Conócenos',      description: 'La historia y los valores detrás de Finca El Vergel.',                 href: '/gettoknowus' },
  { id: '04', title: 'Café perfecto',  description: 'Qué hace que nuestro café de especialidad se destaque en cada preparación.',   href: '/perfectcoffee' },
  { id: '05', title: 'Energía verde',  description: 'Nuestro compromiso con la energía limpia y sostenible en la finca.',      href: '/greenenergy' },
  { id: '06', title: 'Nuestro equipo', description: 'Las manos y los corazones dedicados detrás de cada cosecha.',         href: '/our-staff' },
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
      const { data } = await getPage('home');
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
        <p className="eyebrow">Explora</p>
        <h1 className="home-headline">Nuestro mundo</h1>
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
