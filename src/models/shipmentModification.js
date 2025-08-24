const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentModification = sequelize.define('ShipmentModification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shipperId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shippers',
            key: 'id'
        },
        field: 'shipper_id'
    },
    shipmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shipments',
            key: 'id'
        },
        field: 'shipment_id'
    },
        // --- Pickup Info ---
    pickupAddressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_address_line_1",
    },
    pickupAddressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "pickup_address_line_2",
    },
    pickupState: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_state",
    },
    pickupPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_pincode",
    },

    // --- Drop Info ---
    dropAddressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "drop_address_line_1",
    },
    dropAddressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "drop_address_line_2",
    },
    dropState: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "drop_state",
    },
    dropPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "drop_pincode",
    },

    // --- Schedule ---
    expectedPickupDate: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "expected_pickup_date",
    },
    expectedDeliveryDate: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "expected_delivery_date",
    },

    // --- Cargo Details ---
    materialType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "material_type",
    },
    customMaterialType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "custom_material_type",
    },
    weightKg: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "weight_kg",
    },
    lengthFt: { type: DataTypes.FLOAT, allowNull: true, field: "length_ft" },
    widthFt: { type: DataTypes.FLOAT, allowNull: true, field: "width_ft" },
    heightFt: { type: DataTypes.FLOAT, allowNull: true, field: "height_ft" },

    materialValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "material_value",
    },

    additionalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "additional_notes",
    },

    // --- Logistics ---
    transportMode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "transport_mode",
    },
    shipmentType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "shipment_type",
    },
    bodyType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "body_type",
    },
    truckSize: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "truck_size",
    },
    coolingType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "cooling_type",
    },

    manpower: {
      type: DataTypes.ENUM("yes", "no"),
      allowNull: true,
      defaultValue: "no",
      field: "manpower",
    },
    noOfLabours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "no_of_labours",
    },

    resolved: {
        type: DataTypes.ENUM('true', 'false'),
        defaultValue: 'false',
        allowNull: false,
        field: 'resolved'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
        field: 'status'
    },
    changeReason: {
        type: DataTypes.STRING ,
        allowNull: true,
        field: 'change_reason'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    tableName: 'shipment_modifications',
    timestamps: true
});

module.exports = ShipmentModification;
