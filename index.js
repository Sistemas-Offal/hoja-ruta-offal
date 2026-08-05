const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const auth = require('./middlewares/auth');
const store = require('./services/store');
const { CAMPOS, CHOFERES, FORM_META } = require('./config/formConfig');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Health check público para el probe del App Service.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// GET /api/me — identidad (chip de usuario del navbar).
app.get('/api/me', auth, (req, res) => {
  res.json({ nombre: req.user.Nombre, email: req.user.Email, rol: req.user.rol, registrado: req.user.registrado });
});

// GET /api/form-config — definición del formulario para render dinámico.
app.get('/api/form-config', auth, (req, res) => {
  res.json({ meta: FORM_META, campos: CAMPOS, choferes: CHOFERES });
});

// Valida y normaliza el cuerpo contra la definición de CAMPOS.
function validar(body) {
  const datos = {};
  const errores = [];
  for (const c of CAMPOS) {
    let v = body[c.name];
    const vacio = v === undefined || v === null || String(v).trim() === '';

    if (vacio) {
      if (c.required) errores.push(`Falta "${c.label}".`);
      datos[c.name] = null;
      continue;
    }
    if (c.type === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) errores.push(`"${c.label}" debe ser un número.`);
      else v = n;
    }
    datos[c.name] = v;
  }
  return { datos, errores };
}

// POST /api/hojas-ruta — carga una hoja de ruta.
app.post('/api/hojas-ruta', auth, async (req, res) => {
  const { datos, errores } = validar(req.body || {});
  if (errores.length) return res.status(400).json({ mensaje: errores.join(' ') });
  try {
    const fila = await store.guardar(datos, req.user.Email);
    res.status(201).json(fila);
  } catch (err) {
    console.error('[Transporte] guardar error:', err.message);
    res.status(500).json({ mensaje: 'No se pudo guardar la hoja de ruta.' });
  }
});

// GET /api/hojas-ruta — panel de respuestas.
app.get('/api/hojas-ruta', auth, async (req, res) => {
  try {
    const filas = await store.listar({ limit: 1000 });
    res.json(filas);
  } catch (err) {
    console.error('[Transporte] listar error:', err.message);
    res.status(500).json({ mensaje: 'No se pudieron cargar las respuestas.' });
  }
});

// SPA fallback.
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(200).send('El frontend aún no fue compilado. Ejecute: npm run client:build');
});

// Arranque: crea la tabla si corresponde y levanta el server.
(async () => {
  if (process.env.DB_AUTO_INIT === 'true') {
    try {
      await store.inicializar();
    } catch (err) {
      console.error('[Transporte] init DB falló:', err.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`🚚 Hoja de Ruta Offal en http://localhost:${PORT}`);
  });
})();
