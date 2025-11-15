const jwt = require('jsonwebtoken');
const { Admin, Shipper, Transporter } = require('../models');

// Middleware to protect routes - verifies JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user;

      if (decoded.userType === "shipper") {
        user = await Shipper.findByPk(decoded.id, {
          attributes: { exclude: ["password"] },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Shipper not found",
          });
        }

        req.shipper = user;
        req.user = {
          userType: "shipper",
          shipperId: user.id,
          ownerName: user.ownerName,
        };

      } else if (decoded.userType === "admin") {
        user = await Admin.findByPk(decoded.id, {
          attributes: { exclude: ["password"] },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Admin not found",
          });
        }

        req.admin = user;
        req.user = {
          userType: "admin",
          adminId: user.id,
          adminName: user.name,
        };

      } else if (decoded.userType === "transporter") {
        user = await Transporter.findByPk(decoded.id, {
          attributes: { exclude: ["password"] },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Transporter not found",
          });
        }

        req.transporter = user;
        req.user = {
          userType: "transporter",
          transporterId: user.id,
          transporterName: user.name,
        };

      } else {
        return res.status(403).json({
          success: false,
          message: "Access denied: invalid user type",
        });
      }

      next();

    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};
