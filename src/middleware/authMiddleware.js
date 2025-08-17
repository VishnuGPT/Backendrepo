const jwt = require('jsonwebtoken');
const { Admin, Shipper } = require('../models');


// Middleware to protect routes - verifies JWT token
const jwt = require('jsonwebtoken');
const { Shipper } = require('../models');

exports.protectShipper = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.userType !== 'shipper') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: not a shipper'
        });
      }

      const shipper = await Shipper.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!shipper) {
        return res.status(404).json({
          success: false,
          message: 'Shipper not found'
        });
      }

      req.shipper = shipper;
      req.user = {
        userType: 'shipper',
        shipperId: shipper.id,
        ownerName: shipper.ownerName
      };

      next();
    } catch (error) {
      console.error('Shipper Auth error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid'
      });
    }
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Not authorized, no token'
  });
};


exports.protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: not an admin'
        });
      }

      const admin = await Admin.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      req.admin = admin;
      req.user = {
        userType: 'admin',
        adminId: admin.id,
        adminName: admin.name
      };

      next();
    } catch (error) {
      console.error('Admin Auth error:', error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid'
      });
    }
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Not authorized, no token'
  });
};
