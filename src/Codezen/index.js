const express = require('express');
const cors = require("cors")
const router = express.Router();

// Importar todas las rutas de CodeZen
const userRoutes = require("./routes/userRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const cityRoutes = require("./routes/cityRoutes");
const authRoutes = require("./routes/authRoutes");
const renterDetailsRoutes = require("./routes/renterDetailsRoutes");
const reservasRoutes = require("./routes/reservasRoutes");
const reporteRoutes = require("./routes/reporteRoutes");
const comentariosCarroRoutes = require("./routes/comentariosCarroRoutes");
const calificacionesReservaRoutes = require("./routes/calificaciones-reservaRoutes");
const comentariosRespuestasRoutes = require("./routes/comentarioRespuestas");
const carroRoutes = require("./routes/carroRoute");
const calendarRoutes = require("./routes/calendarRoutes");
const mantenimientoRoutes = require('./routes/mantenimientoRoutes');
const { notificarMantenimientosVencidos } = require('./lib/prisma');
const cron = require('node-cron');



// Configuración de middlewares específicos para CodeZen

router.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://redibo123front.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie", "Cookie", "Date", "ETag"],
  })
);

// Montar las rutas
router.use("/users", userRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/", cityRoutes);
router.use("/auth", authRoutes);
router.use("/renter-details", renterDetailsRoutes);
router.use("/reservas", reservasRoutes);
router.use("/reportes", reporteRoutes);
router.use("/comentarios-carro", comentariosCarroRoutes);
router.use("/calificaciones-reserva", calificacionesReservaRoutes);
router.use("/comentarioRespuestas",comentariosRespuestasRoutes );
router.use("/carros", carroRoutes);
router.use("/calendar", calendarRoutes);
router.use("/mantenimiento", mantenimientoRoutes);


// Ruta principal del módulo CodeZen
router.get("/", (req, res) => {
  res.send("Módulo CodeZen está funcionando");
});
// Programar la tarea para que se ejecute cada hora
cron.schedule('0 * * * *', async () => {
  console.log('Ejecutando notificación de mantenimientos vencidos...');
  try {
    await notificarMantenimientosVencidos();
    console.log('Notificaciones de mantenimientos vencidos enviadas.');
  } catch (error) {
    console.error('Error al enviar notificaciones de mantenimientos vencidos:', error);
  }
});
// Manejo de errores específico para CodeZen
router.use((err, req, res, next) => {
  console.error('Error en CodeZen:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno en CodeZen',
  });
});

module.exports = router;