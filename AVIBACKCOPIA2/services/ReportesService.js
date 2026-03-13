const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ReportesService = {

  //Aspirante: sus propios reportes
  async obtenerReportesPorAspirante(aspiranteId) {

    return await prisma.rEPORTE.findMany({
      where: {
        aspiranteId: aspiranteId,
        testId: 1  
      },
      include: {
        recomendaciones: {
          include: {
            programa: true
          }
        }
      },
      orderBy: {
        Fecha: "desc"
      }
    });

  },

  //Admin: todos los reportes con datos del aspirante
  async obtenerTodosLosReportes() {

    return await prisma.rEPORTE.findMany({
      include: {
        aspirante: {
          select: {
            idASPIRANTE: true,
            nombre_completo: true,
            email: true
          }
        },
        recomendaciones: {
          include: {
            programa: true
          }
        }
      },
      orderBy: {
        Fecha: "desc"
      }
    });

  },
  async elegirPrograma(reporteId, programaId) {

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const reporte = await prisma.rEPORTE.update({
    where: { idREPORTE: Number(reporteId) },
    data: {
      programaElegidoId: Number(programaId)
    },
    include: {
      programaElegido: true
    }
  });

  return reporte;
}

};

module.exports = ReportesService;