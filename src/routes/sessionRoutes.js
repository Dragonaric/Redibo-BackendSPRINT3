const express = require('express');
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middlewares/authMiddleware');


const router = express.Router();

router.get('/info',authenticateToken, sessionController.getUserInfo);

module.exports = router;