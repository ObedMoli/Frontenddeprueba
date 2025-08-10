import React, { useState } from 'react';
import { apiFetch, setToken } from '../src/api.js';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ErrorBanner from './Error.jsx';

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      // El backend responde { status, success, message, data: { token } }
      setToken(res?.data?.token);
      const to = location.state?.from?.pathname || '/';
      nav(to, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <h3>Iniciar sesión</h3>
      <ErrorBanner message={error} onClose={() => setError('')} />

      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Contraseña"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      <button type="submit">Entrar</button>

      <small>
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </small>
    </form>
  );
}
