goog.provide('os.unit.MileUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.MileUnits = function() {
  os.unit.MileUnits.base(this, 'constructor');
};
goog.inherits(os.unit.MileUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.MileUnits.prototype.getTitle = function() {
  return 'Miles Only';
};


/**
 * @inheritDoc
 */
os.unit.MileUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.MileUnits.prototype.getSystem = function() {
  return 'mile';
};


/**
 * @inheritDoc
 */
os.unit.MileUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('mi');
};


/**
 * @inheritDoc
 */
os.unit.MileUnits.prototype.getConversionFactor = function() {
  return (1 / 1609.344);
};


/**
 * @inheritDoc
 */
os.unit.MileUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('mi', 1, true, 'miles', .1));
};
