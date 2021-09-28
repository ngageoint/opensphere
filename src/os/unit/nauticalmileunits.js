goog.declareModuleId('os.unit.NauticalMileUnits');

import BaseUnit from './baseunit.js';
import Multiplier from './multiplier.js';


/**
 * Responsible for receiving, logging and reporting alerts
 */
export default class NauticalMileUnits extends BaseUnit {
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
