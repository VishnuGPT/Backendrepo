const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Offer = sequelize.define('Offer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shipperId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: 'shippers',
            key: 'id'
        }
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
    offerPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: "offer_price"
    },
    expectedPickupDate: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "expected_pickup_date"
    },
    expectedDeliveryDate: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "expected_delivery_date"
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
        defaultValue: 'PENDING'
    }
},{
    uniqueKey: 'shipmentId',
    tableName: 'offers',
    timestamps: true
});

module.exports = Offer;
