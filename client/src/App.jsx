import { useEffect, useState } from 'react';
import { getMe, getFormConfig, getHojas, crearHoja } from './api';
import Navbar from './components/Navbar';
import DynamicForm from './components/DynamicForm';
import RespuestasPanel from './components/RespuestasPanel';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [config, setConfig] = useState(null);
  const [vista, setVista] = useState('cargar'); // 'cargar' | 'respuestas'
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [me, cfg] = await Promise.all([getMe(), getFormConfig()]);
        setUsuario(me);
        setConfig(cfg);
        setError(null);
      } catch (err) {
        setError(err.code === 'NO_PERM' ? 'No tenés permiso para este módulo.' : err.message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function cargarFilas() {
    try {
      setRefrescando(true);
      setFilas(await getHojas());
    } catch (err) {
      setError(err.message);
    } finally {
      setRefrescando(false);
    }
  }

  async function irARespuestas() {
    setVista('respuestas');
    await cargarFilas();
  }

  async function onSubmit(datos) {
    await crearHoja(datos);
    // Refresca el panel en segundo plano para que quede al día.
    getHojas().then(setFilas).catch(() => {});
  }

  if (cargando) return <div className="estado">Cargando…</div>;
  if (error) return <div className="estado error">{error}</div>;

  return (
    <>
      <Navbar usuario={usuario} />
      <main className="wrap">
        <div className="head">
          <div>
            <p className="overline">Transporte</p>
            <h1>{config?.meta?.titulo || 'Hoja de Ruta'}</h1>
            {config?.meta?.descripcion && <p className="lead">{config.meta.descripcion}</p>}
          </div>
        </div>

        <nav className="tabs">
          <button className={`tab ${vista === 'cargar' ? 'on' : ''}`} onClick={() => setVista('cargar')}>
            Cargar hoja de ruta
          </button>
          <button className={`tab ${vista === 'respuestas' ? 'on' : ''}`} onClick={irARespuestas}>
            Respuestas
          </button>
        </nav>

        {vista === 'cargar' ? (
          <section className="card-form">
            <DynamicForm campos={config.campos} choferes={config.choferes} onSubmit={onSubmit} />
          </section>
        ) : (
          <RespuestasPanel campos={config.campos} filas={filas} onRefrescar={cargarFilas} refrescando={refrescando} />
        )}

        <footer className="pie"><span>Offal · Hoja de Ruta - Transporte</span></footer>
      </main>
    </>
  );
}
