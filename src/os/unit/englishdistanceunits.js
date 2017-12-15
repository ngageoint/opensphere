goog.provide('os.unit.EnglishDistanceUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.EnglishDistanceUnits = function() {
  os.unit.EnglishDistanceUnits.base(this, 'constructor');
};
goog.inherits(os.unit.EnglishDistanceUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.EnglishDistanceUnits.prototype.getTitle = function() {
  return 'Imperial';
};


/**
 * @inheritDoc
 */
os.unit.EnglishDistanceUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.EnglishDistanceUnits.prototype.getSystem = function() {
  return 'imperial';
};


/**
 * @inheritDoc
 */
os.unit.EnglishDistanceUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('mi');
};


/**
 * @inheritDoc
 */
os.unit.EnglishDistanceUnits.prototype.getConversionFactor = function() {
  return (1 / 1609.344);
};


/**
 * @inheritDoc
 */
os.unit.EnglishDistanceUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('in', (1 / 63360.0), false, 'inches'));
  this.multipliers.push(new os.unit.Multiplier('ft', (1 / 5280.0), true, 'feet'));
  this.multipliers.push(new os.unit.Multiplier('yd', (1 / 1760.0), true, 'yards'));
  this.multipliers.push(new os.unit.Multiplier('mi', 1, true, 'miles', .1));
};
