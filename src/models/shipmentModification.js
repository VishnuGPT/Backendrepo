const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentModification = sequelize.define('ShipmentModification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'modified_by' // shipperId (from JWT)
    },
    changedFields: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'changed_fields'
        /**
         Example stored JSON:
         {
           "pickupLocation": { "old": "Delhi", "new": "Mumbai" },
           "goodsValueInr": { "old": 5000, "new": 6000 }
         }
        */
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
    additionalNotes: {
        type: DataTypes.STRING ,
        allowNull: true,
        field: 'additional_notes'
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
