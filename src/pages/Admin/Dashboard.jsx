import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Admin.css';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

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
      
      <p style={{marginBottom: '30px'}}>Select a page to edit:</p>
      
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
