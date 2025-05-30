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
const carroRoutes = require("./routes/carroRoute");

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
router.use("/usuarios", usuariosRoutes);
router.use("/", cityRoutes);
router.use("/auth", authRoutes);
router.use("/renter-details", renterDetailsRoutes);
router.use("/reservas", reservasRoutes);
router.use("/reportes", reporteRoutes);
router.use("/comentarios-carro", comentariosCarroRoutes);
router.use("/calificaciones-reserva", calificacionesReservaRoutes);
router.use("/carros", carroRoutes);

// Ruta principal del módulo CodeZen
router.get("/", (req, res) => {
  res.send("Módulo CodeZen está funcionando");
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