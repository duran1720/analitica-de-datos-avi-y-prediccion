const authService = require('../services/authService');

const authController = {

  // PASO 1 — Recibe datos del formulario, guarda temporal y envía código
  async preRegistroAspirante(req, res) {
    try {
      const resultado = await authService.preRegistroAspirante(req.body);
      res.json({ ok: true, ...resultado });
    } catch (error) {
      res.status(400).json({ ok: false, mensaje: error.message });
    }
  },

  // PASO 2 — Valida el código y crea la cuenta definitiva
  async verificarCodigo(req, res) {
    try {
      const { email, codigo } = req.body;
      const aspirante = await authService.verificarCodigoYRegistrar(email, codigo);
      res.json({ ok: true, mensaje: "Cuenta creada exitosamente", aspirante });
    } catch (error) {
      res.status(400).json({ ok: false, mensaje: error.message });
    }
  },

  // REENVIAR código al mismo email
  async reenviarCodigo(req, res) {
    try {
      const { email } = req.body;
      const resultado = await authService.reenviarCodigo(email);
      res.json({ ok: true, ...resultado });
    } catch (error) {
      res.status(400).json({ ok: false, mensaje: error.message });
    }
  },

  // REGISTRO ADMIN (sin cambios)
  async registeradmin(req, res) {
    try {
      const adminnuevo = await authService.registeradmin(req.body);
      res.json({ mensaje: "Admin registrado", adminnuevo });
    } catch (error) {
      res.status(400).json({ ok: false, mensaje: error.message });
    }
  },

  // LOGIN ASPIRANTE
  async loginasp(req, res) {
    const result = await authService.loginaspirante(req.body);
    if (!result) {
      return res.json({ mensaje: "Credenciales incorrectas" });
    }
    res.json({
      mensaje: "Login exitoso",
      token:   result.token,
      rol:     result.rol,
      usuario: result.user,
    });
  },

  // LOGIN ADMIN
  async loginad(req, res) {
    const result = await authService.loginadmin(req.body);
    if (!result) {
      return res.json({ mensaje: "Credenciales incorrectas" });
    }
    res.json({
      mensaje: "Login exitoso",
      token:   result.token,
      rol:     result.rol,
      usuario: result.user,
    });
  },
};

module.exports = authController;