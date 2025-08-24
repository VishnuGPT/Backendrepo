const shipmentController = require('../controllers/shipmentController');
const { protectShipper, protectAdmin } = require('../middleware/authMiddleware');
const multer = require("multer");
const upload = multer(); // memory storage by default

const express = require('express');
const router = express.Router();

// POST route for creating a new shipment (Protected route)
router.post('/create', protectShipper, upload.single("ewayBill"), shipmentController.createShipment);

router.get('/get-all-for-shipper', protectShipper, shipmentController.getAllShipmentsForShipper);

//Admin routes
router.get('/get-all-for-admin', protectAdmin, shipmentController.getAllShipmentsForAdmin);

module.exports = router;
