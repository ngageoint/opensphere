goog.declareModuleId('os.unit.NauticalUnits');

import BaseUnit from './baseunit.js';
import Multiplier from './multiplier.js';


/**
 * Responsible for receiving, logging and reporting alerts
 */
export default class NauticalUnits extends BaseUnit {
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
