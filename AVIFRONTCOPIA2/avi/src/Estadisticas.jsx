import { useState, useEffect } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import "./Estadisticas.css";

/* -------- REGISTRO CHARTJS -------- */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

function Estadisticas() {

  /* -------- ENV -------- */
  const API_RESUMEN = import.meta.env.VITE_API_ESTADISTICASTEST;
  const API_MENSUAL = import.meta.env.VITE_API_ESTADISTICAS_MENSUAL;
  const API_TOP_PROGRAMAS = import.meta.env.VITE_API_PROGRAMAS_RECOMENDADOS;
  const API_PROGRAMA_MES = import.meta.env.VITE_API_PROGRAMA_MENSUAL;
  const API_PROGRAMAS_SELECT = import.meta.env.VITE_API_PROGRAMASSELECT;

  /* -------- STATES -------- */
  const [resumen, setResumen] = useState(null);

  const [mensual, setMensual] = useState([]);
  const [yearTests, setYearTests] = useState(new Date().getFullYear());

  const [programasTop, setProgramasTop] = useState([]);
  const [meses, setMeses] = useState(3);

  const [programasSelect, setProgramasSelect] = useState([]);

  const [programaSel, setProgramaSel] = useState(null);
  const [evolucionPrograma, setEvolucionPrograma] = useState([]);
  const [yearPrograma, setYearPrograma] = useState(new Date().getFullYear());

  /* -------- FETCHS -------- */
  async function getResumen() {
    const res = await fetch(API_RESUMEN);
    const json = await res.json();
    setResumen(json.data);
  }

  async function getMensual(year) {
    const res = await fetch(`${API_MENSUAL}?year=${year}`);
    const json = await res.json();
    setMensual(json.data.meses || []);
  }

  async function getProgramasTop() {
    const res = await fetch(`${API_TOP_PROGRAMAS}?limit=5&meses=${meses}`);
    const json = await res.json();
    setProgramasTop(json.data || []);
  }

  async function getProgramasSelect() {
    const res = await fetch(API_PROGRAMAS_SELECT);
    const json = await res.json();
    setProgramasSelect(json.data || []);

    if (json.data.length > 0) {
      setProgramaSel(json.data[0].idPROGRAMA);
    }
  }

  async function getProgramaMes() {
    if (!programaSel) return;

    const res = await fetch(
      `${API_PROGRAMA_MES}?programaId=${programaSel}&year=${yearPrograma}`
    );
    const json = await res.json();
    setEvolucionPrograma(json.data.meses || []);
  }

  /* -------- EFFECTS -------- */
  useEffect(() => {
    getResumen();
    getProgramasSelect();
  }, []);

  useEffect(() => {
    getMensual(yearTests);
  }, [yearTests]);

  useEffect(() => {
    getProgramasTop();
  }, [meses]);

  useEffect(() => {
    getProgramaMes();
  }, [programaSel, yearPrograma]);

  if (!resumen) return <p>Cargando estadísticas...</p>;

  /* -------- GRAFICO 1 (RESUMEN) -------- */
  const resumenBarData = {
    labels: ["Hoy", "Semana", "Mes"],
    datasets: [
      {
        label: "Tests realizados",
        data: [resumen.hoy, resumen.semana, resumen.mes],
        backgroundColor: ["#36ebb8", "#de61c7", "#ffeb56"],
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  /* -------- GRAFICO 2 (TESTS POR AÑO) -------- */
  const mensualData = {
    labels: [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ],
    datasets: [
      {
        label: "Cantidad de Test Realizados",
        data: mensual,
        borderColor: "#cd88f2",
        backgroundColor: "rgba(205,136,242,0.25)",
        tension: 0.2,
        fill: true,
      },
    ],
  };

  /* -------- GRAFICO 3 (TOP PROGRAMAS) -------- */
  const programasDonutData = {
    labels: programasTop.map(p => p.programa),
    datasets: [
      {
        data: programasTop.map(p => p.total),
        backgroundColor: [
          "#79dcee",
          "#80ff56",
          "#de61c7",
          "#4BC0C0",
          "#9966FF",
        ],
        borderWidth: 2,
      },
    ],
  };

  /* -------- GRAFICO 4 (PROGRAMA POR MES) -------- */
  const programaLineData = {
    labels: [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ],
    datasets: [
      {
        label: `Recomendaciones de ${programaSel}`,
        data: evolucionPrograma,
        borderColor: "#eb3636",
        backgroundColor: "rgba(235, 54, 54, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div>

      <h1 id="tituloestadisticas">Estadísticas de Tests</h1>

      <div className="Test">

        <div className="dataCard">
          <h3>Resumen</h3>
          <Bar
            data={resumenBarData}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, precision: 0 },
                },
              },
            }}
          />
        </div>

        <div className="dataCard meses">
          <h3>
            Tests por Año
            <select
              className="year-select"
              value={yearTests}
              onChange={e => setYearTests(Number(e.target.value))}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </h3>

          <Line data={mensualData} 
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  }
                }
              },
              plugins: {
                legend: { display: true }
              }
            }}

          />
        </div>

      </div>

      <h1 id="tituloestadisticas">Estadísticas de Programas</h1>

      <div className="Test">

        <div className="dataCard resumensito">
          <h3>Programas más recomendados
            <select
              className="year-select"
              value={meses}
              onChange={e => setMeses(Number(e.target.value))}
            >
              <option value={1}>Último mes</option>
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Último año</option>
            </select>

          </h3>
          <Doughnut
            data={programasDonutData}
              options={{
                cutout: "60%",
                plugins: {
                  legend: {
                    display: true,
                    position: "right", 
                    labels: {
                      boxWidth: 14,
                      padding: 15,
                      font: {
                        size: 12
                      }
                    }
                  }
                }
              }}

          />
        </div>

        <div className="dataCard meses">
          <h3>
            Programa
            <select
              className="year-select"
              value={programaSel}
              onChange={e => setProgramaSel(Number(e.target.value))}
            >
              {programasSelect.map(p => (
                <option key={p.idPROGRAMA} value={p.idPROGRAMA}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </h3>

          <h3>
            Año
            <select
              className="year-select"
              value={yearPrograma}
              onChange={e => setYearPrograma(Number(e.target.value))}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </h3>

          <Line data={programaLineData} 
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                }
              },
              plugins: {
                legend: { display: true }
              }
            }}

          />
        </div>

      </div>
    </div>
  );
}

export default Estadisticas;
