goog.module('os.unit.NauticalMileUnits');
goog.module.declareLegacyNamespace();

const BaseUnit = goog.require('os.unit.BaseUnit');
const Multiplier = goog.require('os.unit.Multiplier');


/**
 * Responsible for receiving, logging and reporting alerts
 */
class NauticalMileUnits extends BaseUnit {
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
    return 'Nautical Miles Only';
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
    return 'nauticalmile';
  }

  /**
   * @inheritDoc
   */
  getDefaultMultiplier() {
    return this.getMultiplier('nmi');
  }

  /**
   * @inheritDoc
   */
  getConversionFactor() {
    return (1 / 1852.0);
  }

  /**
   * @inheritDoc
   */
  initMultipliers() {
    this.multipliers.push(new Multiplier('nmi', 1, true, 'nautical miles'));
  }
}

exports = NauticalMileUnits;
