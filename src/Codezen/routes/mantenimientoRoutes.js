const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');

router.get('/mantenimientos-vencidos/:userId', mantenimientoController.getMantenimientosVencidos);
router.post('/notificar-mantenimientos/:userId', mantenimientoController.notificarMantenimientos);

module.exports = router; 