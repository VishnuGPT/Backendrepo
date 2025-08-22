import { protectAdmin, protectShipper } from "../middleware/authMiddleware";
import offerController from '../controllers/offerController.js';

// Offer Routes

// Admin Route to quote price/offer a shipment
router.post('/offer-shipment', protectAdmin, offerController.offerShipment);

//Admin route to update offer
router.put('/update-offer', protectAdmin, offerController.updateOffer);

//shipper route to respond to offer given by admin
router.post('/offer/respond', protectShipper, offerController.respondToOffer);

//shipper route to get all offers
router.get('/shipper', protectShipper, offerController.getOffersForShipper);
