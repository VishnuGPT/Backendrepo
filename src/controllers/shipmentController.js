const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const ShipmentModification = require('../models/shipmentModification');
const {sendEmail} = require('../utils/helperUtils');
const { Offer } = require('../models');


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
exports.getOfferForAShipment = async (req, res) => {
  try {
    if (!req.body.shipmentId) {
      return res.status(400).json({ message: 'Shipment ID is required' });
    }
    const shipment = await Shipment.findByPk(req.body.shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    const offer = await Offer.findOne({
      where: {
        shipmentId: req.body.shipmentId,
      },
      include: [{ model: Shipment, as: 'shipment' }]
    });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found for this shipment' });
    }
    res.status(200).json({ offer });
  } catch (error) {
    console.error('Error fetching offer for shipment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getModificationRequestedForShipment = async (req, res) => {
  try {
    if (!req.body.shipmentId) {
      return res.status(400).json({ message: 'Shipment ID is required' });
    }

    const modifications = await ShipmentModification.findAll({
      where: { shipmentId: req.body.shipmentId },
      include: [{ model: Shipper, as: 'shipper' }]
    });

    if (!modifications) {
      return res.status(404).json({ message: 'No modifications found for this shipment' });
    }

    res.status(200).json({ modifications });
  } catch (error) {
    console.error('Error fetching modification requests for shipment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getRequestedShipments = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const shipments = await Shipment.findAll({
      where: { status: 'REQUESTED' },
      include: [{ model: Shipper, as: 'shipper' }]
    });
    res.status(200).json({ shipments });
  } catch (error) {
    console.error('Error fetching requested shipments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getOfferedShipments = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const shipments = await Shipment.findAll({
      where: { status: 'OFFER_SENT' },
      include: [{ model: Shipper, as: 'shipper' }]
    });
    res.status(200).json({ shipments });
  } catch (error) {
    console.error('Error fetching offered shipments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getAllInfoForShipment = async (req, res) => {

  try {
    const { shipmentId } = req.body;

    if (!shipmentId) {
      return res.status(400).json({ message: 'Shipment ID is required' });
    }

    const shipment = await Shipment.findByPk(shipmentId, {
      include: [
        { model: Shipper, as: 'shipper' },
        { model: Offer, as: 'offer' },
        { model: ShipmentModification, as: 'modifications' }
      ]
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.status(200).json({ shipment });
  } catch (error) {
    console.error('Error fetching all info for shipment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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