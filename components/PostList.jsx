import { apiFetch, getToken,getUserFromToken } from '../src/api.js';
import ErrorBanner from './Error.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
const PAGE_SIZE = 5;

function formatDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function PostList() {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = getToken();
  const user = getUserFromToken();

  // Cargar categorías
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/categorias');
        setCategorias(res.data || []);
      } catch {
        // no crítico
      }
    })();
  }, []);

  // Cargar publicaciones paginadas (cuando cambian filtros/página)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const usp = new URLSearchParams();
        if (q.trim()) usp.set('q', q.trim());
        if (cat) usp.set('category', cat);
        usp.set('page', String(page));
        usp.set('pageSize', String(PAGE_SIZE));

        const res = await apiFetch(`/publicaciones?${usp.toString()}`); // { data: { items, page, pageSize, total, totalPages } }
        const data = res.data || {};
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [q, cat, page]);

  // Si cambian filtros, vuelve a la 1ra página
  useEffect(() => { setPage(1); }, [q, cat]);

  return (
    <div>
      <h3>Publicaciones</h3>
      <ErrorBanner message={error} onClose={() => setError('')} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Buscar por título o contenido…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Todas</option>
          {categorias.map(c => (
            <option key={c.category_id} value={c.category_title}>
              {c.category_title}
            </option>
          ))}
        </select>
        {token && <Link to="/crear">Crear</Link>}
      </div>

      {loading && <p>Cargando…</p>}
      {!loading && items.length === 0 && <p>No hay publicaciones para mostrar.</p>}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
        {items.map(p => {
          const esDueno = !!token && user?.name && p.autor === user.name;
          return (
            <li key={p.post_id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
              <h4 style={{ margin: 0 }}>{p.title}</h4>
              <small>
                Autor: {p.autor} — Categoría: {p.categoria || 'N/A'} — Fecha: {formatDate(p.date)}
              </small>
              <p>{p.content_line1}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/post/${p.post_id}`}>Ver</Link>
                {esDueno && <Link to={`/editar/${p.post_id}`}>Editar</Link>}
              </div>
            </li>
          );
        })}
      </ul>

      {total > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            « Anterior
          </button>
          <span>Página {page} de {totalPages} — {total} resultados</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
            Siguiente »
          </button>
        </div>
      )}
    </div>
  );
}