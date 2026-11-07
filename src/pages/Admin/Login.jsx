import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './Admin.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /* Already signed in? Go straight to the dashboard. */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/admin/dashboard', { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      /* Auth errors come from Supabase in English; show them in Spanish. */
      setError(/invalid login credentials/i.test(error.message)
        ? 'Correo o contraseña incorrectos.'
        : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    } else {
      setLoading(false);
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="admin-page-container login-wrapper">
      <h2 className="admin-title" style={{textAlign:'center', marginBottom: '30px'}}>Acceso al panel</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        {error && <p style={{color: 'red', textAlign:'center'}}>{error}</p>}
        <button 
          type="submit" 
          disabled={loading}
          className="btn-admin-action btn-save"
          style={{marginTop: 0}}
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

export default Login;
