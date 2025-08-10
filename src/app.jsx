import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from '../components/Login.jsx';
import Register from '../components/Register.jsx';
import PostList from '../components/PostList.jsx';
import PostDetail from '../components/PostDetail.jsx';
import PostForm from '../components/PostForm.jsx';
import { getToken, clearToken } from './api.js';
import { Navigate } from 'react-router-dom';

// Guard simple para rutas protegidas
function RequireAuth({ children }) {
  const token = getToken();
  const location = useLocation();
  if (!token) {
    // redirige a /login y recuerda a dónde iba
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

// NOTA: Necesitamos Navigate, lo importamos aquí para evitar orden raro de imports



export default function App() {
  const nav = useNavigate();
  const token = getToken();
  const logout = () => { clearToken(); nav('/login'); };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ marginRight: 'auto' }}>Blog Front</h2>
        <Link to="/">Publicaciones</Link>
        {token && <Link to="/crear">Crear</Link>}
        {!token && <Link to="/register">Registro</Link>} {/* <-- link al registro */}
        {!token ? <Link to="/login">Login</Link> : <button onClick={logout}>Salir</button>}
      </header>

      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* <-- ruta nueva */}

        <Route path="/post/:id" element={<PostDetail />} />

        <Route path="/crear" element={
          <RequireAuth>
            <PostForm mode="create" />
          </RequireAuth>
        }/>

        <Route path="/editar/:id" element={
          <RequireAuth>
            <PostForm mode="edit" />
          </RequireAuth>
        }/>
      </Routes>
    </div>
  );
}