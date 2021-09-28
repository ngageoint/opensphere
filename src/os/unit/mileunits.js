goog.declareModuleId('os.unit.MileUnits');

import BaseUnit from './baseunit.js';
import Multiplier from './multiplier.js';


/**
 * Responsible for receiving, logging and reporting alerts
 */
export default class MileUnits extends BaseUnit {
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
    return 'Miles Only';
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
    return 'mile';
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
    return (1 / 1609.344);
  }

  /**
   * @inheritDoc
   */
  initMultipliers() {
    this.multipliers.push(new Multiplier('mi', 1, true, 'miles', .1));
  }
}
