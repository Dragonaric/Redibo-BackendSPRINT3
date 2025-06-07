const express = require('express');
const paymentOrderController = require('../controllers/paymentOrderController');
const { authenticateToken } = require('../middlewares/authMiddleware');


const router = express.Router();

// Ruta para obtener todas las ciudades
router.post('/paymentOrder', paymentOrderController.createPaymentOrder);
// Ruta para pagar una orden de pago registrar el numero de transaccion
router.post('/paymentOrder/RegisterTransactionNumber', paymentOrderController.RegisterTransactionNumber);
// Ruta para pagar una orden de pago con saldo
router.post('/paymentOrder/PayWithBalance', authenticateToken, paymentOrderController.PayWithBalance);
// Ruta para obtener todas mis ordenes de pago si soy renter
router.get('/list-paymentOrder',authenticateToken, paymentOrderController.getListPaymentOrders);
// detalles de una orden de pago apartir del id de la orden
router.post('/paymentOrderbyCode', paymentOrderController.getInfoPaymentOrderbyCode);
// Ruta para obtener todas las ordenes de pago "PROCESANDO" si soy admin
router.get('/processing-orders', authenticateToken, paymentOrderController.getListProcessingOrders);
// Ruta para obtener detalles de una orden en estado de "PROCESANDO"
router.post('/processing-order-details', authenticateToken , paymentOrderController.getProcessingOrderDetails)
// Ruta para actualizar el estado de una orden de pago SI SOY ADMIN
router.post('/admin/updatePaymentOrder', authenticateToken , paymentOrderController.UpdateStatePaymentOrder);
// Ruta para crear una nueva solicitud de recarga
router.post('/crear-recarga', authenticateToken, paymentOrderController.crearRecarga);




module.exports = router;