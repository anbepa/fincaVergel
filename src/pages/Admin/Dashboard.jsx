import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Admin.css';
import './AdminModules.css';

const pagesList = [
  { id: 'landing',      name: 'Hero / Landing',       hint: 'Title, subtitle, hero slideshow images' },
  { id: 'thefarm',      name: 'The Farm',              hint: 'Section 01 — text & images' },
  { id: 'ourprocess',   name: 'Our Process',           hint: 'Section 02 — text & images' },
  { id: 'gettoknowus',  name: 'Get to Know Us',        hint: 'Section 03 — 3 pillar cards' },
  { id: 'perfectcoffee',name: 'Perfect Coffee',        hint: 'Section 04 — text & images' },
  { id: 'greenenergy',  name: 'Green Energy',          hint: 'Section 05 — text & images' },
  { id: 'our-staff',    name: 'Our Staff',             hint: 'Section 06 — text & images' },
  { id: 'aboutus',      name: 'Our Story',             hint: 'Section 07 — story paragraphs & image' },
  { id: 'contact',      name: 'Contact',               hint: 'Section 08 — intro & visit texts' },
  { id: 'layout',       name: 'Global Layout',         hint: 'Navbar, footer, logos, social links' },
  { id: 'home',         name: 'Home Grid (legacy)',    hint: 'Section card titles — secondary route' },
];

const featureModules = [
  { to: '/admin/lots',       name: 'Coffee Lots',      hint: 'Catalog: varietal, process, score, flavor profile, availability' },
  { to: '/admin/requests',   name: 'Sample Requests',  hint: 'Inbox of sample / waitlist requests from roasters', badge: 'requests' },
  { to: '/admin/hero-video', name: 'Hero Video',       hint: 'Looping video behind the homepage title' },
  { to: '/admin/map',        name: 'Farm Map',         hint: 'Interactive map: image + clickable points' },
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

  if (!session) return <div>Loading...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn-admin-action" style={{border: '1px solid #333'}}>Logout</button>
      </div>
      
      <h2 className="dashboard-section-title">Catalog &amp; experiences</h2>
      <div className="dashboard-grid" style={{ marginBottom: '8px' }}>
        {featureModules.map(m => (
          <Link key={m.to} to={m.to} className="dashboard-card dashboard-card--feature">
            <span className="dashboard-card-name">{m.name}</span>
            <span className="dashboard-card-hint">{m.hint}</span>
            {m.badge === 'requests' && newRequests > 0 && <span className="dashboard-badge">{newRequests} new</span>}
          </Link>
        ))}
      </div>

      <h2 className="dashboard-section-title">Page content</h2>
      
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
