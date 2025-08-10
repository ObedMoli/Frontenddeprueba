import { apiFetch, getToken,getUserFromToken } from '../src/api.js';
import ErrorBanner from './Error.jsx';
import React, { useEffect, useMemo, useState,useRef } from 'react';
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
  const [debouncedQ, setDebouncedQ] = useState('');
  const [cat, setCat] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState('');

  const token = getToken();
  const user = getUserFromToken();

  // 
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Cargar categorías de forma segura
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/categorias');
        const arr = Array.isArray(res?.data) ? res.data : [];
        setCategorias(arr);
      } catch {
        setCategorias([]); 
      }
    })();
  }, []);

  
  const reqSeq = useRef(0);
  const abortRef = useRef(null);

  // Al cambiar filtros, regresa a página 1
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, cat]);

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      setError('');

      // Abortar petición previa
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const mySeq = ++reqSeq.current;

      try {
        const usp = new URLSearchParams();
        if (debouncedQ) usp.set('q', debouncedQ);
        if (cat) usp.set('category', cat);
        usp.set('page', String(page));
        usp.set('pageSize', String(PAGE_SIZE));

        // Usamos fetch directo para pasar signal (apiFetch no expone signal)
        const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
        const res = await fetch(`${base}/publicaciones?${usp.toString()}`, {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        let data;
        try { data = await res.json(); }
        catch { data = { message: res.ok ? 'OK' : `HTTP ${res.status}` }; }

        if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
        
        // Ignora si no es la última petición
        if (mySeq !== reqSeq.current) return;

        const payload = data.data || {};
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setTotal(Number(payload.total || 0));
        setTotalPages(Number(payload.totalPages || 1));
      } catch (e) {
        if (e.name === 'AbortError') setError(e.message || 'Error al cargar publicaciones');
      } finally {
        if (mySeq === reqSeq.current) setLoading(false);
      }
    };

    doFetch();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [debouncedQ, cat, page]);

  return (
    <div className="container">
      <h3>Publicaciones</h3>
      <ErrorBanner message={error} onClose={() => setError('')} />

      <div style={{ marginBottom: 12 }}>
  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
    <input
      placeholder="Buscar por título o contenido…"
      value={q}
      onChange={e => setQ(e.target.value)}
      style={{ flex: 1 }}
    />
  </div>
  <select 
    value={cat} 
    onChange={e => setCat(e.target.value)}
    style={{ width: '100%' }}
  >
    <option value="">Todas</option>
    {Array.isArray(categorias) && categorias.map(c => (
      <option key={c.category_id} value={c.category_title}>
        {c.category_title}
      </option>
    ))}
  </select>
</div>

      {loading && <p style={{ opacity: 0.7 }}>Cargando…</p>}
      {!loading && items.length === 0 && <p>No hay publicaciones para mostrar.</p>}

      <ul className="post-list">
        {items.map(p => {
          const esDueno = !!token && user?.name && p.autor === user.name;
          return (
            <li key={p.post_id} className="post-item">
              <h4>{p.title}</h4>
              <small>
                Autor: {p.autor} — Categoría: {p.categoria || 'N/A'} — Fecha: {formatDate(p.date)}
              </small>
              <p>{p.content_line1}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/post/${p.post_id}`} className="btn">Ver</Link>
                {esDueno && <Link to={`/editar/${p.post_id}`} className="btn">Editar</Link>}
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