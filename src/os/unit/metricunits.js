goog.module('os.unit.MetricUnits');

const BaseUnit = goog.require('os.unit.BaseUnit');
const Multiplier = goog.require('os.unit.Multiplier');


/**
 * Responsible for receiving, logging and reporting alerts
 */
class MetricUnits extends BaseUnit {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'Metric';
  }

  /**
   * @inheritDoc
   */
  getUnitType() {
    return 'distance';
  }

  /**
   * @inheritDoc
   */
  getSystem() {
    return 'metric';
  }

  /**
   * @inheritDoc
   */
  getDefaultMultiplier() {
    return this.getMultiplier('m');
  }

  /**
   * @inheritDoc
   */
  getConversionFactor() {
    return 1;
  }

  /**
   * @inheritDoc
   */
  initMultipliers() {
    this.multipliers.push(new Multiplier('nm', 1E-9, false, 'nanometers'));
    this.multipliers.push(new Multiplier('um', 1E-6, false, 'micrometers'));
    this.multipliers.push(new Multiplier('mm', 1E-3, false, 'millimeters'));
    this.multipliers.push(new Multiplier('cm', 1E-2, true, 'centimeters'));
    this.multipliers.push(new Multiplier('dm', 1E-1, false, 'decimeters'));
    this.multipliers.push(new Multiplier('m', 1, true, 'meters'));
    this.multipliers.push(new Multiplier('dam', 1E1, false, 'Decameters'));
    this.multipliers.push(new Multiplier('hm', 1E2, false, 'Hectometers'));
    this.multipliers.push(new Multiplier('km', 1E3, true, 'Kilometers'));
    this.multipliers.push(new Multiplier('Mm', 1E6, false, 'Megameters'));
    this.multipliers.push(new Multiplier('Gm', 1E9, false, 'Gigameters'));
    this.multipliers.push(new Multiplier('Tm', 1E12, false, 'Terameters'));
  }
}

exports = MetricUnits;
