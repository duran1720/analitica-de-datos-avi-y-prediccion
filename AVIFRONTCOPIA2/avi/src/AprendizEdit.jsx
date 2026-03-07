import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Aspirante.css";

function AprendizEdit() {

  const { id } = useParams();
  const navigate = useNavigate();

  const API_APRENDIZ = import.meta.env.VITE_API_GETAPRENDICES;
  const API_PROGRAMAS = import.meta.env.VITE_API_GETPROGRAMAS;

  const [programas, setProgramas] = useState([]);

  const [form, setForm] = useState({
    tipoDocumento: "",
    nombre: "",
    apellidos: "",
    programaId: "",
    horas_inasistidas: ""
  });

  useEffect(() => {

    const cargarDatos = async () => {

      const resAprendices = await fetch(API_APRENDIZ);
      const dataAprendices = await resAprendices.json();

      const aprendiz = dataAprendices.find(
        a => a.idAPRENDIZ === Number(id)
      );

      if (aprendiz) {
        setForm({
          tipoDocumento: aprendiz.tipoDocumento,
          nombre: aprendiz.nombre,
          apellidos: aprendiz.apellidos,
          programaId: aprendiz.programaId,
          horas_inasistidas: aprendiz.horas_inasistidas
        });
      }

      const resProgramas = await fetch(API_PROGRAMAS);
      const dataProgramas = await resProgramas.json();
      setProgramas(dataProgramas);

    };

    cargarDatos();

  }, [id]);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  const actualizarAprendiz = async (e) => {

    e.preventDefault();

    await fetch(`${API_APRENDIZ}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        programaId: Number(form.programaId),
        horas_inasistidas: Number(form.horas_inasistidas)
      })
    });

    navigate("/admin/aprendices");

  };

  return (

    <div className="asp-container">

      <h2>Editar Aprendiz</h2>

      <form className="asp-card" onSubmit={actualizarAprendiz}>

        <div className="form-group">
          <label>Tipo de documento</label>
          <input
            name="tipoDocumento"
            value={form.tipoDocumento}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Apellidos</label>
          <input
            name="apellidos"
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
            value={form.horas_inasistidas}
            onChange={handleChange}
            min="0"
            required
          />

        </div>

        <button className="btn-nuevo">
          Actualizar Aprendiz
        </button>

      </form>

    </div>

  );

}

export default AprendizEdit;