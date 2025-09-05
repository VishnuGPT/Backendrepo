const { appendFile } = require('fs');
const { Shipper } = require('../models');
const jwt = require('jsonwebtoken');

// Validation function for shipper registration
const validateShipperRegistration = async (req) => {
  console.log('Validating shipper registration input:', req.body);

  // Initialize an array to hold validation errors
  const errors = [];
  const {
    ownerName,
    ownerContactNumber,
    email,
    phoneNumber,
    password,
    companyName,
    companyAddress,
    gstNumber
  } = req.body;

  // Validate required fields
  if (!ownerName) errors.push('Owner name is required');
  if (!ownerContactNumber) errors.push('Owner contact number is required');
  if (!email) errors.push('Email is required');
  if (!phoneNumber) errors.push('Phone number is required');
  if (!password) errors.push('Password is required');
  if (!companyName) errors.push('Company name is required');
  if (!companyAddress) errors.push('Company address is required');
  if (!gstNumber) errors.push('GST number is required');


  // Validate GST number format (basic validation)
  if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
    console.log('Validation error: Invalid GST number format');
    errors.push('Invalid GST number format');
  }

  // Check if gst number already exists
  if (gstNumber) {
    const existingGstNumber = await Shipper.findOne({ where: { gstNumber } });
    if (existingGstNumber) errors.push('GST number is already registered, please login');
  }

  // Check if email or phoneNumber already exists
  if (email) {
    const existingEmail = await Shipper.findOne({ where: { email } });
    if (existingEmail) errors.push('Email is already registered');
  }

  if (phoneNumber) {
    const existingPhone = await Shipper.findOne({ where: { phoneNumber } });
    if (existingPhone) errors.push('Phone number is already registered');
  }

  console.log('Validation errors:', errors);
  return errors;
};

// Controller for shipper registration
exports.registerShipper = async (req, res) => {
  try {
    console.log('Received shipper registration request:', req.body);

    // Validate input data
    const validationErrors = await validateShipperRegistration(req);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    console.log('Input validation passed');
    // Extract required fields from request body
    const {
      ownerName,
      ownerContactNumber,
      email,
      phoneNumber,
      password,
      companyName,
      companyAddress,
      gstNumber
    } = req.body;

    // Create new shipper
    // Note: Password encryption is handled by the beforeCreate hook in the Shipper model
    const newShipper = await Shipper.create({
      ownerName,
      ownerContactNumber,
      email,
      phoneNumber,
      password,
      companyName,
      companyAddress,
      gstNumber
    });

    // Remove password from response
    const shipperData = newShipper.toJSON();
    delete shipperData.password;

    return res.status(201).json({
      success: true,
      message: 'Shipper registered successfully',
      data: shipperData
    });
  } catch (error) {
    console.error('Error during shipper registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during shipper registration',
      error: error.message
    });
  }
};

// Login existing shipper
exports.loginShipper = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    
    // Validate required fields - either email or mobileNumber must be provided
    if ((!email && !phoneNumber) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Either email or mobile number, and password are required',
      });
    }

    // Find the shipper by email or mobileNumber
    let shipper;
    if (email) {
      shipper = await Shipper.findOne({ where: { email } });
    } else {
      shipper = await Shipper.findOne({ where: { phoneNumber } });
    }

    if (!shipper || !(await shipper.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign({
      id: shipper.id,
      email: shipper.email,
      phoneNumber: shipper.phoneNumber,
      companyName: shipper.companyName,
      userType: 'shipper'
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: shipper.id,
        companyName: shipper.companyName,
        email: shipper.email,
        phoneNumber: shipper.phoneNumber
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Protected home route for shipper
exports.getHome = async (req, res) => {
  try {
    const shipper = req.shipper;  // set by protect middleware

    return res.status(200).json({
      success: true,
      message: 'Welcome to your dashboard',
      data: {
        id: shipper.id,
        companyName: shipper.companyName,
        email: shipper.email,
      },
    });
  } catch (error) {
    console.error('Error accessing home:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not retrieve home data',
      error: error.message,
    });
  }
};


exports.verifyShipper = async (req, res) => {
  const shipper =await Shipper.findByPk(req.user.shipperId, { attributes: { exclude: ['password'] } });
  console.log(shipper)
  console.log('hello')
    return res.status(200).json({
      success: true,
      shipperProfile: shipper,
      message: 'Shipper is authenticated',
    });
  
};