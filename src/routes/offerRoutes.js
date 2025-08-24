const {protectAdmin, protectShipper}  = require("../middleware/authMiddleware")
const offerController = require('../controllers/offerController.js')
const express = require('express');
const router = express.Router();

// Offer Routes

// Admin Route to quote price/offer a shipment
router.post('/shipment', protectAdmin, offerController.offerShipment);

//Admin route to update offer
router.put('/update-offer', protectAdmin, offerController.updateOffer);

router.get('/all', protectAdmin, offerController.getAllOffersForAdmin);

//shipper route to respond to offer given by admin
router.post('/respond', protectShipper, offerController.respondToOffer);

//shipper route to get all offers
router.get('/shipper', protectShipper, offerController.getOffersForShipper);
module.exports = router;
