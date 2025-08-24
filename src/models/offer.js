const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Offer = sequelize.define('Offer', {
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
        }
    },
    shipperId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shippers',
            key: 'id'
        }
    },
    offerPrice: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    expectedPickupDate: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expectedDeliveryDate: {
        type: DataTypes.STRING,
        allowNull: false
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
