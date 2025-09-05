const ShipmentProgress = require('../models/shipmentProgress');
const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const { getSignedUrlFromS3, uploadToS3 } = require("../utils/s3");
const { redisClient } = require("../config/redis");

exports.assignDriverAndVehicle = async (req, res) => {
  const { shipmentId, driverName, vehicleNumber, chassisNumber, driverMobileNumber } = req.body;

  try {
    if (req.user.userType != 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    // Find the shipment
    const shipment = await Shipment.findByPk(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const shipmentProgress = await ShipmentProgress.findOne({ where: { shipmentId } });
    if (!shipmentProgress) {
      return res.status(404).json({ success: false, message: 'Shipment progress not found' });
    }

    shipmentProgress.driverName = driverName;
    shipmentProgress.vehicleNumber = vehicleNumber;
    shipmentProgress.chassisNumber = chassisNumber;
    shipmentProgress.driverMobileNumber = driverMobileNumber;

    shipmentProgress.statusUpdates = [
      ...shipmentProgress.statusUpdates,
      {
        title: 'Driver and Vehicle Assigned',
        description: `Driver Name: ${driverName}, Driver Phone Number: ${driverMobileNumber}, Vehicle Number: ${vehicleNumber}, Chassis Number: ${chassisNumber}`,
        date: new Date(),
      }
    ];

    await shipmentProgress.save();

    return res.status(200).json({
      success: true,
      message: 'Driver and vehicle assigned successfully',
      shipmentProgress
    });
  } catch (error) {
    console.error('Error assigning driver and vehicle:', error);
    return res.status(500).json({ success: false, message: 'Error assigning driver and vehicle', error: error.message });
  }
};

exports.pushStatusUpdate = async (req, res) => {
  try {
    const { shipmentId, title, description } = req.body;

    // Validate input
    if (!shipmentId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "ShipmentId, title, and description are required",
      });
    }

    // Find shipment progress
    const shipmentProgress = await ShipmentProgress.findOne({ where: { shipmentId } });
    if (!shipmentProgress) {
      return res.status(404).json({
        success: false,
        message: "Shipment progress not found",
      });
    }

    // Upload files to S3 (if any)
    let pdfKey = null;
    let imageKey = null;

    if (req.files) {
      if (req.files.pdf && req.files.pdf[0]) {
        pdfKey = await uploadToS3(req.files.pdf[0]); // returns string
      }
      if (req.files.image && req.files.image[0]) {
        imageKey = await uploadToS3(req.files.image[0]); // returns string
      }
    }

    // Construct new status object
    const newStatus = {
      title,
      description,
      date: new Date(),
      pdfKey,
      imageKey,
      paid: false,
    };

    // Push into statusUpdates array
    shipmentProgress.statusUpdates = [
      ...(shipmentProgress.statusUpdates || []),
      newStatus,
    ];

    await shipmentProgress.save();

    // Generate signed URLs (valid 1 hr)
    const signedPdfUrl = pdfKey ? getSignedUrlFromS3(pdfKey, 3600) : null;
    const signedImageUrl = imageKey ? getSignedUrlFromS3(imageKey, 3600) : null;

    // ✅ Prime Redis for this status
    if (pdfKey && signedPdfUrl) {
      await redisClient.setEx(`signedUrl:pdf:${pdfKey}`, 3600, signedPdfUrl);
    }
    if (imageKey && signedImageUrl) {
      await redisClient.setEx(`signedUrl:image:${imageKey}`, 3600, signedImageUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Shipment status updated successfully",
      status: {
        ...newStatus,
        pdfUrl: signedPdfUrl,
        imageUrl: signedImageUrl,
      },
    });
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating shipment status",
      error: error.message,
    });
  }
};


exports.getStatus = async (req, res) => {
  const { shipmentId } = req.body;

  try {
    const shipmentProgress = await ShipmentProgress.findOne({
      where: { shipmentId },
      include: [{ model: Shipment, as: "shipment" }],
    });

    if (!shipmentProgress) {
      return res.status(404).json({ success: false, message: "Shipment progress not found" });
    }

    if (
      req.user.userType !== "admin" &&
      req.user.shipperId !== shipmentProgress.shipment.shipperId
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const statusWithUrls = await Promise.all(
      (shipmentProgress.statusUpdates || []).map(async (status) => {
        let pdfUrl = null;
        let imageUrl = null;

        if (status.pdfKey) {
          const pdfCacheKey = `signedUrl:pdf:${status.pdfKey}`;
          pdfUrl = await redisClient.get(pdfCacheKey);
          console.log("Fetched from cache:", pdfUrl);
          if (!pdfUrl) {
            console.log("PDF URL not found in cache, generating new one...");
            pdfUrl = getSignedUrlFromS3(status.pdfKey, 3600); // 1 hr
            await redisClient.setEx(pdfCacheKey, 3600, pdfUrl);
          }
        }

        if (status.imageKey) {
          const imageCacheKey = `signedUrl:image:${status.imageKey}`;
          imageUrl = await redisClient.get(imageCacheKey);
          console.log("Fetched from cache:", imageUrl);
          if (!imageUrl) {
            console.log("Image URL not found in cache, generating new one...");
            imageUrl = getSignedUrlFromS3(status.imageKey, 3600);
            await redisClient.setEx(imageCacheKey, 3600, imageUrl);
          }
        }

        return {
          ...status,
          pdfUrl,
          imageUrl,
        };
      })
    );

    return res.status(200).json({
      success: true,
      statusUpdates: statusWithUrls,
    });
  } catch (error) {
    console.error("Error fetching shipment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching shipment status",
      error: error.message,
    });
  }
};
