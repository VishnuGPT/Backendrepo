const Shipper = require('./shipper');
const Shipment = require('./shipment');
const Admin = require('./admin')
const Offer = require('./offer');
const Payment = require('./payment');
const ShipmentProgress = require('./shipmentProgress')
const ShipmentModification = require('./shipmentModification');

// Shipment model associations with shipper
Shipment.belongsTo(Shipper, { foreignKey: 'shipperId', as: 'shipper' });
Shipper.hasMany(Shipment, { foreignKey: 'shipperId', as: 'shipments' });

// Offer model associations with shipment
Offer.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
Shipment.hasOne(Offer, { foreignKey: 'shipmentId', as: 'offer' });

ShipmentModification.belongsTo(Shipper, { foreignKey: 'shipperId', as: 'shipper' });
Shipper.hasMany(ShipmentModification, { foreignKey: 'shipperId', as: 'modifications' });

ShipmentModification.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
Shipment.hasMany(ShipmentModification, { foreignKey: 'shipmentId', as: 'modifications' });


const models = {
  ShipmentModification,
  Shipper,
  Shipment,
  Admin,
  Offer,
  ShipmentProgress,
  Payment
};

module.exports = models;
