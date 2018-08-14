goog.provide('os.unit.NauticalMileUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.NauticalMileUnits = function() {
  os.unit.NauticalMileUnits.base(this, 'constructor');
};
goog.inherits(os.unit.NauticalMileUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.NauticalMileUnits.prototype.getTitle = function() {
  return 'Nautical Miles Only';
};


/**
 * @inheritDoc
 */
os.unit.NauticalMileUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.NauticalMileUnits.prototype.getSystem = function() {
  return 'nauticalmile';
};


/**
 * @inheritDoc
 */
os.unit.NauticalMileUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('nmi');
};


/**
 * @inheritDoc
 */
os.unit.NauticalMileUnits.prototype.getConversionFactor = function() {
  return (1 / 1852.0);
};


/**
 * @inheritDoc
 */
os.unit.NauticalMileUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('nmi', 1, true, 'nautical miles'));
};
