const shipmentController = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');
const multer = require("multer");
const upload = multer(); // memory storage by default

const express = require('express');
const router = express.Router();

// POST route for creating a new shipment (Protected route)
router.post('/create', protect, upload.single("ewayBill"), shipmentController.createShipment);

router.get('/get-all-for-shipper', protect, shipmentController.getAllShipmentsForShipper);

//Admin routes
router.get('/get-all-for-admin', protect, shipmentController.getAllShipmentsForAdmin);

module.exports = router;
