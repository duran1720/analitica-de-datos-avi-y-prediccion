const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const AprendizService = {


  async crearAprendizDesdeAdmin(datos) {
    const aprendiz = await prisma.aPRENDIZ.create({
      data: {
        idAPRENDIZ: datos.idAPRENDIZ,
        tipoDocumento: datos.tipoDocumento,
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        programaId: datos.programaId,
        horas_inasistidas: datos.horas_inasistidas || 0
      }
    });
    // La predicción de deserción es gestionada por el endpoint incremental de FastAPI
    return aprendiz;
  },

  async actualizarAprendiz(idAPRENDIZ, datos) {
    return await prisma.aPRENDIZ.update({
      where: { idAPRENDIZ: Number(idAPRENDIZ) },
      data: {
        tipoDocumento: datos.tipoDocumento,
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        programaId: datos.programaId
      }
    });
  },


  async cambiarEstadoAprendiz(idAPRENDIZ, estado) {
    return await prisma.aPRENDIZ.update({
      where: { idAPRENDIZ: Number(idAPRENDIZ) },
      data: {
        estado: estado
      }
    });
  },

  async listarAprendices() {
    return await prisma.aPRENDIZ.findMany({
      include: {
        programa: {
          select: {
            idPROGRAMA: true,
            nombre: true,
            nivel: true
          }
        }
      },
      orderBy: {
        nombre: "asc"
      }
    });
  },

  
  async predecirDesercionAprendiz(idAPRENDIZ) {

    const aprendiz = await prisma.aPRENDIZ.findUnique({
      where: { idAPRENDIZ: Number(idAPRENDIZ) },
      include: {
        programa: true,
        predicciones: {
          orderBy: { fecha: "desc" },
          take: 1
        }
      }
    });

    if (!aprendiz) {
      throw new Error("Aprendiz no encontrado");
    }

    return {
      aprendiz: {
        id: aprendiz.idAPRENDIZ,
        nombre: aprendiz.nombre,
        programa: aprendiz.programa?.nombre
      },
      prediccion: aprendiz.predicciones[0] || null
    };

  },

  async riesgoDesercionPorPrograma() {

    // Leer las últimas predicciones guardadas por el proceso incremental de FastAPI
    const aprendices = await prisma.aPRENDIZ.findMany({
      include: {
        programa: true,
        predicciones: {
          orderBy: { fecha: "desc" },
          take: 1
        }
      }
    });

    const resultado = {};

    for (const aprendiz of aprendices) {
      const nombrePrograma = aprendiz.programa?.nombre || "Sin programa";
      const ultimaPrediccion = aprendiz.predicciones[0];
      const riesgoTexto = ultimaPrediccion?.riesgo || "";

      if (!resultado[nombrePrograma]) {
        resultado[nombrePrograma] = {
          programa: nombrePrograma,
          total_aprendices: 0,
          riesgo_alto: 0
        };
      }

      resultado[nombrePrograma].total_aprendices++;

      if (riesgoTexto.toUpperCase().includes("ALTO")) {
        resultado[nombrePrograma].riesgo_alto++;
      }
    }

    return Object.values(resultado);

  },

  async crearAprendicesMasivo(aprendices) {
    let creados = 0;

    for (const datos of aprendices) {

      const aprendiz = await prisma.aPRENDIZ.create({
        data: {
          idAPRENDIZ: Number(datos.idAPRENDIZ),
          tipoDocumento: datos.tipoDocumento,
          nombre: datos.nombre,
          apellidos: datos.apellidos,
          estado: datos.estado,
          horas_inasistidas: Number(datos.horas_inasistidas),
          fechaIngreso: new Date(datos.fechaIngreso),
          programaId: Number(datos.programaId)
        }
      });

      creados++;

    }

    return { total: creados };
  }

};

module.exports = AprendizService;