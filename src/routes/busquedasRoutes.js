const express = require('express');
const { guardarBusquedas, obtenerBusquedas } = require('../controllers/busquedasController.js');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/guardar-busquedas', authenticateToken, guardarBusquedas);
router.get('/obtener-busquedas', authenticateToken, obtenerBusquedas);

module.exports = router;