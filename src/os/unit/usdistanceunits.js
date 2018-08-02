goog.provide('os.unit.USDistanceUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.USDistanceUnits = function() {
  os.unit.USDistanceUnits.base(this, 'constructor');
};
goog.inherits(os.unit.USDistanceUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.USDistanceUnits.prototype.getTitle = function() {
  return 'US';
};


/**
 * @inheritDoc
 */
os.unit.USDistanceUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.USDistanceUnits.prototype.getSystem = function() {
  return 'us';
};


/**
 * @inheritDoc
 */
os.unit.USDistanceUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('mi');
};


/**
 * @inheritDoc
 */
os.unit.USDistanceUnits.prototype.getConversionFactor = function() {
  return (1 / 1609.3472);
};


/**
 * @inheritDoc
 */
os.unit.USDistanceUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('in', (1 / 63360.0), false, 'inches'));
  this.multipliers.push(new os.unit.Multiplier('yd', (1 / 1760.0), true, 'yards'));
  this.multipliers.push(new os.unit.Multiplier('ft', (1 / 5280.0), true, 'feet'));
  this.multipliers.push(new os.unit.Multiplier('mi', 1, true, 'miles', .1));
};
