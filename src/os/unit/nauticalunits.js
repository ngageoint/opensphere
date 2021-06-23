goog.module('os.unit.NauticalUnits');
goog.module.declareLegacyNamespace();

const BaseUnit = goog.require('os.unit.BaseUnit');
const Multiplier = goog.require('os.unit.Multiplier');


/**
 * Responsible for receiving, logging and reporting alerts
 */
class NauticalUnits extends BaseUnit {
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
    return 'Nautical';
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
    return 'nautical';
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
    this.multipliers.push(new Multiplier('ft', (1 / 6076.0), true, 'feet'));
    this.multipliers.push(new Multiplier('nmi', 1, true, 'nautical miles'));
  }
}

exports = NauticalUnits;
