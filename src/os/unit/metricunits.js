goog.provide('os.unit.MetricUnits');
goog.require('os.unit.BaseUnit');
goog.require('os.unit.Multiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @extends {os.unit.BaseUnit}
 * @constructor
 */
os.unit.MetricUnits = function() {
  os.unit.MetricUnits.base(this, 'constructor');
};
goog.inherits(os.unit.MetricUnits, os.unit.BaseUnit);


/**
 * @inheritDoc
 */
os.unit.MetricUnits.prototype.getTitle = function() {
  return 'Metric';
};


/**
 * @inheritDoc
 */
os.unit.MetricUnits.prototype.getUnitType = function() {
  return 'distance';
};


/**
 * @inheritDoc
 */
os.unit.MetricUnits.prototype.getSystem = function() {
  return 'metric';
};


/**
 * @inheritDoc
 */
os.unit.MetricUnits.prototype.getDefaultMultiplier = function() {
  return this.getMultiplier('m');
};


/**
 * @inheritDoc
 */
os.unit.MetricUnits.prototype.getConversionFactor = function() {
  return 1;
};


/**
 * @inheritDoc
 */
os.unit.MetricUnits.prototype.initMultipliers = function() {
  this.multipliers.push(new os.unit.Multiplier('nm', 1E-9, false, 'nanometers'));
  this.multipliers.push(new os.unit.Multiplier('um', 1E-6, false, 'micrometers'));
  this.multipliers.push(new os.unit.Multiplier('mm', 1E-3, false, 'millimeters'));
  this.multipliers.push(new os.unit.Multiplier('cm', 1E-2, true, 'centimeters'));
  this.multipliers.push(new os.unit.Multiplier('dm', 1E-1, false, 'decimeters'));
  this.multipliers.push(new os.unit.Multiplier('m', 1, true, 'meters'));
  this.multipliers.push(new os.unit.Multiplier('dam', 1E1, false, 'Decameters'));
  this.multipliers.push(new os.unit.Multiplier('hm', 1E2, false, 'Hectometers'));
  this.multipliers.push(new os.unit.Multiplier('km', 1E3, true, 'Kilometers'));
  this.multipliers.push(new os.unit.Multiplier('Mm', 1E6, false, 'Megameters'));
  this.multipliers.push(new os.unit.Multiplier('Gm', 1E9, false, 'Gigameters'));
  this.multipliers.push(new os.unit.Multiplier('Tm', 1E12, false, 'Terameters'));
};
