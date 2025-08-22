const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const ShipmentModification = require('../models/shipmentModification');
const {sendEmail} = require('../utils/helperUtils');
const { Offer } = require('../models');

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
      expectedPickup,
      expectedDelivery,
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
      "expectedPickup",
      "expectedDelivery",
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

    const shipperId = req.user?.shipperId;
    if (!shipperId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Shipper ID not found." });
    }

    // handle file upload
    const ebayBillUrl = req.file ? req.file.path : null;

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
      expectedPickupDate: expectedPickup,
      expectedDeliveryDate: expectedDelivery,
      materialType,
      customMaterialType, // when selected custom in materialType selected field
      weightKg: weight,
      lengthFt: length,
      widthFt: width,
      heightFt: height,
      transportMode, 
      shipmentType,
      bodyType,
      truckSize, 
      manpowerRequired: manpower, // "yes" / "no"
      noOfLabours, //when manpower is "yes"
      coolingType,
      materialValueInr: materialValue,
      additionalNotes,
      ebayBillUrl,
    });

    // async notify admins
    Admin.findAll()
      .then((admins) => {
        admins.forEach((admin) => {
          sendEmail({
            to: admin.email,
            subject: "New Shipment Request Received",
            html: `A new shipment request (#${newShipment.id}) has been created by shipper #${shipperId}. Please review it in the admin panel.`,
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
exports.getAllShipmentsForShipper = async(req,res)=>{
  try {
    const shipperId = req.user.shipperId;

    if (!shipperId) {
      return res.status(400).json({ message: 'Shipper ID is required' });
    }

    const shipments = await Shipment.findAll({
      where: { shipperId },
    });

    if (!shipments || shipments.length === 0) {
      return res.status(404).json({ message: 'No shipments found for this shipper' });
    }

    res.status(200).json({ shipments });
  } catch (error) {
    console.error('Error fetching shipments for shipper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}