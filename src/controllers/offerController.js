const Shipment = require('../models/shipment');
const Offer = require('../models/offer');
const Admin = require('../models/admin');
const Shipper = require('../models/shipper'); // make sure this is imported
const { sendEmail } = require('../utils/helperUtils');
const ShipmentProgress = require('../models/shipmentProgress');

// Admin creates a new offer for a shipment
exports.offerShipment = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { shipmentId, offerPrice, expectedPickupDate, expectedDeliveryDate } = req.body;

    if (!shipmentId || !offerPrice || !expectedPickupDate || !expectedDeliveryDate ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Fetch shipment with shipper info
    const shipment = await Shipment.findByPk(shipmentId, {
      include: [{ model: Shipper, as: 'shipper' }]
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Create offer
    const offer = await Offer.create({
      shipmentId,
      shipperId: shipment.shipperId,
      offerPrice,
      expectedPickupDate,
      expectedDeliveryDate,
      status: 'PENDING'
    });

    // Update shipment status
    shipment.status = 'OFFER_SENT';
    await shipment.save();

    // Notify shipper
    if (shipment.shipper?.email) {
      sendEmail({
        to: shipment.shipper.email,
        subject: 'Shipment Offered',
        html: `Your shipment with ID: ${shipment.id} has been offered.`
      });
    }

    res.status(200).json({ message: 'Shipment offered successfully', offer });
  } catch (error) {
    console.error('Error offering shipment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin updates an existing offer
exports.updateOffer = async (req, res) => {
  try {
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { offerId, offerPrice, expectedPickupDate, expectedDeliveryDate } = req.body;

    if (!offerId || !offerPrice || !expectedPickupDate || !expectedDeliveryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const offer = await Offer.findByPk(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const shipment = await Shipment.findByPk(offer.shipmentId, {
      include: [{ model: Shipper, as: 'shipper' }]
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Update offer
    offer.status = 'PENDING';
    offer.offerPrice = offerPrice;
    offer.expectedPickupDate = expectedPickupDate;
    offer.expectedDeliveryDate = expectedDeliveryDate;
    await offer.save();

    // Reset shipment status
    shipment.status = 'OFFER_SENT';
    await shipment.save();

    // Notify shipper
    if (shipment.shipper?.email) {
      sendEmail({
        to: shipment.shipper.email,
        subject: 'Offer Updated',
        html: `Your offer for shipment ID: ${shipment.id} has been updated.`
      });
    }

    res.status(200).json({ message: 'Offer updated successfully', offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Shipper accepts or rejects an offer
exports.respondToOffer = async (req, res) => {
  try {
    const { offerId, action } = req.body;
    const shipperId = req.user.shipperId;

    if (!offerId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const offer = await Offer.findByPk(offerId, {
      include: [
        { 
          model: Shipment, 
          as: 'shipment', 
          include: [{ model: Shipper, as: 'shipper' }] 
        }
      ]
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    if(offer.status=='ACCEPTED' || offer.status=='REJECTED') {
      return res.status(400).json({ message: 'Offer already responded to' });
    }

    const shipment = offer.shipment;

    if (!shipment || shipment.shipperId !== shipperId) {
      return res.status(403).json({ message: 'Unauthorized to respond to this offer' });
    }

    if (action === 'accept') {
      offer.status = 'ACCEPTED';
      await offer.save();

      shipment.cost = offer.offerPrice;
      shipment.expectedPickupDate = offer.expectedPickupDate;
      shipment.expectedDeliveryDate = offer.expectedDeliveryDate;
      shipment.status = 'CONFIRMED';

      const shipmentProgress = await ShipmentProgress.create({
        shipmentId: shipment.id,
        statusUpdates: [
          {
            id: 'Initial',
            title: 'Offer Accepted',
            description: `You have accepted the offer of ${offer.offerPrice} for SHID${shipment.id}`,
            date: new Date(),
          }
        ]
      });
      await shipment.save();

      const admins = await Admin.findAll();
      await Promise.all(
        admins.map(admin =>
          sendEmail({
            to: admin.email,
            subject: 'Offer Accepted',
            html: `Shipment ID: ${shipment.id} has been accepted by the shipper.`
          })
        )
      );

      return res.status(200).json({ 
        message: 'Offer accepted successfully', 
        offer, 
        shipment 
      });

    } else if (action === 'reject') {
      offer.status = 'REJECTED';
      shipment.status = 'REQUESTED';
      await offer.save();
      await shipment.save();

      const admins = await Admin.findAll();
      await Promise.all(
        admins.map(admin =>
          sendEmail({
            to: admin.email,
            subject: 'Offer Rejected',
            html: `Shipment ID: ${shipment.id} has been rejected by the shipper.`
          })
        )
      );

      return res.status(200).json({ 
        message: 'Offer rejected successfully', 
        offer, 
        shipment 
      });

    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Shipper fetches all offers
exports.getOffersForShipper = async (req, res) => {
  try {
    const shipperId = req.user.shipperId;    
    const offers = await Offer.findAll({
      where: { shipperId },
      include: [{ model: Shipment, as: 'shipment' }]
    });

    return res.status(200).json({ offers });
  } catch (error) {
    console.error('Error fetching offers for shipper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllOffersForAdmin = async (req, res) => {
  try {
    const offers = await Offer.findAll({
      include: [{ model: Shipment, as: 'shipment' }]
    });

    return res.status(200).json({ offers });
  } catch (error) {
    console.error('Error fetching offers for admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

