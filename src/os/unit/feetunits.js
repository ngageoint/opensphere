goog.declareModuleId('os.unit.FeetUnits');

import BaseUnit from './baseunit.js';
import Multiplier from './multiplier.js';


/**
 * Responsible for receiving, logging and reporting alerts
 */
export default class FeetUnits extends BaseUnit {
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
    return 'Feet Only';
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
    return 'feet';
  }

  /**
   * @inheritDoc
   */
  getDefaultMultiplier() {
    return this.getMultiplier('ft');
  }

  /**
   * @inheritDoc
   */
  getConversionFactor() {
    return (3.28084);
  }

  /**
   * @inheritDoc
   */
  initMultipliers() {
    this.multipliers.push(new Multiplier('ft', 1, true, 'feet'));
  }
}
