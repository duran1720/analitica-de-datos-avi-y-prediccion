import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Aspirante.css";

function AprendizCreate() {

  const API_APRENDIZ = import.meta.env.VITE_API_GETAPRENDICES;
  const API_PROGRAMAS = import.meta.env.VITE_API_GETPROGRAMAS;

  const navigate = useNavigate();

  const [programas, setProgramas] = useState([]);

  const [form, setForm] = useState({
    idAPRENDIZ: "",
    tipoDocumento: "",
    nombre: "",
    apellidos: "",
    programaId: "",
    horas_inasistidas: "",
    estado: true
  });

  useEffect(() => {
    fetch(API_PROGRAMAS)
      .then(res => res.json())
      .then(data => setProgramas(data));
  }, []);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });

  };

  const guardarAprendiz = async (e) => {

    e.preventDefault();

    await fetch(API_APRENDIZ, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        idAPRENDIZ: Number(form.idAPRENDIZ),
        programaId: Number(form.programaId),
        horas_inasistidas: Number(form.horas_inasistidas)
      })
    });

    navigate("/admin/aprendices");
  };

  return (

    <div className="asp-container">

      <h2>Registrar Aprendiz</h2>

      <form className="asp-card" onSubmit={guardarAprendiz}>

        <div className="form-group">
          <label>Documento de identidad</label>
          <input
            name="idAPRENDIZ"
            placeholder="Ej: 1061234567"
            value={form.idAPRENDIZ}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tipo de documento</label>
          <input
            name="tipoDocumento"
            placeholder="Ej: CC, TI, CE"
            value={form.tipoDocumento}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input
            name="nombre"
            placeholder="Nombre del aprendiz"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Apellidos</label>
          <input
            name="apellidos"
            placeholder="Apellidos del aprendiz"
            value={form.apellidos}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Programa de formación</label>
          <select
            name="programaId"
            value={form.programaId}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un programa</option>

            {programas.map(p => (
              <option key={p.idPROGRAMA} value={p.idPROGRAMA}>
                {p.nombre} ({p.nivel})
              </option>
            ))}

          </select>
        </div>

        <div className="form-group">
          <label>Horas de inasistencia</label>

          <input
            type="number"
            name="horas_inasistidas"
            placeholder="Ej: 12"
            value={form.horas_inasistidas}
            onChange={handleChange}
            min="0"
            required
          />

        </div>

        <div className="form-group estado">

          <label>Estado del aprendiz</label>

          <select
            name="estado"
            value={form.estado}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value === "true" })
            }
          >
            <option value="true">Activo</option>
            <option value="false">Suspendido</option>
          </select>

        </div>

        <button className="btn-nuevo">
          Guardar Aprendiz
        </button>

      </form>

    </div>
  );
}

export default AprendizCreate;