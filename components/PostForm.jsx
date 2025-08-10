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
  const [pubs, setPubs] = useState([]); // fallback si categorías no cargan
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

  // --- Cargar categorías (API principal) ---
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/categorias/categoria/1');   // { data: [...] }
        setCategorias(res.data || []);
      } catch {
        // si falla, no es crítico; usamos fallback
      }
    })();
  }, []);

  // --- Fallback: derivar categorías de publicaciones si /categorias no está disponible ---
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/publicaciones'); // { data: [...] }
        setPubs(res.data || []);
      } catch {
        // ignorar
      }
    })();
  }, []);

  const categoriasFallback = useMemo(() => {
    const set = new Set();
    for (const p of pubs) if (p?.categoria) set.add(p.categoria);
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

    // Normalizar opcionales a null si están vacíos
    const payload = {
      title: (form.title || '').trim(),
      content_line1: (form.content_line1 || '').trim(),
      content_line2: toNullIfEmpty(form.content_line2),
      image: toNullIfEmpty(form.image),
      category_title: (form.category_title || '').trim()
    };

    // 🔑 Quitar claves con null para que Zod .optional() no falle
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null) delete payload[k];
    });

    try {
      if (isEdit) {
        await apiFetch(`/publicaciones/${id}`, { method: 'PUT', body: payload, auth: true });
        alert('Publicación actualizada');
      } else {
        await apiFetch('/publicaciones', { method: 'POST', body: payload, auth: true });
        alert('Publicación creada');
      }
      nav('/');
    } catch (e) {
      setError(e.message);
    }
  }

  if (isEdit && bloqueado) {
    return (
      <div>
        <ErrorBanner message={error} onClose={() => setError('')} />
        <button onClick={() => nav(-1)}>← Volver</button>
      </div>
    );
  }

  const hayCategorias = categorias.length > 0;
  const hayFallback = categoriasFallback.length > 0;

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
      <h3>{isEdit ? 'Editar' : 'Crear'} publicación</h3>
      <ErrorBanner message={error} onClose={() => setError('')} />

      <button type="button" onClick={() => nav(-1)} style={{ marginBottom: 8 }}>← Volver</button>

      <label>Título (Obligatorio)</label>
      <input
        name="title"
        value={form.title}
        onChange={onChange}
        required
      />

      <label>Contenido línea 1(Obligatorio)</label>
      <input
        name="content_line1"
        value={form.content_line1}
        onChange={onChange}
        required
      />

      <label>Contenido línea 2</label>
      <input
        name="content_line2"
        value={form.content_line2|| ''}   // mantener controlado; nunca null
        onChange={onChange}
      />

      <label>Imagen (URL)</label>
      <input
        name="image"
        value={form.image ||''}           // mantener controlado; nunca null
        onChange={onChange}
      />

      <label>Categoría</label>
      {hayCategorias ? (
        <select
          name="category_title"
          value={form.category_title}
          onChange={onChange}
          required
        >
          <option value="" disabled>Selecciona una categoría</option>
          {categorias.map(c => (
            <option key={c.category_id} value={c.category_title}>
              {c.category_title}
            </option>
          ))}
        </select>
      ) : hayFallback ? (
        <select
          name="category_title"
          value={form.category_title}
          onChange={onChange}
          required
        >
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
  );
}