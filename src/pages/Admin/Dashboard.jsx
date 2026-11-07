import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Admin.css';
import './AdminModules.css';

const pagesList = [
  { id: 'landing',      name: 'Portada / Principal',   hint: 'Título, subtítulo, imágenes del carrusel principal' },
  { id: 'thefarm',      name: 'La finca',              hint: 'Sección 01 — texto e imágenes' },
  { id: 'ourprocess',   name: 'Nuestro proceso',       hint: 'Sección 02 — texto e imágenes' },
  { id: 'gettoknowus',  name: 'Conócenos',             hint: 'Sección 03 — 3 tarjetas pilar' },
  { id: 'perfectcoffee',name: 'Café perfecto',         hint: 'Sección 04 — texto e imágenes' },
  { id: 'greenenergy',  name: 'Energía verde',         hint: 'Sección 05 — texto e imágenes' },
  { id: 'our-staff',    name: 'Nuestro equipo',        hint: 'Sección 06 — texto e imágenes' },
  { id: 'aboutus',      name: 'Nuestra historia',      hint: 'Sección 07 — párrafos de la historia e imagen' },
  { id: 'contact',      name: 'Contacto',              hint: 'Sección 08 — textos de introducción y visitas' },
  { id: 'layout',       name: 'Diseño global',         hint: 'Barra de navegación, pie, logos, redes sociales' },
  { id: 'home',         name: 'Cuadrícula inicial (versión anterior)', hint: 'Títulos de las tarjetas — ruta secundaria' },
];

const featureModules = [
  { to: '/admin/lots',       name: 'Lotes de café',       hint: 'Catálogo: variedad, proceso, puntaje, perfil de sabor, disponibilidad' },
  { to: '/admin/requests',   name: 'Solicitudes de muestra', hint: 'Bandeja de solicitudes de muestra / lista de espera de tostadores', badge: 'requests' },
  { to: '/admin/hero-video', name: 'Video principal',     hint: 'Video en bucle detrás del título de la portada' },
  { to: '/admin/map',        name: 'Mapa de la finca',    hint: 'Mapa interactivo: imagen + puntos clicables' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [newRequests, setNewRequests] = useState(0);

  useEffect(() => {
    if (!session) return;
    supabase.from('sample_requests').select('id', { count: 'exact', head: true }).eq('status', 'new')
      .then(({ count }) => setNewRequests(count || 0));
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/admin');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/admin');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!session) return <div>Cargando...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1 className="admin-title">Panel de administración</h1>
        <button onClick={handleLogout} className="btn-admin-action" style={{border: '1px solid #333'}}>Cerrar sesión</button>
      </div>
      
      <h2 className="dashboard-section-title">Catálogo y experiencias</h2>
      <div className="dashboard-grid" style={{ marginBottom: '8px' }}>
        {featureModules.map(m => (
          <Link key={m.to} to={m.to} className="dashboard-card dashboard-card--feature">
            <span className="dashboard-card-name">{m.name}</span>
            <span className="dashboard-card-hint">{m.hint}</span>
            {m.badge === 'requests' && newRequests > 0 && <span className="dashboard-badge">{newRequests} nuevas</span>}
          </Link>
        ))}
      </div>

      <h2 className="dashboard-section-title">Contenido de páginas</h2>
      
      <div className="dashboard-grid">
        {pagesList.map(page => (
          <Link 
            key={page.id} 
            to={`/admin/edit/${page.id}`}
            className="dashboard-card"
          >
            <span className="dashboard-card-name">{page.name}</span>
            {page.hint && <span className="dashboard-card-hint">{page.hint}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
