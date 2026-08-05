const { poolPromise, sql } = require('../config/db');
require('dotenv').config();

// Clave de la app en el padrón central (acceso.Permisos.App).
const APP_KEY = 'transporte';

/**
 * Identidad vía Azure Easy Auth (Entra ID) + rol en el padrón central.
 *
 * Easy Auth reenvía el email en 'x-ms-client-principal-name'. Se cruza contra
 * acceso.Usuarios (identidad) y acceso.Permisos (rol en 'transporte').
 * - En dev simula un usuario real (DEV_EMAIL).
 * - Si TRANSPORTE_REQUIRE_PERMISSION=true, sin permiso se devuelve 403.
 */
function correoDeInvitado(email) {
  const i = email.indexOf('#EXT#');
  if (i === -1) return null;
  const base = email.slice(0, i);
  const guion = base.lastIndexOf('_');
  return guion === -1 ? null : `${base.slice(0, guion)}@${base.slice(guion + 1)}`;
}

module.exports = async function auth(req, res, next) {
  const email =
    req.headers['x-ms-client-principal-name'] ||
    (process.env.NODE_ENV !== 'production'
      ? process.env.DEV_EMAIL || 'roberto.sanabria@offal.com.ar'
      : null);

  if (!email) {
    return res.status(401).json({ mensaje: 'No autenticado por Azure Easy Auth.' });
  }

  const exigirPermiso = process.env.TRANSPORTE_REQUIRE_PERMISSION === 'true';

  try {
    const pool = await poolPromise;

    if (!pool) {
      if (exigirPermiso) return res.status(503).json({ mensaje: 'Padrón no disponible.' });
      req.user = { UsuarioId: null, Email: email, Nombre: null, rol: null, registrado: false };
      return next();
    }

    const alterno = correoDeInvitado(email);
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .input('alterno', sql.NVarChar, alterno || email)
      .input('app', sql.NVarChar, APP_KEY)
      .query(`
        SELECT u.UsuarioId, u.Email, u.Nombre, p.Rol
        FROM acceso.Usuarios u
        LEFT JOIN acceso.Permisos p ON p.UsuarioId = u.UsuarioId AND p.App = @app
        WHERE u.Activo = 1 AND u.Email IN (@email, @alterno)
      `);

    const u = result.recordset[0];
    if (exigirPermiso && (!u || !u.Rol)) {
      return res.status(403).json({ mensaje: 'No tenés permiso para el módulo de Hoja de Ruta.' });
    }

    req.user = u
      ? { UsuarioId: u.UsuarioId, Email: u.Email, Nombre: u.Nombre, rol: u.Rol || null, registrado: true }
      : { UsuarioId: null, Email: email, Nombre: null, rol: null, registrado: false };

    next();
  } catch (err) {
    console.error('[Transporte/Auth] Error:', err.message);
    return res.status(500).json({ mensaje: 'Error en la verificación de identidad.' });
  }
};
