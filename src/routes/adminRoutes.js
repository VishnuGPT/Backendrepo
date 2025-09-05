const adminController = require('../controllers/adminController.js');
const {protect}= require('../middleware/authMiddleware.js')

const express = require('express');
const router = express.Router();


//Sign In Route
router.post('/signin', adminController.SignIn);
router.get('/verify',protect, adminController.verifyAdmin);

module.exports = router;
