const express = require('express');
const par1Routes = require('./Par_1/controlador/rutas'); // Rutas de Par_1
const par2Routes = require('./Par_2/routes/segurosRoutes'); // Rutas de Par_2
const par3Routes = require('./Par_3/routes/index'); // Rutas de Par_3
const filterU5Module = require('./filterU5/filterU5.module');
const router = express.Router();

// Montar las rutas de cada módulo
router.use('/v1', par1Routes);
router.use('/v3', par2Routes); // Esto hará que las rutas de seguros sean /api/v3/seguros
router.use('/v2', par3Routes); // Esto hará que las rutas de seguros sean /api/v2/seguros                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       );
// Middleware global para manejar errores específicos de sprinteros
router.use('/filterU5', filterU5Module.controller);
router.use((err, req, res, next) => {
  console.error('Error en sprinteros:', err.stack);                                                                                                                        
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno en sprinteros',
  });
});

module.exports = router;