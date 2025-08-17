import Admin from '../models/admin';
import jwt from 'jsonwebtoken';
import Shipment from '../models/shipment';
import Offer from '../models/offer';
import sendEmail from '../utils/sendEmail'; 
import { ShipmentModification } from '../models';
import Shipper from '../models/shipper';

exports.SignIn = async (req, res) => {
    const body = req.body;
    try {
        const admin = await Admin.findOne({ where: { email: body.email } });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (admin.password !== body.password) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({
            id: admin.id,
            email: admin.email,
            userType: 'admin'
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Sign in successful', token });
    } catch (error) {
        console.error('Error signing in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




exports.reviewModification = async (req, res) => {
  try {
    const { requestId } = req.body; // modification request ID
    const { action } = req.body; // "accept" or "reject"

    // Ensure only admin can access
    if (!req.user || req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admins can perform this action'
      });
    }


    // Find the modification request
    const modification = await ModificationRequest.findByPk(requestId);

    if (!modification) {
      return res.status(404).json({
        success: false,
        message: 'Modification request not found'
      });
    }

    const shipment = await Shipment.findByPk(modification.shipmentId,{
        include: [{ model: Shipper, as: 'shipper' }]
    });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }
    //check if offer exists
    const offer = await Offer.findOne({
        where: { shipmentId: shipment.id }
    });
    if (!offer) {
        shipment.status= 'REQUESTED'
        await shipment.save();
    }else{
        if(offer.status == 'ACCEPTED'){
            shipment.status= 'CONFIRMED'
            await shipment.save();
        }else if(offer.status == 'REJECTED'){
            shipment.status= 'REQUESTED'
            await shipment.save();
        }else if(offer.status == 'PENDING'){
            shipment.status= 'OFFER_SENT'
            await shipment.save();
        }
    }

    if (action === 'accept') {
      const updatedData = {};

      // Loop through changedFields and apply "new" values
      for (const field in modification.changedFields) {
        if (modification.changedFields[field].new !== undefined) {
          updatedData[field] = modification.changedFields[field].new;
        }
      }

      // Update shipment
      await shipment.update(updatedData);

      // Update modification status
      await modification.update({
        status: 'accepted',
        resolved: 'true'
      });


      sendEmail({
        to: shipment.shipper.email,
        subject: 'Shipment Modification Accepted',
        html: `Your modification request for Shipment ID: ${shipment.id} has been accepted.`
      });

      return res.status(200).json({
        success: true,
        message: 'Modification accepted and applied to shipment',
        updatedShipment: shipment,
        modification
      });

    } else if (action === 'reject') {
      await modification.update({
        status: 'rejected',
        resolved: 'true'
      });
        sendEmail({
            to: shipment.shipper.email,
            subject: 'Shipment Modification Rejected',
            html: `Your modification request for Shipment ID: ${shipment.id} has been rejected.`
        });

      return res.status(200).json({
        success: true,
        message: 'Modification rejected',
        modification
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid action. Use "accept" or "reject".'
    });

  } catch (error) {
    console.error('Admin review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing shipment modification'
    });
  }
};

