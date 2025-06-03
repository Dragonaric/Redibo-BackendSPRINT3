// routes/garantias.js
const express = require('express');
const { GarantiaController } = require('../controllers/garantia');
const router = express.Router();

router.post('/', GarantiaController.crear); // primero crear o mostrar
router.patch('/:id', GarantiaController.actualizar); // luego modificar
router.get('/carro/:id_carro', GarantiaController.obtenerPorCarro);

module.exports = router;
