const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

const { enviarCodigoVerificacion } = require("./EmailService");

/** Genera un código numérico de 6 dígitos */
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const authService = {

  // ────────────────────────────────────────────────────────────────
  //  PRE-REGISTRO: guarda datos temporalmente y envía código por email
  // ────────────────────────────────────────────────────────────────
  async preRegistroAspirante(data) {
    const {
      idASPIRANTE,
      nombre_completo,
      fechaNacimiento,
      email,
      telefono,
      barrio,
      direccion,
      ocupacion,
      institucion,
      password,
    } = data;

    // Validación: institución obligatoria si estudia
    if (
      (ocupacion === "Colegio" || ocupacion === "Universidad") &&
      !institucion
    ) {
      throw new Error("La institución es obligatoria si el aspirante estudia");
    }

    // Verificar que el aspirante no exista ya en la BD
    const existe = await prisma.aSPIRANTE.findUnique({
      where: { idASPIRANTE },
    });
    if (existe) {
      throw new Error("Ya existe un usuario registrado con esa identificación");
    }

    // Verificar email duplicado
    const emailExiste = await prisma.aSPIRANTE.findFirst({
      where: { email },
    });
    if (emailExiste) {
      throw new Error("Ya existe una cuenta con ese correo electrónico");
    }

    // Encriptar contraseña ANTES de guardar en temporal
    const passwordHash = await bcrypt.hash(password, 10);

    const codigo    = generarCodigo();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar (o reemplazar) registro temporal
    await prisma.cODIGO_VERIFICACION.upsert({
      where:  { email },
      update: {
        codigo,
        expiresAt,
        datos: {
          idASPIRANTE,
          nombre_completo,
          fechaNacimiento,
          email,
          telefono,
          barrio,
          direccion,
          ocupacion,
          institucion: institucion || null,
          password: passwordHash,
        },
      },
      create: {
        email,
        codigo,
        expiresAt,
        datos: {
          idASPIRANTE,
          nombre_completo,
          fechaNacimiento,
          email,
          telefono,
          barrio,
          direccion,
          ocupacion,
          institucion: institucion || null,
          password: passwordHash,
        },
      },
    });

    // Enviar email con código
    await enviarCodigoVerificacion(email, nombre_completo, codigo);

    return { mensaje: "Código enviado al correo", email };
  },

  // ────────────────────────────────────────────────────────────────
  //  VERIFICAR CÓDIGO: valida el código y crea la cuenta definitiva
  // ────────────────────────────────────────────────────────────────
  async verificarCodigoYRegistrar(email, codigo) {
    const registro = await prisma.cODIGO_VERIFICACION.findUnique({
      where: { email },
    });

    if (!registro) {
      throw new Error("No hay un registro pendiente para este correo");
    }

    if (new Date() > new Date(registro.expiresAt)) {
      await prisma.cODIGO_VERIFICACION.delete({ where: { email } });
      throw new Error("El código ha expirado. Por favor regístrate de nuevo");
    }

    if (registro.codigo !== codigo.trim()) {
      throw new Error("Código incorrecto");
    }

    // Código válido → crear aspirante definitivo
    const d = registro.datos;

    const nuevoAspirante = await prisma.aSPIRANTE.create({
      data: {
        idASPIRANTE:     d.idASPIRANTE,
        nombre_completo: d.nombre_completo,
        fechaNacimiento: new Date(d.fechaNacimiento),
        email:           d.email,
        telefono:        d.telefono,
        barrio:          d.barrio,
        direccion:       d.direccion,
        ocupacion:       d.ocupacion,
        institucion:     d.institucion || null,
        password:        d.password,
      },
    });

    // Limpiar registro temporal
    await prisma.cODIGO_VERIFICACION.delete({ where: { email } });

    return nuevoAspirante;
  },

  // ────────────────────────────────────────────────────────────────
  //  REENVIAR CÓDIGO
  // ────────────────────────────────────────────────────────────────
  async reenviarCodigo(email) {
    const registro = await prisma.cODIGO_VERIFICACION.findUnique({
      where: { email },
    });

    if (!registro) {
      throw new Error("No hay un registro pendiente para ese correo");
    }

    const nuevoCodigo = generarCodigo();
    const expiresAt   = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.cODIGO_VERIFICACION.update({
      where:  { email },
      data:   { codigo: nuevoCodigo, expiresAt },
    });

    const nombre = registro.datos?.nombre_completo || "Aspirante";
    await enviarCodigoVerificacion(email, nombre, nuevoCodigo);

    return { mensaje: "Código reenviado correctamente" };
  },

  // ────────────────────────────────────────────────────────────────
  //  REGISTRO ADMIN (sin cambios)
  // ────────────────────────────────────────────────────────────────
  async registeradmin(data) {
    const { idADMIN, nombre, email, password } = data;

    const passwordEncriptado = await bcrypt.hash(password, 10);

    const nuevoAdmin = await prisma.aDMIN.create({
      data: { idADMIN, nombre, email, password: passwordEncriptado },
    });

    return nuevoAdmin;
  },

  // ────────────────────────────────────────────────────────────────
  //  LOGIN ASPIRANTE (sin cambios)
  // ────────────────────────────────────────────────────────────────
  async loginaspirante(data) {
    const { id, pass } = data;

    const aspirante = await prisma.aSPIRANTE.findUnique({
      where: { idASPIRANTE: id },
    });
    if (!aspirante) return null;

    const valido = await bcrypt.compare(pass, aspirante.password);
    if (!valido) return null;

    const token = jwt.sign(
      { id: aspirante.idASPIRANTE, nombre_completo: aspirante.nombre_completo, rol: "aspirante" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return { user: aspirante, token, rol: "aspirante", id: aspirante.idASPIRANTE };
  },

  // ────────────────────────────────────────────────────────────────
  //  LOGIN ADMIN (sin cambios)
  // ────────────────────────────────────────────────────────────────
  async loginadmin(data) {
    const { id, pass } = data;

    const admin = await prisma.aDMIN.findUnique({ where: { idADMIN: id } });
    if (!admin) return null;

    const valido = await bcrypt.compare(pass, admin.password);
    if (!valido) return null;

    const token = jwt.sign(
      { id: admin.idADMIN, rol: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return { user: admin, token, rol: "admin" };
  },
};

module.exports = authService;