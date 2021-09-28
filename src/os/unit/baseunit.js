goog.declareModuleId('os.unit.BaseUnit');

const googArray = goog.require('goog.array');

const {default: IMultiplier} = goog.requireType('os.unit.IMultiplier');
const {default: IUnit} = goog.requireType('os.unit.IUnit');


/**
 * @implements {IUnit}
 */
export default class BaseUnit {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Array<IMultiplier>}
     * @protected
     */
    this.multipliers = [];

    /**
     * @type {Object}
     * @protected
     */
    this.multipliersByKey = {};

    /**
     * @type {Array<IMultiplier>}
     */
    this.bestFitCandidates = [];

    this.initMultipliers();
    this.initMultipliersByKey();
    this.initBestFitCandidates();
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getUnitType() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getSystem() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getDefaultMultiplier() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getConversionFactor() {
    return -1;
  }

  /**
   * @inheritDoc
   */
  getSuffix() {
    return '';
  }

  /**
   * @inheritDoc
   */
  getMultipliers() {
    return this.multipliers;
  }

  /**
   * @inheritDoc
   */
  getMultiplier(name) {
    return this.multipliersByKey[name];
  }

  /**
   * @inheritDoc
   */
  getLabel(multiplier) {
    return multiplier.getName().concat(this.getSuffix());
  }

  /**
   * @inheritDoc
   */
  format(value, multiplier, opt_fixed) {
    var fixed = opt_fixed ? opt_fixed : -1;
    return ((fixed >= 0) ? value.toFixed(fixed) : value.toString()) + ' ' + this.getLabel(multiplier);
  }

  /**
   * @param {IMultiplier} element
   * @param {number} index
   * @param {Array} arr
   * @return {boolean}
   */
  getIsBestFitCandidate(element, index, arr) {
    return element.getIsBestFitCandidate();
  }

  /**
   *
   */
  initMultipliers() {}

  /**
   *
   */
  initMultipliersByKey() {
    for (var i = 0; i < this.multipliers.length; i++) {
      this.multipliersByKey[this.multipliers[i].getName()] = this.multipliers[i];
      this.multipliersByKey[this.multipliers[i].getLongName()] = this.multipliers[i];
    }
  }

  /**
   *
   */
  initBestFitCandidates() {
    this.bestFitCandidates = this.multipliers.filter(this.getIsBestFitCandidate);
    googArray.sort(this.bestFitCandidates, function(multA, multB) { // sort from largest to smallest
      return multA.getMultiplier() < multB.getMultiplier() ? 1 : -1;
    });
  }
}
