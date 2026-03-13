const ReportesService = require("../services/ReportesService");

const ReportesController = {

    async misReportes(req, res) {
    try {

        if (req.user.rol !== "aspirante") {
        return res.status(403).json({ error: "No autorizado" });
        }

        const aspiranteId = req.user.id;

        const reportes =
        await ReportesService.obtenerReportesPorAspirante(aspiranteId);

        res.json(reportes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo reportes" });
    }
    },

    async todosReportes(req, res) {
    try {

        if (req.user.rol !== "admin") {
        return res.status(403).json({ error: "No autorizado" });
        }

        const reportes =
        await ReportesService.obtenerTodosLosReportes();

        res.json(reportes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo reportes" });
    }
    },
    async elegirPrograma(req, res) {
        try {

            if (req.user.rol !== "aspirante") {
            return res.status(403).json({ error: "No autorizado" });
            }

            const { reporteId, programaId } = req.body;

            const reporteActualizado =
            await ReportesService.elegirPrograma(reporteId, programaId);

            res.json({
            message: "Programa elegido guardado correctamente",
            reporte: reporteActualizado
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error guardando programa elegido" });
        }
    }

};

module.exports = ReportesController;