const express = require('express');
const { guardarBusquedas } = require('../controllers/busquedasController.js');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/guardar-busquedas', authenticateToken, guardarBusquedas);

module.exports = router;