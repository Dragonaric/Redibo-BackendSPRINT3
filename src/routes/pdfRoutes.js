const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const pdfController = require('../controllers/pdfController');

const router = express.Router();

// Ruta para generar PDF de orden de pago
router.get('/orden/:ordenId/pdf', authenticateToken, pdfController.generateOrderPDF);

// Ruta para generar PDF de transacción
router.get('/transaccion/:transaccionId/pdf', authenticateToken, pdfController.generateTransactionPDF);

module.exports = router;