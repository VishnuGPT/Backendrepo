const { protect } = require("../middleware/authMiddleware")
const express = require('express');
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const ShipmentProgressController = require('../controllers/shipmentProgressController.js')

router.post('/assign-driver', protect, ShipmentProgressController.assignDriverAndVehicle);
router.post(
    "/status-update",
    protect,
    upload.fields([
        { name: "pdf", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    ShipmentProgressController.pushStatusUpdate
);
router.post('/get-status', protect, ShipmentProgressController.getStatus);

module.exports = router;