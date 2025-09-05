const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Shipper = require("../models/shipper");
const Shipment = require("../models/shipment");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Shipment, 
        key: "id",
      },
      field: "shipment_id",
    },
    shipperId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Shipper, 
        key: "id",
      },
      field: "shipper_id",
    },
    paymentType: {
      type: DataTypes.ENUM("ADVANCE", "FINAL"),
      allowNull: false,
      field: "payment_type",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "amount",
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "COMPLETED",
        "FAILED",
        "IN_VERIFICATION"
      ),
      defaultValue: "PENDING",
      field: "status",
    },
    pdfKey: {
      type: DataTypes.JSON, 
      allowNull: true,
      field: "pdf_key",
    },
    ToAccount: {
      type: DataTypes.JSON,
      allowNull: false,
      field: "to_account",
    }
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Payment.belongsTo(Shipment, { foreignKey: "shipmentId" });
Shipment.hasMany(Payment, { foreignKey: "shipmentId" });

Payment.belongsTo(Shipper, { foreignKey: "shipperId" });
Shipper.hasMany(Payment, { foreignKey: "shipperId" });

module.exports = Payment;


