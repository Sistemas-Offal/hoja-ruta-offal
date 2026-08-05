import { useMemo, useState } from 'react';

function fmtFecha(v) {
  if (!v) return '';
  // Fecha 'YYYY-MM-DD' o ISO → dd/MM/yyyy.
  const d = new Date(v.length <= 10 ? `${v}T00:00:00` : v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('es-AR');
}

function aCSV(campos, filas) {
  const cols = [...campos.map((c) => c.label), 'Cargado por', 'Cargado el'];
  const keys = [...campos.map((c) => c.name), 'CreadoPor', 'CreadoEn'];
  const esc = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const lineas = [cols.map(esc).join(',')];
  filas.forEach((f) => lineas.push(keys.map((k) => esc(f[k])).join(',')));
  return lineas.join('\r\n');
}

/** Panel de respuestas: búsqueda, tabla y export a CSV. */
export default function RespuestasPanel({ campos, filas, onRefrescar, refrescando }) {
  const [q, setQ] = useState('');

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return filas;
    return filas.filter((f) => campos.some((c) => String(f[c.name] ?? '').toLowerCase().includes(t)));
  }, [q, filas, campos]);

  function exportar() {
    const csv = aCSV(campos, filtradas);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hojas-de-ruta.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel-resp">
      <div className="panel-tools">
        <input
          className="buscar"
          placeholder="Buscar (remito, chofer, destino…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="conteo">{filtradas.length} registro{filtradas.length === 1 ? '' : 's'}</span>
        <div className="panel-tools-der">
          <button className="btn-ghost" onClick={onRefrescar} disabled={refrescando}>
            {refrescando ? 'Actualizando…' : '↻ Actualizar'}
          </button>
          <button className="btn-ghost" onClick={exportar} disabled={!filtradas.length}>⤓ Exportar CSV</button>
        </div>
      </div>

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              {campos.map((c) => <th key={c.name} className={c.type === 'number' ? 'num' : ''}>{c.label}</th>)}
              <th>Cargado por</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f) => (
              <tr key={f.Id}>
                {campos.map((c) => (
                  <td key={c.name} className={c.type === 'number' ? 'num' : ''}>
                    {c.type === 'date' ? fmtFecha(f[c.name]) : f[c.name]}
                  </td>
                ))}
                <td className="muted">{f.CreadoPor}</td>
              </tr>
            ))}
            {!filtradas.length && (
              <tr><td className="vacio" colSpan={campos.length + 1}>No hay registros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
