goog.declareModuleId('os.unit.EnglishDistanceUnits');

import BaseUnit from './baseunit.js';
import Multiplier from './multiplier.js';


/**
 * Responsible for receiving, logging and reporting alerts
 */
export default class EnglishDistanceUnits extends BaseUnit {
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
    return 'Imperial';
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
    return 'imperial';
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
    this.multipliers.push(new Multiplier('in', (1 / 63360.0), false, 'inches'));
    this.multipliers.push(new Multiplier('ft', (1 / 5280.0), true, 'feet'));
    this.multipliers.push(new Multiplier('yd', (1 / 1760.0), true, 'yards'));
    this.multipliers.push(new Multiplier('mi', 1, true, 'miles', .1));
  }
}
