// routes/garantias.js
const express = require('express');
const { GarantiaController } = require('../controllers/garantia');
const router = express.Router();

router.post('/garantias', GarantiaController.crear);
router.patch('/garantias/:id', GarantiaController.actualizar);
router.get('/garantias/carro/:id_carro', GarantiaController.obtenerPorCarro);

module.exports = router;
