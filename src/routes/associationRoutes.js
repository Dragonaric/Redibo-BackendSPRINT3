const express = require('express');
const associationController = require('../controllers/associationController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();


router.post('/association-request-renter-to-driver', authenticateToken, associationController.associationRequestRenterToDriver);
router.post('/association-request-driver-to-renter', authenticateToken, associationController.associationRequestDriverToRenter);

router.get('/list-association-requests', authenticateToken, associationController.listAssociationRequests);
router.post('/change-association-request-state', authenticateToken, associationController.changeAssociationRequestState);

router.post('/list-drivers', authenticateToken, associationController.listUsersDrivers);
router.post('/list-renters', authenticateToken, associationController.listUsersRenters);

router.get('/list-partners', authenticateToken, associationController.listPartners);
router.get('/partners-drivers', authenticateToken, associationController.listPartnersDrivers);
router.get('/partners-renters', authenticateToken, associationController.listPartnersRenters);
module.exports = router;