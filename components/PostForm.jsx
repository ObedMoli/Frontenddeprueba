import { apiFetch,getUserFromToken } from '../src/api.js';
import ErrorBanner from './Error.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function PostForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const nav = useNavigate();
  const user = getUserFromToken(); // { name }

  const [form, setForm] = useState({
    title: '',
    content_line1: '',
    content_line2: '',
    image: '',
    category_title: ''
  });
  const [categorias, setCategorias] = useState([]);
  const [pubs, setPubs] = useState([]); // fallback si /categorias falla
  const [error, setError] = useState('');
  const [bloqueado, setBloqueado] = useState(false);

  // --- Helpers ---
  const toNullIfEmpty = (v) => {
    const s = (v ?? '').trim();
    return s === '' ? null : s;
  };

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // --- Cargar categorías (principal) ---
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/categorias/categoria/1');   // { status, success, data: [...] }
        const arr = Array.isArray(res?.data) ? res.data : [];
        setCategorias(arr);
      } catch {
        setCategorias([]); // usaremos fallback
      }
    })();
  }, []);

  // --- Fallback: derivar categorías desde publicaciones (usar items paginados) ---
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/publicaciones'); // ahora responde { data: { items, ... } }
        const items = Array.isArray(res?.data?.items) ? res.data.items : [];
        setPubs(items);
      } catch {
        setPubs([]);
      }
    })();
  }, []);

  const categoriasFallback = useMemo(() => {
    const arr = Array.isArray(pubs) ? pubs : [];
    const set = new Set();
    for (const p of arr) {
      if (p?.categoria) set.add(p.categoria);
    }
    return Array.from(set).sort();
  }, [pubs]);

  // --- Si es edición, precargar y validar propiedad (por nombre del autor) ---
  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const res = await apiFetch(`/publicaciones/${id}`); // { data: {...} }
          const d = res.data;

          if (!user?.name || d.autor !== user.name) {
            setBloqueado(true);
            setError('No eres el dueño de esta publicación.');
            return;
          }

          setForm({
            title: d.title || '',
            content_line1: d.content_line1 || '',
            content_line2: d.content_line2 || '',
            image: d.image || '',
            category_title: d.categoria || ''
          });
        } catch (e) {
          setError(e.message);
        }
      })();
    }
  }, [isEdit, id, user?.name]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    // Normalizar opcionales a null si están vacíos y eliminar nulls
    const payload = {
      title: (form.title || '').trim(),
      content_line1: (form.content_line1 || '').trim(),
      content_line2: toNullIfEmpty(form.content_line2),
      image: toNullIfEmpty(form.image),
      category_title: (form.category_title || '').trim()
    };
    Object.keys(payload).forEach(k => payload[k] === null && delete payload[k]);

    try {
      if (isEdit) {
        await apiFetch(`/publicaciones/${id}`, { method: 'PUT', body: payload, auth: true });
        alert('Publicación actualizada');
      } else {
        await apiFetch('/publicaciones', { method: 'POST', body: payload, auth: true });
        alert('Publicación creada');
      }
      nav('/publicaciones');
    } catch (e) {
      setError(e.message);
    }
  }

  if (isEdit && bloqueado) {
    return (
      <div className="container">
        <ErrorBanner message={error} onClose={() => setError('')} />
        <button className="btn" onClick={() => nav(-1)}>← Volver</button>
      </div>
    );
  }

  const hayCategorias = Array.isArray(categorias) && categorias.length > 0;
  const hayFallback = Array.isArray(categoriasFallback) && categoriasFallback.length > 0;

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="card" >
        <h3>{isEdit ? 'Editar' : 'Crear'} publicación</h3>
        <ErrorBanner message={error} onClose={() => setError('')} />

        <button type="button" onClick={() => nav(-1)} style={{ marginBottom: 8 }}>← Volver</button>

        <label>Título</label>
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          required
        />

        <label>Contenido línea 1</label>
        <input
          name="content_line1"
          value={form.content_line1}
          onChange={onChange}
          required
        />

        <label>Contenido línea 2 (opcional)</label>
        <input
          name="content_line2"
          value={form.content_line2 ?? ''}   // controlado; nunca null
          onChange={onChange}
        />

        <label>Imagen (URL) (opcional)</label>
        <input
          name="image"
          value={form.image ?? ''}           // controlado; nunca null
          onChange={onChange}
        />

        <label>Categoría</label>
        {hayCategorias ? (
          <select name="category_title" value={form.category_title} onChange={onChange} required>
            <option value="" disabled>Selecciona una categoría</option>
            {categorias.map(c => (
              <option key={c.category_id} value={c.category_title}>
                {c.category_title}
              </option>
            ))}
          </select>
        ) : hayFallback ? (
          <select name="category_title" value={form.category_title} onChange={onChange} required>
            <option value="" disabled>Selecciona una categoría</option>
            {categoriasFallback.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              name="category_title"
              value={form.category_title}
              onChange={onChange}
              placeholder="Escribe el nombre exacto de la categoría"
              required
            />
            <small>Escribe el nombre exacto de una categoría existente.</small>
          </>
        )}

        <button type="submit">{isEdit ? 'Guardar cambios' : 'Crear'}</button>
      </form>
    </div>
  );
}