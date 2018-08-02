goog.provide('os.unit.YardUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.YardUnits = function() {
  os.unit.YardUnits.base(this, 'constructor');
};
goog.inherits(os.unit.YardUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.YardUnits.prototype.getTitle = function() {
  return 'Yards Only';
};


/**
 * @inheritDoc
 */
os.unit.YardUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.YardUnits.prototype.getSystem = function() {
  return 'yard';
};


/**
 * @inheritDoc
 */
os.unit.YardUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('yd');
};


/**
 * @inheritDoc
 */
os.unit.YardUnits.prototype.getConversionFactor = function() {
  return (1.09361);
};


/**
 * @inheritDoc
 */
os.unit.YardUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('yd', 1, true, 'yards'));
};
