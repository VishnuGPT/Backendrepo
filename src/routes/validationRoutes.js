const express = require('express');
const ValidationController = require('../controllers/validationController');
const router = express.Router();


//POST route for sending otp to users phone number
router.post('/send-otp', ValidationController.sendOtp);

//POST route for verifiying otp
router.post('/verify-otp', ValidationController.verifyOtp);

// POST - Check if user email is verified / token status
router.post('/send-email-otp', ValidationController.sendOtpToEmail);

// POST - Send new verification email (removes old token if exists)
router.post('/verify-email-otp', ValidationController.verifyOtpForEmail);

// GET - Verify GST number and return trade name
router.get('/verify-gstin', ValidationController.verifyGSTIN)

module.exports = router;
