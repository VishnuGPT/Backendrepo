const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shipperId: {//from jwt (req.user)
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shippers',
            key: 'id'
        },
        field: 'shipper_id',
    },
    pickupLocation: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'pickup_location'
    },
    dropLocation: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'drop_location'
    },
    pickupDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'pickup_date'
    },
    materialType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'material_type'
    },
    additionalNotes: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'additional_notes'
    },
    loadingAssistance: {
        type: DataTypes.ENUM('yes','no'),
        allowNull: false,
        field: 'loading_assistance'
    },
    coolingType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'cooling_type'
    },
    weightKg: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'weight_kg'
    },
    lengthFt: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'length_ft'
    },
    widthFt: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'width_ft'
    },
    heightFt: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'height_ft'
    },
    estimatedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'estimated_delivery_date'
    },
    goodsValueInr: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'goods_value_inr'
    },
    shipmentType: {
        type: DataTypes.ENUM('full_truck_load', 'part_truck_load'),
        allowNull: false,
        field: 'shipment_type'
    },
    eBayBillUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'ebay_bill_url'
    },
    status: {
        type: DataTypes.ENUM('REQUESTED', 'OFFER_SENT', 'CONFIRMED', 'REJECTED', 'MODIFICATION_REQUESTED','IN_TRANSIT','COMPLETED'),
        defaultValue: 'REQUESTED',
        allowNull: false,
        field: 'status'
    },
    cost:{
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'cost'
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
    tableName: 'shipments',
    timestamps: true

})

module.exports = Shipment;
