import { useMemo, useState } from 'react';

// Valor inicial vacío para cada campo.
function estadoInicial(campos) {
  return Object.fromEntries(campos.map((c) => [c.name, '']));
}

/**
 * Formulario renderizado dinámicamente desde la definición de CAMPOS.
 * Agregar/quitar/renombrar un campo se hace en config/formConfig.js, no acá.
 */
export default function DynamicForm({ campos, onSubmit }) {
  const [valores, setValores] = useState(() => estadoInicial(campos));
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState([]);
  const [ok, setOk] = useState(null);

  const requeridos = useMemo(() => campos.filter((c) => c.required).map((c) => c.name), [campos]);

  function set(name, v) {
    setValores((prev) => ({ ...prev, [name]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setOk(null);
    const faltan = campos.filter((c) => requeridos.includes(c.name) && String(valores[c.name] ?? '').trim() === '');
    if (faltan.length) {
      setErrores(faltan.map((c) => `Falta "${c.label}".`));
      return;
    }
    setErrores([]);
    try {
      setEnviando(true);
      await onSubmit(valores);
      setValores(estadoInicial(campos));
      setOk('Hoja de ruta cargada correctamente.');
    } catch (err) {
      setErrores([err.message || 'No se pudo guardar.']);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-grid">
        {campos.map((c) => (
          <div className={`campo ${c.type === 'select' || c.type === 'date' ? 'campo-sm' : ''}`} key={c.name}>
            <label htmlFor={c.name}>
              {c.label} {c.required && <span className="req">*</span>}
            </label>
            {c.help && <span className="campo-help">{c.help}</span>}

            {c.type === 'select' ? (
              <select id={c.name} value={valores[c.name]} onChange={(e) => set(c.name, e.target.value)}>
                <option value="" disabled>Seleccionar…</option>
                {(c.options || []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                id={c.name}
                type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                inputMode={c.type === 'number' ? 'numeric' : undefined}
                min={c.type === 'number' ? 0 : undefined}
                value={valores[c.name]}
                onChange={(e) => set(c.name, e.target.value)}
                placeholder={c.type === 'number' ? '0' : ''}
              />
            )}
          </div>
        ))}
      </div>

      {errores.length > 0 && (
        <div className="form-errores">
          {errores.map((msg, i) => <div key={i}>• {msg}</div>)}
        </div>
      )}
      {ok && <div className="form-ok">✓ {ok}</div>}

      <div className="form-acciones">
        <button className="btn-primary" type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Cargar hoja de ruta'}
        </button>
      </div>
    </form>
  );
}
