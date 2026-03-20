const express          = require("express");
const router           = express.Router();
const authController   = require("../controllers/authController");
const verificarToken   = require("../middleware/authMiddleware");

// ── REGISTRO ASPIRANTE (2 pasos con verificación por email) ──────────────
router.post('/pre-registro',     authController.preRegistroAspirante);  // Paso 1: envía código
router.post('/verificar-codigo', authController.verificarCodigo);        // Paso 2: valida y crea cuenta
router.post('/reenviar-codigo',  authController.reenviarCodigo);         // Opcional: reenviar

// ── LOGIN ─────────────────────────────────────────────────────────────────
router.post('/loginaspirante', authController.loginasp);
router.post('/loginadmin',     authController.loginad);

// ── PERFIL PROTEGIDO ──────────────────────────────────────────────────────
router.get('/perfil', verificarToken, (req, res) => {
  res.json({ mensaje: "Acceso Permitido", usuario: req.user });
});

// ── REGISTRO ADMIN ────────────────────────────────────────────────────────
router.post('/registroadmin', authController.registeradmin);

module.exports = router;