import { useEffect, useState } from "react";

const Programas = () => {

  const PROGRAMAS_API = import.meta.env.VITE_API_PROGRAMAS

  const [programas, setProgramas] = useState([]);

  useEffect(() => {
    fetch(`${PROGRAMAS_API}`)
      .then(res => res.json())
      .then(data => setProgramas(data))
      .catch(err => console.error(err));
  }, []);


  return (
    <main className="programas">
      <h2>Programas del SENA</h2>

      <div className="filters">
        <select id="nivelFiltro" className="btnnivel">
          <option value="">Todos los niveles</option>
          <option value="TECNICO">Técnico</option>
          <option value="TECNOLOGO">Tecnólogo</option>
        </select>

      </div>

      <table>
        <thead>
          <tr>
            <th>Nivel</th>
            <th>Nombre del Programa</th>
            <th>Descripción</th>
          </tr>
        </thead>
          <tbody>
            {programas.map(p => (
              <tr key={p.idPROGRAMA}>
                <td>{p.nivel}</td>
                <td>{p.nombre}</td>
                <td>{p.descripcion}</td>
              </tr>
            ))}
          </tbody>
      </table>
    </main>
  );
};

export default Programas;