import React, { useEffect, useState } from 'react';
import { apiFetch } from '../src/api.js';
import { useNavigate, Link } from 'react-router-dom';
import ErrorBanner from './Error.jsx';

export default function Register() {
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    telefono: '',
    about: '',
    role_name: 'usuario' // por defecto
  });

  // Cargar roles (opcional). Si falla, dejamos "usuario"
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/roles'); // tu endpoint de roles
        setRoles(res.data || []);
      } catch {
        // no es crítico
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/auth/register', { method: 'POST', body: form });
      alert('Usuario registrado. Ahora puedes iniciar sesión.');
      nav('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo registrar');
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
      <h3>Crear cuenta</h3>
      <ErrorBanner message={error} onClose={() => setError('')} />

      <label>Nombre</label>
      <input name="name" value={form.name} onChange={onChange} required />

      <label>Email</label>
      <input name="email" type="email" value={form.email} onChange={onChange} required />

      <label>Contraseña (mín. 8)</label>
      <input name="password" type="password" value={form.password} onChange={onChange} required />

      <label>Teléfono (opcional)</label>
      <input name="telefono" value={form.telefono} onChange={onChange} />

      <label>Sobre ti (opcional)</label>
      <textarea name="about" value={form.about} onChange={onChange} />

      <label>Rol</label>
      {roles.length > 0 ? (
        <select name="role_name" value={form.role_name} onChange={onChange}>
          {roles.map(r => (
            <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
          ))}
        </select>
      ) : (
        <input name="role_name" value={form.role_name} onChange={onChange} />
      )}

      <button type="submit">Registrarme</button>

      <small>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></small>
    </form>
  );
}
