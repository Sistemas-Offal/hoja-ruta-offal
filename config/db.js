const sql = require('mssql');
require('dotenv').config();

// Conexión a la base compartida (controletiquetas). Este módulo guarda las
// hojas de ruta en su propio esquema (transporte.HojasRuta) y lee el padrón
// central (esquema acceso) para identidad/permisos.
const dbConfig = {
  user: process.env.DB_USER || process.env.AZURE_SQL_USERNAME,
  password: process.env.DB_PASS || process.env.AZURE_SQL_PASSWORD,
  server: process.env.DB_SERVER || process.env.AZURE_SQL_SERVER,
  database: process.env.DB_NAME || process.env.AZURE_SQL_DATABASE,
  port: parseInt(process.env.DB_PORT || process.env.AZURE_SQL_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || !!process.env.AZURE_SQL_SERVER,
    trustServerCertificate: true,
  },
};

const hayConfigDB = !!(dbConfig.server && dbConfig.user);

const poolPromise = hayConfigDB
  ? sql
      .connect(dbConfig)
      .then((pool) => {
        console.log('✅ hoja-ruta-offal conectado a SQL Server');
        return pool;
      })
      .catch((err) => {
        console.error('❌ Error de conexión a SQL Server:', err.message);
        return null;
      })
  : Promise.resolve(null);

module.exports = { poolPromise, sql, hayConfigDB };
