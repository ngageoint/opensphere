goog.module('os.unit.USDistanceUnits');
goog.module.declareLegacyNamespace();

const BaseUnit = goog.require('os.unit.BaseUnit');
const Multiplier = goog.require('os.unit.Multiplier');


/**
 * Responsible for receiving, logging and reporting alerts
 */
class USDistanceUnits extends BaseUnit {
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
    return 'US';
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
    return 'us';
  }

  /**
   * @inheritDoc
   */
  getDefaultMultiplier() {
    return this.getMultiplier('mi');
  }

  /**
   * @inheritDoc
   */
  getConversionFactor() {
    return (1 / 1609.3472);
  }

  /**
   * @inheritDoc
   */
  initMultipliers() {
    this.multipliers.push(new Multiplier('in', (1 / 63360.0), false, 'inches'));
    this.multipliers.push(new Multiplier('yd', (1 / 1760.0), true, 'yards'));
    this.multipliers.push(new Multiplier('ft', (1 / 5280.0), true, 'feet'));
    this.multipliers.push(new Multiplier('mi', 1, true, 'miles', .1));
  }
}

exports = USDistanceUnits;
