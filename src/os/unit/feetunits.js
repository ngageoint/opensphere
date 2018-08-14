goog.provide('os.unit.FeetUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.FeetUnits = function() {
  os.unit.FeetUnits.base(this, 'constructor');
};
goog.inherits(os.unit.FeetUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.FeetUnits.prototype.getTitle = function() {
  return 'Feet Only';
};


/**
 * @inheritDoc
 */
os.unit.FeetUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.FeetUnits.prototype.getSystem = function() {
  return 'feet';
};


/**
 * @inheritDoc
 */
os.unit.FeetUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('ft');
};


/**
 * @inheritDoc
 */
os.unit.FeetUnits.prototype.getConversionFactor = function() {
  return (3.28084);
};


/**
 * @inheritDoc
 */
os.unit.FeetUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('ft', 1, true, 'feet'));
};
