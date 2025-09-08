const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const ShipmentModification = require('../models/shipmentModification');
const { sendEmail } = require('../utils/helperUtils');
const { Offer } = require('../models');
const Shipper = require('../models/shipper')




// Helper function to format shipment details as HTML
const formatShipmentDetails = (shipment) => {
  return `
    <h3>Shipment Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Shipment ID:</strong> ${shipment.id}</li>
      <li><strong>Shipper ID:</strong> ${shipment.shipperId}</li>
      <li><strong>Pickup Address:</strong> ${shipment.pickupAddressLine1}, ${shipment.pickupAddressLine2 || ''}, ${shipment.pickupState} - ${shipment.pickupPincode}</li>
      <li><strong>Drop Address:</strong> ${shipment.dropAddressLine1}, ${shipment.dropAddressLine2 || ''}, ${shipment.dropState} - ${shipment.dropPincode}</li>
      <li><strong>Expected Pickup Date:</strong> ${shipment.expectedPickupDate}</li>
      <li><strong>Expected Delivery Date:</strong> ${shipment.expectedDeliveryDate}</li>
      <li><strong>Material Type:</strong> ${shipment.materialType === 'Others' ? shipment.customMaterialType : shipment.materialType}</li>
      <li><strong>Weight:</strong> ${shipment.weightKg} kg</li>
      <li><strong>Dimensions:</strong> ${shipment.lengthFt || '-'} ft × ${shipment.widthFt || '-'} ft × ${shipment.heightFt || '-'} ft</li>
      <li><strong>Transport Mode:</strong> ${shipment.transportMode || '-'}</li>
      <li><strong>Shipment Type:</strong> ${shipment.shipmentType || '-'}</li>
      <li><strong>Body Type:</strong> ${shipment.bodyType || '-'}</li>
      <li><strong>Truck Size:</strong> ${shipment.truckSize || '-'}</li>
      <li><strong>Manpower Required:</strong> ${shipment.manpower || 'No'}</li>
      <li><strong>Number of Labourers:</strong> ${shipment.noOfLabours || '-'}</li>
      <li><strong>Cooling Type:</strong> ${shipment.coolingType || '-'}</li>
      <li><strong>Material Value:</strong> ₹${shipment.materialValue.toLocaleString('en-IN')}</li>
      <li><strong>Additional Notes:</strong> ${shipment.additionalNotes || '-'}</li>
    </ul>
  `;
};

// Dummy uploader (simulates multer + AWS S3 upload)
const dummyUploadToS3 = async (file) => {
  if (!file) return null;

  // Pretend we uploaded it to S3 and return a fake URL
  const fakeUrl = `https://dummy-s3-bucket.s3.amazonaws.com/eway-bills/${Date.now()}_${file.originalname || "ewaybill.pdf"}`;
  return fakeUrl;
};

// Create a new shipment
exports.createShipment = async (req, res) => {
  try {
    const {
      pickupAddressLine1,
      pickupAddressLine2,
      pickupState,
      pickupPincode,
      dropAddressLine1,
      dropAddressLine2,
      dropState,
      dropPincode,
      materialType,
      customMaterialType,
      weight,
      length,
      width,
      height,
      expectedPickupDate,
      expectedDeliveryDate,
      transportMode,
      shipmentType,
      bodyType,
      truckSize,
      manpower,
      noOfLabours,
      coolingType,
      materialValue,
      additionalNotes,
    } = req.body;

    // required field validation
    const requiredFields = [
      "pickupAddressLine1",
      "pickupState",
      "pickupPincode",
      "dropAddressLine1",
      "dropState",
      "dropPincode",
      "materialType",
      "weight",
      "expectedPickupDate",
      "expectedDeliveryDate",
      "shipmentType",
      "bodyType",
      "materialValue",
    ];

    const missingField = requiredFields.find((field) => !req.body[field]);
    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${missingField}`,
      });
    }

    // Conditional checks
    if (materialType === "custom" && !customMaterialType) {
      return res.status(400).json({
        success: false,
        message: "customMaterialType is required when materialType is custom",
      });
    }

    if (manpower === "yes" && !noOfLabours) {
      return res.status(400).json({
        success: false,
        message: "noOfLabours is required when manpower is yes",
      });
    }

    // Check shipper
    const shipperId = req.user?.shipperId;
    if (!shipperId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Shipper ID not found." });
    }

    // Dummy file upload (ewayBill PDF)
    let ewayBillUrl = null;
    if (req.file) {
      ewayBillUrl = await dummyUploadToS3(req.file);
    }
    const date1 = new Date(expectedPickupDate); //2025-08-23T00:00:00.000Z
    const formattedExpectedPickupDate = date1.toISOString().split("T")[0]; // 2025-08-23

    const date2 = new Date(expectedDeliveryDate);
    const formattedExpectedDeliveryDate = date2.toISOString().split("T")[0];


    // Create new shipment
    const newShipment = await Shipment.create({
      shipperId,
      pickupAddressLine1,
      pickupAddressLine2,
      pickupState,
      pickupPincode,
      dropAddressLine1,
      dropAddressLine2,
      dropState,
      dropPincode,
      expectedPickupDate: formattedExpectedPickupDate,
      expectedDeliveryDate: formattedExpectedDeliveryDate,
      materialType,
      customMaterialType: materialType === "Others" ? customMaterialType : null,
      weightKg: weight,
      lengthFt: length,
      widthFt: width,
      heightFt: height,
      transportMode,
      shipmentType,
      bodyType,
      truckSize,
      manpower,
      noOfLabours: manpower === "yes" ? noOfLabours : null,
      coolingType: bodyType == "Closed" ? coolingType : null,
      materialValue,
      additionalNotes,
      ewayBill: ewayBillUrl, // dummy URL if provided
    });
    // Notify admins
    // Notify admins
    Admin.findAll()
      .then((admins) => {
        const shipmentDetailsHtml = formatShipmentDetails(newShipment);
        admins.forEach((admin) => {
          sendEmail({
            to: admin.email,
            subject: "New Shipment Request Received",
            html: `
          <p>A new shipment request (#${newShipment.id}) has been created by shipper #${shipperId}. Please review it in the admin panel.</p>
          ${shipmentDetailsHtml}
        `,
          });
        });
      })
      .catch((err) =>
        console.error("Failed to send admin notifications:", err)
      );



    return res.status(201).json({
      success: true,
      message: "Shipment request created successfully!",
      data: newShipment,
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred on the server.",
    });
  }
};

// Get all shipments for a specific shipper
exports.getAllShipmentsForShipper = async (req, res) => {
  try {
    const shipperId = req.user.shipperId;

    if (!shipperId) {
      return res.status(400).json({ message: 'Shipper ID is required' });
    }

    const shipments = await Shipment.findAll({
      where: { shipperId },
    });

    if (!shipments || shipments.length === 0) {
      return res.status(200).json({ message: 'No shipments found for this shipper' });
    }

    res.status(200).json({ shipments });
  } catch (error) {
    console.error('Error fetching shipments for shipper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getAllShipmentsForAdmin = async (req, res) => {
  try {
    // Ensure only admin can access
    if (!req.user || req.user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can perform this action",
      });
    }

    const shipments = await Shipment.findAll({
      include: [{ model: Shipper, as: 'shipper', attributes: { exclude: ['createdAt', 'password', 'updatedAt'] } }]
    });

    if (!shipments || shipments.length === 0) {
      return res.status(200).json({ message: 'No shipments found' });
    }

    res.status(200).json({ shipments });
  } catch (error) {
    console.error('Error fetching shipments for admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};