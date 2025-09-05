const modificationController = require('../controllers/modificationController.js')
const {protect} = require('../middleware/authMiddleware.js')
const express = require('express');
const router = express.Router();

// Shipment Modification Routes


//SHIPPER ROUTES
//shipper route to request shipment modification before the confirmation of shipment
router.put('/modify-shipment', protect, modificationController.requestModification);

//shipper route to get all modification requests 
router.get('/requests', protect, modificationController.getAllModificationsForAShipper);




//ADMIN ROUTES

// route to confirm shipment modification
router.put('/confirm', protect, modificationController.reviewModificationRequest);


// route to get all modification requests
router.get('/all-requests', protect, modificationController.getAllModificationsRequests);
module.exports = router;
