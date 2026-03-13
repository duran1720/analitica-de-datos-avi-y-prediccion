const AdminController = require('../controllers/AdminController');
const AprendizController = require('../controllers/AprendizController');

const express = require('express');
const router = express.Router();

router.get("/admin/aprendices", AprendizController.listarAprendices);
router.post("/admin/aprendices", AprendizController.crearAprendiz);
router.put("/admin/aprendices/:id", AprendizController.actualizarAprendiz);
router.patch("/admin/aprendices/:id/estado", AprendizController.cambiarEstadoAprendiz);

// NUEVA ANALITICA DE DEMANDA
router.get("/admin/demanda-programas", AdminController.demandaProgramas);  
// ENDPOINT PUBLICO PARA POWER BI
router.get("/powerbi/demanda-programas", AdminController.powerbiDemandaProgramas);

router.get("/admins", AdminController.getAdmin);
router.patch("/admins/:id", AdminController.actualizarAdmin);
router.patch("/admins/:id/status", AdminController.cambiarEstadoAdmin);

module.exports = router;