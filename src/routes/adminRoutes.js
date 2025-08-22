import {protectAdmin} from '../middleware/authMiddleware.js';
import adminController from '../controllers/adminController.js';


//Sign In Route
router.post('/signin', adminController.signIn);
