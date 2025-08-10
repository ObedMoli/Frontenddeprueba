import { apiFetch, getToken,getUserFromToken } from '../src/api.js'
import ErrorBanner from './Error.jsx';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const MAX_LEN = 1000;

function formatDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const token = getToken();
  const user = getUserFromToken(); // { name, user_id }
  const [post, setPost] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [error, setError] = useState('');
  const [charLeft, setCharLeft] = useState(MAX_LEN);

  const esDueno = !!token && user?.name && post?.autor === user.name;

  async function cargarDetalle() {
    const res = await apiFetch(`/publicaciones/${id}`); // { data: {..., comentarios: []} }
    const data = res.data || {};
    setPost(data);
    setComentarios(Array.isArray(data.comentarios) ? data.comentarios : []);
  }

  useEffect(() => {
    (async () => {
      try {
        await cargarDetalle();
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id]);

  function onChangeComentario(e) {
    const v = e.target.value;
    setNuevoComentario(v);
    setCharLeft(Math.max(0, MAX_LEN - v.length));
  }

  async function onDelete() {
    if (!esDueno) {
      setError('No eres el dueño de esta publicación.');
      return;
    }
    if (!confirm('¿Eliminar publicación?')) return;
    try {
      await apiFetch(`/publicaciones/${id}`, { method: 'DELETE', auth: true });
      alert('Publicación eliminada');
      nav('/');
    } catch (e) {
      setError(e.message);
    }
  }

  async function enviarComentario(e) {
    e.preventDefault();
    setError('');
    try {
      if (!token) {
        setError('Debes iniciar sesión para comentar.');
        return;
      }
      await apiFetch(`/publicaciones/${id}/comentarios`, {
        method: 'POST',
        body: { content: nuevoComentario }, // la API hace trim + escape (XSS)
        auth: true
      });
      setNuevoComentario('');
      setCharLeft(MAX_LEN);
      await cargarDetalle(); // refresca (ya trae comentarios)
    } catch (e) {
      // Muestra errores de validación si vienen del backend
      setError(e.message || 'No se pudo publicar el comentario');
    }
  }

  if (!post) return <p>Cargando...</p>;

  return (
    <div>
      <ErrorBanner message={error} onClose={() => setError('')} />

      <button onClick={() => nav(-1)} style={{ marginBottom: 12 }}>← Volver</button>

      <h3>{post.title}</h3>
      <small>
        Autor: {post.autor} — Categoría: {post.categoria || 'N/A'} — Fecha: {formatDate(post.date)}
      </small>

      {post.image && (
        <div>
          <img src={post.image} alt="" style={{ maxWidth: '100%', marginTop: 8 }} />
        </div>
      )}

      <p>{post.content_line1}</p>
      {post.content_line2 && <p>{post.content_line2}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Link to={`/post/${post.post_id}`}>Ver</Link>
        {token && <Link to={`/editar/${post.post_id}`}>Editar</Link>}
        {token && <button onClick={onDelete}>Eliminar</button>}
      </div>

      <hr />

      <h4>Comentarios</h4>

      {Array.isArray(comentarios) && comentarios.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
          {comentarios.map(c => (
            <li key={c.comment_id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                <strong>{c.autor || c.comment_by_user_name || 'Usuario'}</strong>
                <small>{formatDate(c.date)}</small>
              </div>
              {/* El contenido viene saneado por el backend; lo mostramos como texto */}
              <div>{c.content}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay comentarios aún.</p>
      )}

      {/* Formulario de comentario: visible solo si hay token */}
      {token ? (
        <form onSubmit={enviarComentario} style={{ marginTop: 12, display: 'grid', gap: 20 }}>
          <textarea
            placeholder="Escribe tu comentario…"
            value={nuevoComentario}
            onChange={onChangeComentario}
            maxLength={MAX_LEN}
            required
          />
          <small>Te quedan {charLeft} caracteres (máx. {MAX_LEN}).</small>
          <button type="submit">Comentar</button>
        </form>
      ) : (
        <p style={{ marginTop: 12 }}>
          Inicia sesión para comentar.
        </p>
      )}
    </div>
  );
}