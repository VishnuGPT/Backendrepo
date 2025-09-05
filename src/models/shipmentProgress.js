const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Shipment = require("./shipment");

const ShipmentProgress = sequelize.define(
  "ShipmentProgress",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Link to Shipment
    shipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Shipment, 
        key: "id",
      },
      field: "shipment_id",
      onDelete: "CASCADE",
    },

    // --- Status pushes stored as JSON array ---
    statusUpdates: {
      type: DataTypes.JSON, // Array of objects
      allowNull: true,
      field: "status_updates",
      /**
       * Example structure:
       * [
       *   {
       *     title: "Advance Payment",
       *     description: "Account details",
       *     date: "2025-09-01T10:00:00Z",
       *     pdfKey: { key: "abc.pdf", bucket: "my-bucket" },
       *     imageKey: { key: "xyz.png", bucket: "my-bucket" },
       *     paid: false,
       *     approved: true
       *   }
       * ]
       */
    },

    // --- Driver & Vehicle Info ---
    driverName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "driver_name",
    },
    driverMobileNumber: {
      type: DataTypes.STRING, // use string instead of integer
      allowNull: true,
      field: "driver_mobile_number",
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "vehicle_number",
    },
    chassisNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "chassis_number",
    },
  },
  {
    tableName: "shipment_progress",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
Shipment.hasOne(ShipmentProgress, { foreignKey: "shipmentId", as: "progress" });
ShipmentProgress.belongsTo(Shipment, { foreignKey: "shipmentId", as: "shipment" });

module.exports = ShipmentProgress;
