const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const ShipmentModification = require('../models/shipmentModification');
const sendEmail = require('../utils/sendEmail');
const { Offer } = require('../models');

//Modification request from shipper only when shipment status is REQUESTED or OFFER_SENT
exports.requestModification = async (req, res) => {
  try {
    const { id } = req.body; // shipmentId
    const modifiedBy = req.user.shipperId;
    const { updates } = req.body;
    const { additionalNotes } = req.body;

    // Allowed fields a shipper can modify
    const allowedFields = [
      'pickupLocation',
      'dropLocation',
      'pickupDate',
      'materialType',
      'coolingType',
      'loadingAssistance',
      'weightKg',
      'lengthFt',
      'widthFt',
      'heightFt',
      'goodsValueInr',
      'shipmentType'
    ];

    // 1. Find shipment
    const shipment = await Shipment.findByPk(id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }
    if (shipment.status == 'REQUESTED' || shipment.status == 'OFFER_SENT') {
      // Allow modifications
      if (shipment.shipperId !== modifiedBy) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to modify this shipment'
        });
      }

      // 2. Compare and find changed fields (only allowed ones)
      const changedFields = {};
      for (const key of Object.keys(updates)) {
        if (!allowedFields.includes(key)) {
          return res.status(400).json({
            success: false,
            message: `Field "${key}" cannot be modified`
          });
        }

        if (shipment[key] !== undefined && shipment[key] !== updates[key]) {
          changedFields[key] = {
            old: shipment[key],
            new: updates[key]
          };
        }
      }

      if (Object.keys(changedFields).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid changes detected'
        });
      }

      //CHECK if a modification request already exists
      const existingModification = await ShipmentModification.findOne({
        where: { shipmentId: id }
      });

      if (existingModification) {
        return res.status(400).json({
          success: false,
          message: 'Modification request already exists for this shipment'
        });
      }

      // 3. Create modification request
      const modification = await ShipmentModification.create({
        shipmentId: id,
        modifiedBy,
        changedFields,
        resolved: 'false',
        status: 'pending',
        additionalNotes
      });

      shipment.status = 'MODIFICATION_REQUESTED';
      await shipment.save();

      // 4. Notify admins
      const admins = await Admin.findAll();
      admins.forEach(admin => {
        sendEmail({
          to: admin.email,
          subject: 'Shipment Modification Requested',
          html: `
          A modification request has been submitted for Shipment ID: ${id}<br>
          <strong>Changes:</strong><br>
          <pre>${JSON.stringify(changedFields, null, 2)}</pre>
        `
        });
      });


      return res.status(201).json({
        success: true,
        message: 'Modification request submitted successfully',
        data: modification
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only REQUESTED or OFFERED shipments can be modified'
      });
    }


  } catch (error) {
    console.error('Error requesting modification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


//FOR ADMIN TO REVIEW MODIFICATION REQUEST TILL THE SHIPMENT STATUS IS REQUESTED OR OFFER_SENT
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
    if(shipment.status == 'CONFIRMED'){
        return res.status(400).json({
            success: false,
            message: 'Cannot modify confirmed shipment'
        });
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
      // Update shipment status
      const offer = await Offer.findOne({
        where: { shipmentId: shipment.id }
      });
      if (!offer) {
        shipment.status = 'REQUESTED';
        await shipment.save();
      } else {
        shipment.status = 'OFFER_SENT';
        await shipment.save();
      }

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

