/**
 * Definición del formulario "Hoja de Ruta - Transporte".
 *
 * Es la ÚNICA fuente de verdad: de acá salen (1) las columnas de la tabla SQL,
 * (2) los campos del formulario en el cliente y (3) las columnas del panel de
 * respuestas. Para cambiar el formulario, se edita este archivo.
 *
 * Cada campo:
 *   name     → clave JSON + nombre de columna SQL
 *   label    → etiqueta visible
 *   type     → 'date' | 'text' | 'number' | 'select'
 *   required → obligatorio
 *   help     → texto de ayuda (opcional)
 *   options  → opciones (solo type 'select')
 *   sqlType  → tipo de columna ('date' | 'nvarchar' | 'int')
 */

// Lista de choferes del desplegable. ⚠️ PROVISORIA — reemplazar por la lista real
// (o cambiar el campo 'chofer' a que lea de una tabla/maestro).
const CHOFERES = [
  'Sin asignar',
];

const CAMPOS = [
  { name: 'fecha', label: 'Fecha', type: 'date', required: true, sqlType: 'date',
    help: 'Seleccione la fecha correspondiente a la hoja de ruta.' },
  { name: 'numero_remito', label: 'Número de Remito', type: 'text', required: true, sqlType: 'nvarchar' },
  { name: 'chofer', label: 'Chofer', type: 'select', required: true, options: CHOFERES, sqlType: 'nvarchar' },
  { name: 'patente_tractor', label: 'Patente del Tractor', type: 'text', required: true, sqlType: 'nvarchar' },
  { name: 'destino', label: 'Destino', type: 'text', required: true, sqlType: 'nvarchar' },
  { name: 'semi_lleva', label: 'Semi Lleva', type: 'text', required: true, sqlType: 'nvarchar' },
  { name: 'semi_trae', label: 'Semi Trae', type: 'text', required: true, sqlType: 'nvarchar' },
  { name: 'hielo', label: 'Hielo', type: 'number', required: true, sqlType: 'int' },
  { name: 'tambor', label: 'Tambor', type: 'number', required: true, sqlType: 'int' },
  { name: 'pallets', label: 'Pallets', type: 'number', required: true, sqlType: 'int' },
  { name: 'agua_oxigenada', label: 'Agua Oxigenada', type: 'number', required: true, sqlType: 'int' },
  { name: 'tambor_hiel', label: 'Tambor de Hiel', type: 'number', required: true, sqlType: 'int' },
];

// Metadatos del módulo.
const FORM_META = {
  titulo: 'Hoja de Ruta - Transporte',
  descripcion: 'Complete este formulario al iniciar la hoja de ruta.',
  tabla: 'transporte.HojasRuta',
  esquema: 'transporte',
};

module.exports = { CAMPOS, CHOFERES, FORM_META };
