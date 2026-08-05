/**
 * Capa de persistencia de las hojas de ruta.
 *
 * Si hay conexión a SQL, guarda/lee en transporte.HojasRuta (la tabla se crea
 * idempotente desde la definición de CAMPOS). Si no hay base (desarrollo local),
 * usa un almacén EN MEMORIA con datos de ejemplo, para poder probar el formulario
 * y el panel sin base.
 */
const { poolPromise, sql } = require('../config/db');
const { CAMPOS, FORM_META } = require('../config/formConfig');

const TABLA = FORM_META.tabla; // transporte.HojasRuta
const ESQUEMA = FORM_META.esquema; // transporte

// ---- Mapeo de tipos ----
function ddlTipo(sqlType) {
  if (sqlType === 'date') return 'DATE';
  if (sqlType === 'int') return 'INT';
  return 'NVARCHAR(255)';
}
function mssqlTipo(sqlType) {
  if (sqlType === 'date') return sql.Date;
  if (sqlType === 'int') return sql.Int;
  return sql.NVarChar(255);
}

// ---- Init idempotente (crea esquema + tabla desde CAMPOS) ----
async function inicializar() {
  const pool = await poolPromise;
  if (!pool) return false;

  const columnas = CAMPOS.map((c) => `  [${c.name}] ${ddlTipo(c.sqlType)} ${c.required ? 'NOT NULL' : 'NULL'}`).join(',\n');
  const ddl = `
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '${ESQUEMA}')
  EXEC('CREATE SCHEMA ${ESQUEMA}');
IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = '${ESQUEMA}' AND t.name = 'HojasRuta')
  CREATE TABLE ${TABLA} (
  [Id] INT IDENTITY(1,1) PRIMARY KEY,
${columnas},
  [CreadoPor] NVARCHAR(255) NULL,
  [CreadoEn] DATETIME2 NOT NULL CONSTRAINT DF_HojasRuta_CreadoEn DEFAULT SYSUTCDATETIME()
  );`;

  await pool.request().batch(ddl);
  console.log(`✅ Tabla ${TABLA} verificada/creada`);
  return true;
}

// ---- Almacén en memoria (fallback sin base) ----
const memoria = [
  {
    Id: 2, fecha: '2026-08-04', numero_remito: 'R-0001824', chofer: 'Sin asignar',
    patente_tractor: 'AB123CD', destino: 'Buenos Aires', semi_lleva: 'Producto congelado',
    semi_trae: 'Vacío', hielo: 12, tambor: 4, pallets: 18, agua_oxigenada: 2, tambor_miel: 0,
    CreadoPor: 'roberto.sanabria@offal.com.ar', CreadoEn: '2026-08-04T11:20:00Z',
  },
  {
    Id: 1, fecha: '2026-08-03', numero_remito: 'R-0001799', chofer: 'Sin asignar',
    patente_tractor: 'AA987ZZ', destino: 'Rosario', semi_lleva: 'Menudencias',
    semi_trae: 'Insumos', hielo: 8, tambor: 6, pallets: 20, agua_oxigenada: 1, tambor_miel: 3,
    CreadoPor: 'roberto.sanabria@offal.com.ar', CreadoEn: '2026-08-03T09:05:00Z',
  },
];
let memSeq = 2;

// ---- API pública ----
async function guardar(datos, email) {
  const pool = await poolPromise;

  if (!pool) {
    const fila = { Id: ++memSeq, ...datos, CreadoPor: email, CreadoEn: new Date().toISOString() };
    memoria.unshift(fila);
    return fila;
  }

  const req = pool.request();
  CAMPOS.forEach((c) => req.input(c.name, mssqlTipo(c.sqlType), datos[c.name]));
  req.input('CreadoPor', sql.NVarChar(255), email);

  const cols = CAMPOS.map((c) => `[${c.name}]`).join(', ');
  const vals = CAMPOS.map((c) => `@${c.name}`).join(', ');
  const r = await req.query(
    `INSERT INTO ${TABLA} (${cols}, [CreadoPor]) OUTPUT INSERTED.* VALUES (${vals}, @CreadoPor);`
  );
  return r.recordset[0];
}

async function listar({ limit = 500 } = {}) {
  const pool = await poolPromise;
  if (!pool) return memoria.slice(0, limit);

  const r = await pool.request().input('limit', sql.Int, limit).query(
    `SELECT TOP (@limit) * FROM ${TABLA} ORDER BY Id DESC;`
  );
  return r.recordset;
}

module.exports = { inicializar, guardar, listar };
