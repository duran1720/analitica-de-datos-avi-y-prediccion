const express = require("express");
const router = express.Router();
const ReportesController = require("../controllers/ReportesController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/misreportes", verificarToken, ReportesController.misReportes);

router.get("/todos", verificarToken, ReportesController.todosReportes);

router.post("/reportes/elegir-programa", verificarToken, ReportesController.elegirPrograma);

module.exports = router;