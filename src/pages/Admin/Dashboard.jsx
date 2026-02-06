import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Admin.css';

const pagesList = [
  { id: 'landing', name: 'Landing Page (Main)' },
  { id: 'home', name: 'Home (Grid Menu)' },
  { id: 'layout', name: 'Global Layout (Header/Footer)' },
  { id: 'aboutus', name: 'About Us' },
  { id: 'contact', name: 'Contact' },
  { id: 'thefarm', name: 'The Farm' },
  { id: 'ourprocess', name: 'Our Process' },
  { id: 'gettoknowus', name: 'Get To Know Us' },
  { id: 'perfectcoffee', name: 'Perfect Coffee' },
  { id: 'greenenergy', name: 'Green Energy' },
  { id: 'our-staff', name: 'Our Staff' },
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
            {page.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
