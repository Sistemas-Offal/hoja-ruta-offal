// Llama a la API del módulo. En producción, Easy Auth ya puso la cabecera de
// identidad; en dev, el backend simula el usuario (DEV_EMAIL).

export const PORTAL_URL =
  import.meta.env.VITE_PORTAL_URL || 'https://offal-hsb3c0gebjgbfmae.eastus-01.azurewebsites.net';
export const LOGOUT_URL = '/.auth/logout?post_logout_redirect_uri=/';

async function json(res) {
  if (res.status === 401 || res.status === 403) {
    const err = new Error('Sin sesión / sin permiso');
    err.code = res.status === 403 ? 'NO_PERM' : 'NO_AUTH';
    throw err;
  }
  if (!res.ok) {
    let msg = 'Error de red.';
    try { msg = (await res.json()).mensaje || msg; } catch { /* noop */ }
    throw new Error(msg);
  }
  return res.json();
}

export const getMe = () => fetch('/api/me', { credentials: 'include' }).then(json);
export const getFormConfig = () => fetch('/api/form-config', { credentials: 'include' }).then(json);
export const getHojas = () => fetch('/api/hojas-ruta', { credentials: 'include' }).then(json);
export const crearHoja = (datos) =>
  fetch('/api/hojas-ruta', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  }).then(json);
