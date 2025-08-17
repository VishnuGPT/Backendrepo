const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const Shipper = sequelize.define('Shipper', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ownerName: {
    type: DataTypes.STRING,
    field: 'owner_name',
    allowNull: false, 
  },
  ownerContactNumber: {
    type: DataTypes.STRING,
    field: 'owner_contact_number',
    allowNull: false,
    validate: {
      isTenDigitNumber(value) {
        if (value && !/^\d{10}$/.test(value)) {
          throw new Error('Contact number must be a 10 digit number');
        }
      }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    allowNull: false,
    validate: {
      isTenDigitNumber(value) {
        if (value && !/^\d{10}$/.test(value)) {
          throw new Error('Phone number must be a 10 digit number');
        }
      }
    }
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'designation'
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'company_name'
  },
  companyAddress: {
    type: DataTypes.TEXT,
    field: 'company_address',
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false, 
    field: 'email',
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password',
  },
  customerServiceNumber: {
    type: DataTypes.STRING,
    field: 'customer_service_number',
    defaultValue: null,
  },
  gstNumber: {
    type: DataTypes.STRING,
    field: 'gst_number',
    allowNull: false,
    validate: {
      // Custom GST validation
      isValidGST(value) {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
          throw new Error('Invalid GST number format');
        }
      }
    }
  },
  cinNumber: {
    type: DataTypes.STRING,
    field: 'cin_number',
    defaultValue: null,
  },
  // POC fields
  pocName: {
    type: DataTypes.STRING(255),
    defaultValue: null,
    field: 'poc_name',
  },
  pocEmail: {
    type: DataTypes.STRING,
    defaultValue: null,
    validate: { isEmail: true },
    field: 'poc_email',
  },
  pocDesignation: {
    type: DataTypes.STRING(255),
    defaultValue: null,
    field: 'poc_designation',
  },
  pocContactNumber: {
    type: DataTypes.STRING,
    defaultValue: null,
    field: 'poc_contact_number',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  }
}, {
  tableName: 'shippers',
  timestamps: true,
  hooks: {
    beforeCreate: async shipper => {
      if (shipper.password) {
        const salt = await bcrypt.genSalt(10);
        shipper.password = await bcrypt.hash(shipper.password, salt);
      }
    },
    beforeUpdate: async shipper => {
      if (shipper.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        shipper.password = await bcrypt.hash(shipper.password, salt);
      }
    },
  }
});

// Instance method to verify password
Shipper.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = Shipper;
