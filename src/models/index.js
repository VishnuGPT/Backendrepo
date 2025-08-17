const Shipper = require('./shipper');
const Shipment = require('./shipment');
const Admin = require('./admin')
const Offer = require('./offer');
const ShipmentModification = require('./shipmentModification');

// Shipment model associations with shipper
Shipment.belongsTo(Shipper, { foreignKey: 'shipperId', as: 'shipper' });
Shipper.hasMany(Shipment, { foreignKey: 'shipperId', as: 'shipments' });

// Offer model associations with shipment
Offer.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
Shipment.hasOne(Offer, { foreignKey: 'shipmentId', as: 'offer' });

//Modification model associations with shipment
Shipment.hasOne(ShipmentModification, { foreignKey: 'shipmentId', as: 'modifications' });
ShipmentModification.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

const models = {
  ShipmentModification,
  Shipper,
  Shipment,
  Admin,
  Offer,
};

module.exports = models;
