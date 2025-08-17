const {redisClient} = require('../config/redis');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {getUserModel,sendEmail} = require('../utils/helperUtils');
const axios = require('axios');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

//OTP sender function to user mobile number
exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }
  if( !/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format. It should be a 10-digit number.' });
  }
  const API_KEY = process.env.API_KEY;


  try {
    // Check if an OTP already exists
    const existingOtp = await redisClient.get(`${phoneNumber}_phoneOtp`);
    if (existingOtp) {
      return res.status(429).json({ message: 'OTP already sent. Please wait before requesting another.' });
    }
    const otp = generateOtp();
    await redisClient.set(`${phoneNumber}_phoneOtp`, otp, { EX: 120 });
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNumber}/${otp}`;
    const response = await axios.get(url);
    if (response.status !== 200) {
      return res.status(500).json({ message: 'Failed to send OTP', error: response.statusText });
    }
    if (response.data.Status === 'Success') {
      res.json({ message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP', error: response.data.Message });
    }
  } catch (err) {
    res.status(500).json({message: 'Failed to send OTP', error: err.message});
  }
};

//OTP verifier function
exports.verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required' });
  }
  
  try {
    const cachedOtp = await redisClient.get(`${phoneNumber}_phoneOtp`);

    if (!cachedOtp) {
      return res.status(400).json({message: "OTP has expired"});
    }
    if (cachedOtp === otp) {
      return res.json({message: 'OTP verified successfully'});
    } else {
      return res.status(401).json({message: 'Invalid OTP'});
    }
  } catch (err) {
    return res.status(500).json({message: 'Error verifying OTP', error: err.message});
  }
};

//Send otp to a email and store it in redis
exports.sendOtpToEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const otp = generateOtp();
  await redisClient.set(`${email}_emailOtp`, otp, { EX: 120 });

  // Send email logic here
  await sendEmail({
    to: email,
    subject: 'Your OTP Code For LogixJunction Signup',
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  });

  return res.status(200).json({ message: 'OTP sent to email successfully' });
};

//verify otp for email
exports.verifyOtpForEmail = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const cachedOtp = await redisClient.get(`${email}_emailOtp`);

    if (!cachedOtp) {
      return res.status(400).json({message: "OTP has expired"});
    }
    if (cachedOtp === otp) {
      return res.json({message: 'OTP verified successfully'});
    } else {
      return res.status(401).json({message: 'Invalid OTP'});
    }
  } catch (err) {
    return res.status(500).json({message: 'Error verifying OTP', error: err.message});
  }
};

// // Function to check if user is verified/ not verified/ not verified but an active token exist
// exports.checkVerificationStatus = async (req, res) => {
//   const {email, gstNumber, userType} = req.body;

//   try {
//     const Model = getUserModel(userType);
//     const user = await Model.findOne({where: {gstNumber, email}});

//     if (!user) return res.status(404).json({status: 'user_not_found', message: 'wrong email or gstNumber'});
//     if (user.isEmailVerified) return res.status(200).json({status: 'verified'});

//     const tokenExists = await redisClient.get(`${userType}_${email}_${gstNumber}`);
//     if (tokenExists) return res.status(200).json({status: 'token_sent_not_verified'});

//     return res.status(200).json({status: 'not_verified_no_token'});
//   } catch (error) {
//     return res.status(500).json({error: 'Internal server error'});
//   }
// };

// // Function to send verification email (only sends new verification email when there is no active token already)
// exports.sendVerificationEmail = async (req, res) => {
//   const {email, gstNumber, userType} = req.body;

//   try {
//     const Model = getUserModel(userType);
//     const user = await Model.findOne({where: {gstNumber, email}});

//     if (!user) return res.status(404).json({message: 'User not found'});

//     // Check if user already have an active token
//     const tokenExists = await redisClient.get(`${userType}:${gstNumber}`);
//     if (tokenExists) return res.status(200).json({status: 'active_token_exists'});

//     // Generate JWT token(expires in 1 hour)
//     const token = jwt.sign({gstNumber, email, userType}, process.env.JWT_SECRET, {expiresIn: '1h'});

//     // Store in Redis
//     await redisClient.set(`${userType}_${email}_${gstNumber}`, token, {EX: 3600});

//     // Create verification link
//     const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

//     // Send email
//     await sendEmail({
//       to: user.email,
//       subject: 'Verify Your Email',
//       html: `<p>Click the link to verify your email:</p><a href="${verificationLink}">${verificationLink}</a>`,
//     });
//     return res.status(200).json({message: 'Verification email sent'});
//   } catch (error) {
//     if (error.message == "Invalid userType") return res.status(400).json({error: error.message});
//     return res.status(500).json({message: 'Internal server error'});
//   }
// };

// // Function to verify token
// exports.verifyEmailToken = async (req, res) => {
//   const {token} = req.body;

//   if (!token) return res.status(400).json({message: 'Token is required'});

//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.JWT_SECRET);
//   } catch (error) {
//     return res.status(400).json({message: 'Invalid or expired token'});
//   }

//   const {gstNumber, userType, email} = decoded;

//   try {
//     const Model = getUserModel(userType);
//     const user = await Model.findOne({where: {gstNumber, email}});

//     if (!user) return res.status(404).json({message: 'User not found'});
//     if (user.isEmailVerified) return res.status(200).json({message: 'Email already verified'});

//     const storedToken = await redisClient.get(`${userType}_${email}_${gstNumber}`);
//     if (!storedToken || storedToken !== token) {
//       return res.status(400).json({message: 'Invalid or expired token'});
//     }

//     user.isEmailVerified = true;
//     await user.save();
//     await redisClient.del(`${userType}_${email}_${gstNumber}`);

//     return res.status(200).json({message: 'Email verified successfully'});
//   } catch (error) {
//     return res.status(500).json({message: 'Internal server error', error: error.message});
//   }
// };

/**
 * @route GET /api/validate/gst
 * @desc Uses external API to get name of company if GST is valid
 */
exports.verifyGSTIN = async (req, res) => {
  const {gstin} = req.params;
  const apiKey = process.env.GST_API_KEY;

  if (!gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GSTIN format'
    });
  }

  try {
    const apiUrl = `http://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`;
    const response = await axios.get(apiUrl);

    if (response.data?.flag && response.data.data?.tradeNam) {
      return res.status(200).json({
        success: true,
        message: 'GSTIN found.',
        tradeName: response.data.data.tradeNam
      });
    } else {
      return res.status(404).json({
        success: false,
        message: response.data?.message || 'GSTIN not found or trade name missing'
      });
    }
  } catch (error) {
    console.error('GSTIN API error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching GSTIN data',
      error: error.message
    });
  }
};