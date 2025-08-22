import {protectAdmin,protectShipper} from '../middleware/authMiddleware.js';
import offerController from '../controllers/offerController.js';

// Shipment Modification Routes


//SHIPPER ROUTES
//shipper route to request shipment modification before the confirmation of shipment
router.put('/modify-shipment', protectShipper, offerController.requestModification);

//shipper route to get all modification requests
router.get('/modification-requests', protectShipper, offerController.getAllModificationsForAShipper);




//ADMIN ROUTES
//admin route to confirm shipment modification
router.put('/confirm-modification', protectAdmin, offerController.reviewModificationRequest);


//admin route to get all modification requests
router.get('/all-modification-requests', protectAdmin, offerController.getAllModificationsRequests);