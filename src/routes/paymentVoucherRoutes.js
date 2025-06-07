const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const paymentVoucherController = require('../controllers/paymentVoucherController');

const router = express.Router();

// Rutas principales para comprobantes
router.get('/ordenes-completadas', authenticateToken, paymentVoucherController.getOrdenesCompletadas);
router.get('/transacciones-completadas', authenticateToken, paymentVoucherController.getTransaccionesCompletadas);

// Rutas para detalles específicos
router.get('/orden/:ordenId', authenticateToken, paymentVoucherController.getDetallesOrdenPago);
router.get('/transaccion/:transaccionId', authenticateToken, paymentVoucherController.getDetallesTransaccion);

module.exports = router;