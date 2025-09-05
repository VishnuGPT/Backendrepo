const {protect}  = require("../middleware/authMiddleware")
const offerController = require('../controllers/offerController.js')
const express = require('express');
const router = express.Router();

// Offer Routes

// Admin Route to quote price/offer a shipment
router.post('/shipment', protect, offerController.offerShipment);

//Admin route to update offer
router.put('/update-offer', protect, offerController.updateOffer);

router.get('/all', protect, offerController.getAllOffersForAdmin);

//shipper route to respond to offer given by admin
router.post('/respond', protect, offerController.respondToOffer);

//shipper route to get all offers
router.get('/shipper', protect, offerController.getOffersForShipper);
module.exports = router;
