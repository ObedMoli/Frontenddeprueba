// src/api.js
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const setToken = (t) => localStorage.setItem('token', t);
export const getToken = () => localStorage.getItem('token');
export const clearToken = () => localStorage.removeItem('token');

export function getUserFromToken() {
  const t = getToken();
  if (!t) return null;
  const parts = t.split('.');
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    const payload = JSON.parse(json);
    return payload; // { user_id, name, iat, exp, ... }
  } catch {
    return null;
  }
}

/**
 * apiFetch(path, { method='GET', body, auth=false })
 * - Envía y recibe JSON.
 * - Si auth=true, agrega Authorization: Bearer <token>.
 * - Lanza Error con mensaje amigable si la API responde !ok.
 * - Concatena mensajes de validación cuando vienen como { message, errors: [...] } (Zod).
 */
export async function apiFetch(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // intenta parsear JSON siempre (aunque no sea 2xx)
  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: res.ok ? 'OK' : `HTTP ${res.status}` };
  }

  if (!res.ok) {
    const base = data?.message || data?.error || `Error HTTP ${res.status}`;
    let details = '';

    // Soporta formatos comunes de validación:
    // - { errors: [{ message }, ...] }
    // - Zod: { errors: [{ path, message }, ...] }
    // - Tu propio formato previo: { errors: [{ campo, mensaje }, ...] }
    if (Array.isArray(data?.errors)) {
      const msgs = data.errors
        .map(e => {
          if (typeof e === 'string') return e;
          if (e?.mensaje) return e.mensaje;        // tu formato previo
          if (e?.message) return e.message;        // zod/otros
          return '';
        })
        .filter(Boolean);

      if (msgs.length) details = ' ' + msgs.join(' • ');
    }

    // En algunos casos Zod viene como { errors: { fieldErrors: {...} } } via safeParse.flatten()
    // Si usas flatten(), puedes descomentar esto:
    // if (data?.errors?.fieldErrors) {
    //   const flatMsgs = Object.values(data.errors.fieldErrors).flat().filter(Boolean);
    //   if (flatMsgs.length) details += ' ' + flatMsgs.join(' • ');
    // }

    throw new Error((base + details).trim());
  }

  return data;
}
