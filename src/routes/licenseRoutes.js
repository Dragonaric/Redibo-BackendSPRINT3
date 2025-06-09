const express = require('express');
const licenseController = require('../controllers/licenseController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');


const router = express.Router();

router.post('/request',authenticateToken,  upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 }
]),
licenseController.crearSolicitud
);

router.get('/applications', authenticateToken, licenseController.getSolicitudes);
router.put('/approve/:id', licenseController.aprobarSolicitud);
router.put('/decline/:id', licenseController.rechazarSolicitud);
router.get('/licencia', authenticateToken, licenseController.getLicenciaConductor);

module.exports = router;