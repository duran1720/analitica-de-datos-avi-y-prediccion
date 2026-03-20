const AdminService = require('../services/AdminService');
const DashboardService = require("../services/DashboardService");
const AprendizService = require("../services/AprendizService");
const FabricService = require("../services/FabricService");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const AdminController = {

  async getAdmin(req, res) {
    const admin = await AdminService.traerAdmins();
    res.json(admin);
  },

  async actualizarAdmin(req, res) {
    const { id } = req.params;
    const datos = req.body;

    const adminActualizado = await AdminService.actualizarAdmin(id, datos);

    res.json({
      message: "Admin actualizado correctamente",
      data: adminActualizado
    });
  },

  async cambiarEstadoAdmin(req, res) {
    const { id } = req.params;
    const { activo } = req.body;

    const adminActualizado = await AdminService.cambiarEstadoAdmin(id, activo);

    res.json({
      message: "Estado del admin actualizado correctamente",
      data: adminActualizado
    });
  },

  async dashboardDesercion(req, res) {
    try {

      const datos = await DashboardService.desercionPorPrograma();

      res.json(datos);

    } catch (error) {

      res.status(500).json({
        message: "Error generando dashboard",
        error: error.message
      });

    }
  },

  // Calcula demanda por programa usando la IA legacy (/predict-demanda)
  async calcularDemanda() {

    const programas = await prisma.pROGRAMA.findMany({
      include: {
        aprendices: true,
        reportesElegidos: true
      }
    });

    const resultado = [];

    for (const programa of programas) {

      const aprendices = programa.aprendices.length;
      const aspirantes = programa.reportesElegidos.length;

      let demandaPredicha = 0;

      if (aspirantes > 0) {

        // calcular promedios RIASEC
        let sumaR = 0;
        let sumaI = 0;
        let sumaA = 0;
        let sumaS = 0;
        let sumaE = 0;
        let sumaC = 0;

        programa.reportesElegidos.forEach(reporte => {

          sumaR += reporte.puntajeR;
          sumaI += reporte.puntajeI;
          sumaA += reporte.puntajeA;
          sumaS += reporte.puntajeS;
          sumaE += reporte.puntajeE;
          sumaC += reporte.puntajeC;

        });

        const promedio = {
          R: sumaR / aspirantes,
          I: sumaI / aspirantes,
          A: sumaA / aspirantes,
          S: sumaS / aspirantes,
          E: sumaE / aspirantes,
          C: sumaC / aspirantes
        };

        const datosIA = {
          programaId: programa.idPROGRAMA,
          puntajeR: promedio.R,
          puntajeI: promedio.I,
          puntajeA: promedio.A,
          puntajeS: promedio.S,
          puntajeE: promedio.E,
          puntajeC: promedio.C,
          aprendices_actuales: aprendices
        };

        try {

          const respuesta = await fetch("http://127.0.0.1:8000/predict-demanda", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(datosIA)
          });

          const data = await respuesta.json();

          demandaPredicha = data.demanda_predicha;

        } catch (error) {

          console.log("Error llamando IA:", error.message);

        }

      }

      resultado.push({
        programa: programa.nombre,
        nivel: programa.nivel,
        aspirantes,
        aprendices,
        demanda_predicha: demandaPredicha
      });

    }

    // ordenar por demanda
    resultado.sort((a, b) => b.demanda_predicha - a.demanda_predicha);

    // ranking
    resultado.forEach((p, index) => {
      p.ranking = index + 1;
    });

    return resultado;

  },

  // Endpoint admin: retorna demanda de todos los programas
  async demandaProgramas(req, res) {

    try {

      const resultado = await AdminController.calcularDemanda();

      res.json(resultado);

    } catch (error) {

      res.status(500).json({
        message: "Error obteniendo demanda",
        error: error.message
      });

    }

  },

  // Retorna ultima prediccion por programa (para Power BI); sin duplicados, mayor a menor demanda
  async powerbiDemandaProgramas(req, res) {

    try {

      const filas = await FabricService.obtenerUltimaPrediccionPorPrograma();
      const resultado = filas.map((p, index) => ({
        id:                p.id,
        programa:          p.programa,
        nivel:             p.nivel,
        demanda:           p.demanda,
        tendencia:         p.tendencia,
        confianza:         p.confianza,
        trimestre_objetivo: p.trimestre,
        accion_sugerida:   p.accion,
        fecha:             p.fecha,
        ranking:           index + 1,
      }));

      res.json(resultado);

    } catch (error) {

      res.status(500).json({
        message: "Error obteniendo datos para Power BI",
        error: error.message
      });

    }

  },

  // Carga masiva de aprendices desde JSON array
  async uploadAprendices(req, res) {

    try {

      const aprendices = req.body;

      if (!Array.isArray(aprendices)) {

        return res.status(400).json({
          message: "Se esperaba un arreglo de aprendices"
        });

      }

      const total = await AprendizService.crearAprendicesMasivo(aprendices);

      res.status(201).json({
        message: "Aprendices cargados correctamente",
        total
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: "Error al registrar aprendices",
        error: error.message
      });

    }

  }

};

module.exports = AdminController;