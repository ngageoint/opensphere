goog.module('os.unit.BaseUnit');
goog.module.declareLegacyNamespace();

const IMultiplier = goog.requireType('os.unit.IMultiplier');
const IUnit = goog.requireType('os.unit.IUnit');


/**
 * @implements {IUnit}
 */
class BaseUnit {
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
     * @protected
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
   * @inheritDoc
   */
  getBestFitMultiplier(value) {
    var um = os.unit.UnitManager.getInstance();
    var bestMult;
    var baseMult = um.getBaseUnits(this.getUnitType());
    if (value == 0.0) {
      return baseMult.getDefaultMultiplier();
    }
    var size = this.bestFitCandidates.length;
    if (baseMult) {
      var baseMultKey = baseMult.getDefaultMultiplier().getName();
      for (var i = 0; i < size; i++) {
        var testValue = Math.abs(um.convert(this.getUnitType(), value, baseMultKey, um.getBaseSystem(),
            this.bestFitCandidates[i].getName(), this.getSystem()));
        if (testValue >= this.bestFitCandidates[i].getThreshold()) {
          bestMult = this.bestFitCandidates[i];
          break;
        }
      }
    }
    return (bestMult != null) ? bestMult : size > 0 ? this.bestFitCandidates[size - 1] : null; // fallback to smallest
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
    goog.array.sort(this.bestFitCandidates, function(multA, multB) { // sort from largest to smallest
      return multA.getMultiplier() < multB.getMultiplier() ? 1 : -1;
    });
  }
}

exports = BaseUnit;
