const modificationController = require('../controllers/modificationController.js')
const {protectAdmin,protectShipper} = require('../middleware/authMiddleware.js')
const express = require('express');
const router = express.Router();

// Shipment Modification Routes


//SHIPPER ROUTES
//shipper route to request shipment modification before the confirmation of shipment
router.put('/modify-shipment', protectShipper, modificationController.requestModification);

//shipper route to get all modification requests
router.get('/modification-requests', protectShipper, modificationController.getAllModificationsForAShipper);




//ADMIN ROUTES
//admin route to confirm shipment modification
router.put('/confirm-modification', protectAdmin, modificationController.reviewModificationRequest);


//admin route to get all modification requests
router.get('/all-modification-requests', protectAdmin, modificationController.getAllModificationsRequests);
module.exports = router;
