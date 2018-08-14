goog.provide('os.unit.NauticalUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.NauticalUnits = function() {
  os.unit.NauticalUnits.base(this, 'constructor');
};
goog.inherits(os.unit.NauticalUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.NauticalUnits.prototype.getTitle = function() {
  return 'Nautical';
};


/**
 * @inheritDoc
 */
os.unit.NauticalUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.NauticalUnits.prototype.getSystem = function() {
  return 'nautical';
};


/**
 * @inheritDoc
 */
os.unit.NauticalUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('nmi');
};


/**
 * @inheritDoc
 */
os.unit.NauticalUnits.prototype.getConversionFactor = function() {
  return (1 / 1852.0);
};


/**
 * @inheritDoc
 */
os.unit.NauticalUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('ft', (1 / 6076.0), true, 'feet'));
  this.multipliers.push(new os.unit.Multiplier('nmi', 1, true, 'nautical miles'));
};
