const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const ShipmentModification = require('../models/shipmentModification');
const {sendEmail} = require('../utils/helperUtils');
const { Offer } = require('../models');

exports.createShipment = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, pickupState, dropState, materialType, pickupDate, coolingType, urgency, additionalNotes, estimatedDeliveryDate, loadingAssistance, weightKg, lengthFt, widthFt, heightFt, valueInr, shipmentType } = req.body;

    // Validate required fields
    if (!pickupLocation || !dropLocation || !pickupState || !dropState || !materialType || !pickupDate || !coolingType || !urgency || !loadingAssistance || !weightKg || !lengthFt || !widthFt || !heightFt || !estimatedDeliveryDate || !valueInr || !shipmentType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    //Get shipperId from JWT token
    const shipperId = req.user.shipperId;
    // Create shipment
    const shipment = await Shipment.create({
      shipperId,
      pickupLocation,
      dropLocation,
      pickupDate,
      materialType,
      coolingType,
      additionalNotes,
      loadingAssistance,
      weightKg,
      lengthFt,
      widthFt,
      heightFt,
      goodsValueInr,
      shipmentType,
      eBayBillUrl: 'http://url.com',
    });
    //Send email notifications to all admins
    const admins = await Admin.findAll();
    admins.forEach(admin => {
      sendEmail({
        to: admin.email,
        subject: 'New Shipment Created',
        html: `A new shipment has been created with ID: ${shipment.id}`
      });
    });

    return res.status(201).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

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
