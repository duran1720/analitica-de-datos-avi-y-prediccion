require('dotenv').config();

const express = require("express")
const app = express()
const authRoutes = require("./routes/authRoutes")
const PreguntasRoutes = require("./routes/PreguntasRouter")
const ProgramasRoutes = require("./routes/ProgramasRouter")
const PerfilRoutes = require("./routes/PerfilRoutes")
const AspiranteRoutes = require("./routes/AspiranteRoutes")
const AdminRoutes = require("./routes/AdminRoutes")
const EstadisticasRoutes = require("./routes/EstadisticasRouter")
const CentrosRoutes = require("./routes/CentroRoutes")
const TestRoutes = require("./routes/TestRoutes")
const ReportesRoutes = require("./routes/ReportesRouter")
const FabricRoutes = require("./routes/FabricRoutes")

const cors = require("cors")
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
    allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json())

app.use('/api', authRoutes, PreguntasRoutes, ProgramasRoutes, PerfilRoutes,
  AspiranteRoutes, AdminRoutes, EstadisticasRoutes, CentrosRoutes, ReportesRoutes)

app.use('/api/test', TestRoutes)

app.use('/api', FabricRoutes)

app.use((err, req, res, next) => {
  console.error('[AVI] Error no capturado:', err.message || err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[AVI] Servidor corriendo en puerto ${PORT}`);
});
