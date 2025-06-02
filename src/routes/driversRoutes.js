const express = require('express');
const { getLinkedDrivers } = require('../controllers/driversController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/conductores-asociados', authenticateToken, getLinkedDrivers);

module.exports = router;
