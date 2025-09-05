const Payment = require("../models/payment");
const { uploadToS3, getSignedUrlFromS3 } = require("../utils/s3");

// 1. Admin creates a payment request
exports.createPayment = async (req, res) => {
  const { shipmentId, shipperId, paymentType, amount, toAccount } = req.body;

  try {
    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const payment = await Payment.create({
      shipmentId,
      shipperId,
      paymentType,
      amount,
      ToAccount: toAccount, // must be provided by admin
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Payment request created successfully",
      payment,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: error.message,
    });
  }
};

// 2. Shipper uploads PDF
exports.uploadPaymentProof = async (req, res) => {
  const { paymentId } = req.body;

  try {
    if (req.user.userType !== "shipper") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Upload PDF to S3
    let pdfKey = null;
    if (req.file) {
      pdfKey = await uploadToS3(req.file);
    }

    if (!pdfKey) {
      return res.status(400).json({ success: false, message: "PDF file is required" });
    }

    payment.pdfKey = pdfKey;
    payment.status = "IN_VERIFICATION";
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      payment,
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading payment proof",
      error: error.message,
    });
  }
};

// 3. Admin verifies payment
exports.verifyPayment = async (req, res) => {
  const { paymentId, approved } = req.body;

  try {
    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "IN_VERIFICATION") {
      return res.status(400).json({
        success: false,
        message: "Payment is not in verification stage",
      });
    }

    payment.status = approved ? "COMPLETED" : "FAILED";
    await payment.save();

    return res.status(200).json({
      success: true,
      message: `Payment ${approved ? "approved" : "rejected"} successfully`,
      payment,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

// 4. Get payment with signed PDF URL
exports.getPayment = async (req, res) => {
  const { shipmentId } = req.body;

  try {
    const payments = await Payment.findAll({ where: { shipmentId } });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ success: false, message: "No payments found" });
    }

    // Check access (admin OR shipper of this shipment)
    const isAdmin = req.user.userType === "ADMIN";
    const isShipper = payments.some((p) => p.shipperId === req.user.shipperId);

    if (!isAdmin && !isShipper) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Attach signed URLs if pdfKey exists
    const paymentsWithUrls = payments.map((payment) => {
      let pdfUrl = null;
      if (payment.pdfKey) {
        pdfUrl = getSignedUrlFromS3(payment.pdfKey.key, 600); // 10 min expiry
      }

      return {
        ...payment.toJSON(),
        pdfUrl,
      };
    });

    return res.status(200).json({
      success: true,
      payments: paymentsWithUrls,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};
