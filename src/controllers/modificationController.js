const Shipment = require('../models/shipment');
const Admin = require('../models/admin');
const ShipmentModification = require('../models/shipmentModification');
const sendEmail = require('../utils/helperUtils');
const { Offer } = require('../models');

//Modification request from shipper only when shipment status is REQUESTED or OFFER_SENT
exports.requestModification = async (req, res) => {
    try {
        const modifiedBy = req.user.shipperId;

        // Allowed fields a shipper can modify
        const {
            // Route
            shipmentId,
            pickupAddressLine1,
            pickupAddressLine2,
            pickupState,
            pickupPincode,
            dropAddressLine1,
            dropAddressLine2,
            dropState,
            dropPincode,

            // Timeline
            expectedPickupDate,
            expectedDeliveryDate,

            // Cargo
            materialType,
            customMaterialType,
            weightKg,
            lengthFt,
            widthFt,
            heightFt,

            // Logistics
            truckSize,
            shipmentType,
            transportMode,
            bodyType,
            manpower,
            coolingType,
            noOfLabours,

            // Other
            materialValue,
            additionalNotes,
            changeReason
        } = req.body

        // 1. Find shipment
        const shipment = await Shipment.findByPk(shipmentId);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }

        if (["REQUESTED", "OFFER_SENT"].includes(shipment.status)) {
            // Only the shipper who created can modify
            if (shipment.shipperId !== modifiedBy) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to modify this shipment",
                });
            }
            //check if any pending modification exists
            const pendingModification = await ShipmentModification.findOne({
                where: { shipmentId: shipment.id, status: "pending" },
            });
            if (pendingModification) {
                return res.status(400).json({
                    success: false,
                    message: "A pending modification request already exists",
                });
            }

            if (pendingModification) {
                return res.status(400).json({
                    success: false,
                    message: "A pending modification request already exists",
                });
            }
            ShipmentModification.create({
                    shipmentId,
                    shipperId: modifiedBy,
                    pickupAddressLine1,
                    pickupAddressLine2,
                    pickupState,
                    pickupPincode,
                    dropAddressLine1,
                    dropAddressLine2,
                    dropState,
                    dropPincode,
                    expectedPickupDate,
                    expectedDeliveryDate,
                    materialType,
                    customMaterialType,
                    weightKg,
                    lengthFt,
                    widthFt,
                    heightFt,
                    truckSize,
                    shipmentType,
                    transportMode,
                    bodyType,
                    manpower,
                    coolingType,
                    noOfLabours,
                    materialValue,
                    additionalNotes,
                    changeReason
                });

            //change shipment status to Modification Requested
            shipment.status = "MODIFICATION_REQUESTED";
            await shipment.save();

            // 5. Notify admins
            const admins = await Admin.findAll();
            admins.forEach((admin) => {
                sendEmail({
                    to: admin.email,
                    subject: "Shipment Modification Requested",
                    html: `A modification request has been submitted for Shipment ID: ${ShipmentId}<br>`,
                });
            });

            return res.status(201).json({
                success: true,
                message: "Modification request submitted successfully",
                data: modification,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Only REQUESTED or OFFER_SENT shipments can be modified",
            });
        }
    } catch (error) {
        console.error("Error requesting modification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


// FOR ADMIN TO REVIEW MODIFICATION REQUEST
exports.reviewModificationRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body; // modification request ID + action ("accept" or "reject")

        // Ensure only admin can access
        if (!req.user || req.user.userType !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden: Only admins can perform this action",
            });
        }

        // Find the modification request
        const modification = await ShipmentModification.findByPk({ id: requestId });

        if (!modification) {
            return res.status(404).json({
                success: false,
                message: "Modification request not found",
            });
        }

        // Fetch shipment + shipper info
        const shipment = await Shipment.findByPk(modification.shipmentId, {
            include: [{ model: Shipper, as: "shipper" }],
        });

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: "Shipment not found",
            });
        }

        // Disallow modifications on confirmed shipments
        if (shipment.status === "CONFIRMED") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify confirmed shipment",
            });
        }

        if (action === "accept") {

            Shipment.update({
                pickupAddressLine1: modification.pickupAddressLine1,
                pickupAddressLine2: modification.pickupAddressLine2,
                pickupState: modification.pickupState,
                pickupPincode: modification.pickupPincode,
                dropAddressLine1: modification.dropAddressLine1,
                dropAddressLine2: modification.dropAddressLine2,
                dropState: modification.dropState,
                dropPincode: modification.dropPincode,
                expectedPickupDate: modification.expectedPickupDate,
                expectedDeliveryDate: modification.expectedDeliveryDate,
                materialType: modification.materialType,
                customMaterialType: modification.customMaterialType,
                weightKg: modification.weightKg,
                lengthFt: modification.lengthFt,
                widthFt: modification.widthFt,
                heightFt: modification.heightFt,
                truckSize: modification.truckSize,
                shipmentType: modification.shipmentType,
                transportMode: modification.transportMode,
                bodyType: modification.bodyType,
                manpower: modification.manpower,
                coolingType: modification.coolingType,
                noOfLabours: modification.noOfLabours,
                materialValue: modification.materialValue,
                additionalNotes: modification.additionalNotes   
            })

            // Apply the "new" values from changedFields
            //Restore shipment status based on whether an offer exists
            const offer = await Offer.findOne({ where: { shipmentId: shipment.id } });
            shipment.status = offer ? "OFFER_SENT" : "REQUESTED";
            await shipment.save();

            // Update modification record
            await modification.update({
                status: "accepted",
                resolved: true, // boolean, not string
            });

            // Notify shipper
            sendEmail({
                to: shipment.shipper.email,
                subject: "Shipment Modification Accepted",
                html: `Your modification request for Shipment ID: ${shipment.id} has been <b>accepted</b>.<br>`,
            });

            return res.status(200).json({
                success: true,
                message: "Modification accepted and applied to shipment",
                updatedShipment: shipment,
                modification,
            });
        }

        if (action === "reject") {
            await modification.update({
                status: "rejected",
                resolved: true,
            });

            sendEmail({
                to: shipment.shipper.email,
                subject: "Shipment Modification Rejected",
                html: `Your modification request for Shipment ID: ${shipment.id} has been <b>rejected</b>.<br>`,
            });

            return res.status(200).json({
                success: true,
                message: "Modification rejected",
                modification,
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Invalid action. Use "accept" or "reject".',
        });
    } catch (error) {
        console.error("Admin review error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while reviewing shipment modification",
        });
    }
};


exports.getAllModificationsForAShipper = async (req, res) => {
    try {
        const shipperId = req.user.shipperId;
        if (!shipperId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Shipper ID not found." });
        }

        const modifications = await ShipmentModification.findAll({ where: { shipperId } });
        if(modifications.length === 0){
            return res.status(404).json({ success: false, message: "No modification requests found for this shipper." });
        }
        return res.status(200).json({
            success: true,
            modifications
        });
    } catch (error) {
        console.error("Error fetching modifications:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching shipment modifications",
        });
    }
};

//Admin route to fetch all modification requests
exports.getAllModificationsRequests = async (req, res) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: Admin access required." });
        }

        const modifications = await ShipmentModification.findAll();
        if (modifications.length === 0) {
            return res.status(404).json({ success: false, message: "No modification requests found." });
        }
        return res.status(200).json({
            success: true,
            modifications
        });
    } catch (error) {
        console.error("Error fetching modifications:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching shipment modifications",
        });
    }
};