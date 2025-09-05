const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const {protect} = require("../middleware/authMiddleware")
const multer = require("multer");
const upload = multer(); // memory storage

// Admin creates payment request
router.post("/create", protect, paymentController.createPayment);

// Shipper uploads PDF proof
router.put("/upload-pdf", protect, upload.single("pdf"), paymentController.uploadPaymentProof);

// Admin verifies payment
router.put("/verify", protect, paymentController.verifyPayment);

// Get payment details for a shipment (with signed PDF link)
router.get("/get", protect, paymentController.getPayment);

module.exports = router;
