const Shipment = require('../models/shipment')
const Offer = require('../models/offer')
const Admin = require('../models/admin')
const {sendEmail} = require('../utils/helperUtils')
//for admin to offer shipment
exports.offerShipment = async (req, res) => {
    try {
        if (!req.user || req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { shipperId, shipmentId, offerPrice, pickupDate, expectedDeliveryDate } = req.body;

        // Validate required fields
        if (!shipperId || !shipmentId || !offerPrice || !pickupDate || !expectedDeliveryDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the shipment
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }

        // Update the offer with the offer details
        const offer = await Offer.create({
            shipmentId,
            shipperId,
            offerPrice,
            pickupDate,
            expectedDeliveryDate
        });
        // Update the shipment status to 'OFFER_SENT'
        shipment.status = 'OFFER_SENT';
        await shipment.save();
        // Send email notification to the shipper
        sendEmail({
            to: shipment.shipper.email,
            subject: 'Shipment Offered',
            html: `Your shipment with ID: ${shipment.id} has been offered.`
        });
        res.status(200).json({ message: 'Shipment offered successfully', offer });
    } catch (error) {
        console.error('Error offering shipment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//for admin to update offer after client rejects it or its needed to update the offer
exports.updateOffer = async (req, res) => {
    try {
        if (!req.user || req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { offerId, offerPrice, pickupDate, expectedDeliveryDate } = req.body;

        // Validate required fields
        if (!offerId || !offerPrice || !pickupDate || !expectedDeliveryDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find the offer
        const offer = await Offer.findByPk(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        // Find the associated shipment
        const shipment = await Shipment.findByPk(offer.shipmentId,{
            include: [{ model: Shipper, as: 'shipper' }]
        });
        if (!shipment) {
            return res.status(404).json({ message: 'Shipment not found' });
        }
        
        // Update the offer with the new details
        offer.status = 'PENDING';
        offer.offerPrice = offerPrice;
        offer.pickupDate = pickupDate;
        offer.expectedDeliveryDate = expectedDeliveryDate;
        await offer.save();
        await shipment.save();
        // Send email notification to the shipper/client
        sendEmail({
            to: shipment.shipper.email,
            subject: 'Offer Updated',
            html: `Your offer for shipment ID: ${offer.shipmentId} has been updated.`
        });

        res.status(200).json({ message: 'Offer updated successfully', offer });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//for shipper to review offer/ accept or reject it
exports.respondToOffer = async (req, res) => {
  try {
    const { offerId, action } = req.body; // action = 'accept' | 'reject'
    const shipperId = req.user.shipperId; // from JWT

    if (!offerId || !action) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the offer
    const offer = await Offer.findByPk(offerId, { include: Shipment });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Make sure the offer belongs to this shipper
    if (offer.shipperId !== shipperId) {
      return res.status(403).json({ message: 'Unauthorized to respond to this offer' });
    }

    if (action === 'accept') {
      // 1. Update offer
      offer.status = 'ACCEPTED';
      await offer.save();

      // 2. Apply offer details to shipment
      const shipment = offer.Shipment;
      shipment.cost = offer.offerPrice;
      shipment.expectedPickupDate = offer.pickupDate;
      shipment.expectedDeliveryDate = offer.expectedDeliveryDate;
      shipment.status = 'CONFIRMED';
      await shipment.save();

      // 3. Send email to admin(s) notifying acceptance
      const admins = await Admin.findAll();
      admins.forEach(admin => {
        sendEmail({
          to: admin.email,
          subject: 'Offer Accepted',
          html: `Shipment ID: ${shipment.id} has been accepted by the shipper.`
        });
      });

      return res.status(200).json({ message: 'Offer accepted successfully', offer, shipment });

    } else if (action === 'reject') {
      // 1. Update offer
      offer.status = 'REJECTED';
      await offer.save();

      sendEmail({
        to: shipment.shipper.email,
        subject: 'Offer Rejected',
        html: `Your offer for shipment ID: ${shipment.id} has been rejected.`
      });

      return res.status(200).json({ message: 'Offer rejected successfully', offer, shipment });

    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//get for shipper to fetch all offers
exports.getOffersForShipper = async (req, res) => {
  try {
    const shipperId = req.user.shipperId; // from JWT

    if (!shipperId) {
      return res.status(400).json({ message: 'Shipper ID is required' });
    }

    const offers = await Offer.findAll({
      where: { shipperId },
      include: [{ model: Shipment, as: 'shipment' }],
    });

    if (!offers || offers.length === 0) {
      return res.status(404).json({ message: 'No offers found for this shipper' });
    }

    res.status(200).json({ offers });
  } catch (error) {
    console.error('Error fetching offers for shipper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};