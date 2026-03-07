import { useEffect, useState } from "react";
import "./ProgramasAdmin.css";

function ProgramasAdmin() {
  const API = import.meta.env.VITE_API_PROGRAMAS;
  const API_CENTROS = import.meta.env.VITE_API_CENTROS;

  const [programas, setProgramas] = useState([]);
  const [centros, setCentros] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [descripcionModal, setDescripcionModal] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editarPrograma, setEditarPrograma] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    nivel: "Ninguno",
    descripcion: "",
    centroId: 1
  });

  useEffect(() => {
    obtenerProgramas();
    obtenerCentros();
  }, []);

  const obtenerProgramas = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setProgramas(data);
  };

  const obtenerCentros = async () => {
    const res = await fetch(API_CENTROS);
    const data = await res.json();
    setCentros(data);
  };

  const abrirModalCrear = () => {
    setEditarPrograma(null);
    setForm({
      nombre: "",
      nivel: "Ninguno",
      descripcion: "",
      centroId: centros.length ? centros[0].idCENTRO : 1
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (programa) => {
    setEditarPrograma(programa);
    setForm({
      nombre: programa.nombre,
      nivel: programa.nivel,
      descripcion: programa.descripcion,
      centroId: programa.centroId
    });
    setMostrarModal(true);
  };

  const guardarPrograma = async () => {
    if (editarPrograma) {
      // EDITAR programa usando la API
      await fetch(`${API}/${editarPrograma.idPROGRAMA}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // CREAR programa
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setMostrarModal(false);
    obtenerProgramas();
  };

  const cambiarEstado = async (programa) => {
    await fetch(`${API}/${programa.idPROGRAMA}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !programa.activo }),
    });
    obtenerProgramas();
  };

  const recortarDescripcion = (texto) => {
    if (!texto) return "";
    return texto.length > 40 ? texto.substring(0, 40) + "..." : texto;
  };

  return (
    <div className="contenido">
      <h1>Programas de Formación CTPI</h1>

      <button className="btn-crear" onClick={abrirModalCrear}>➕</button>

      <input
        type="text"
        placeholder="Buscar programa..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="buscador"
      />

      <table className="tabla-programas">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Nivel</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {programas
            .filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
            .map(p => (
              <tr key={p.idPROGRAMA}>
                <td>{p.nombre}</td>
                <td>{p.nivel}</td>
                <td>
                  {recortarDescripcion(p.descripcion)}{" "}
                  <button onClick={() => setDescripcionModal(p.descripcion)}>👀</button>
                </td>
                <td className={p.activo ? "estado-on" : "estado-off"}>
                  {p.activo ? "Habilitado" : "Inhabilitado"}
                </td>
                <td>
                  <button onClick={() => cambiarEstado(p)}>
                    {p.activo ? "🔒" : "🔓"}
                  </button>
                  <button onClick={() => abrirModalEditar(p)}>✏️</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* MODAL CREAR/EDITAR */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal amplio" onClick={e => e.stopPropagation()}>
            <h2>{editarPrograma ? "Editar Programa" : "Crear Programa"}</h2>

            <input
              placeholder="Nombre"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />

            <select
              value={form.nivel}
              onChange={e => setForm({ ...form, nivel: e.target.value })}
            >
              <option>Ninguno</option>
              <option>Técnico</option>
              <option>Tecnólogo</option>
            </select>

            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
            />

            <select
              value={form.centroId}
              onChange={e => setForm({ ...form, centroId: Number(e.target.value) })}
            >
              {centros.map(c => (
                <option key={c.idCENTRO} value={c.idCENTRO}>{c.nombre}</option>
              ))}
            </select>

            <div className="botones-modal">
              <button onClick={guardarPrograma}>Guardar</button>
              <button onClick={() => setMostrarModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESCRIPCIÓN */}
      {descripcionModal && (
        <div className="modal-overlay" onClick={() => setDescripcionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Descripción completa</h3>
            <p>{descripcionModal}</p>
            <button onClick={() => setDescripcionModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramasAdmin;