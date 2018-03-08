goog.provide('os.unit.BaseUnit');
goog.require('os.unit.IMultiplier');
goog.require('os.unit.IUnit');



/**
 * @implements {os.unit.IUnit}
 * @constructor
 */
os.unit.BaseUnit = function() {
  /**
   * @type {Array<os.unit.IMultiplier>}
   * @protected
   */
  this.multipliers = [];

  /**
   * @type {Object}
   * @protected
   */
  this.multipliersByKey = {};

  /**
   * @type {Array<os.unit.IMultiplier>}
   * @protected
   */
  this.bestFitCandidates = [];

  this.initMultipliers();
  this.initMultipliersByKey();
  this.initBestFitCandidates();
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getTitle = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getUnitType = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getSystem = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getDefaultMultiplier = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getConversionFactor = function() {
  return -1;
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getSuffix = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getMultipliers = function() {
  return this.multipliers;
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getMultiplier = function(name) {
  return this.multipliersByKey[name];
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getLabel = function(multiplier) {
  return multiplier.getName().concat(this.getSuffix());
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.format = function(value, multiplier, opt_fixed) {
  var fixed = opt_fixed ? opt_fixed : -1;
  return ((fixed >= 0) ? value.toFixed(fixed) : value.toString()) + ' ' + this.getLabel(multiplier);
};


/**
 * @inheritDoc
 */
os.unit.BaseUnit.prototype.getBestFitMultiplier = function(value) {
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
};


/**
 * @param {os.unit.IMultiplier} element
 * @param {number} index
 * @param {Array} arr
 * @return {boolean}
 */
os.unit.BaseUnit.prototype.getIsBestFitCandidate = function(element, index, arr) {
  return element.getIsBestFitCandidate();
};


/**
 *
 */
os.unit.BaseUnit.prototype.initMultipliers = function() {};


/**
 *
 */
os.unit.BaseUnit.prototype.initMultipliersByKey = function() {
  for (var i = 0; i < this.multipliers.length; i++) {
    this.multipliersByKey[this.multipliers[i].getName()] = this.multipliers[i];
    this.multipliersByKey[this.multipliers[i].getLongName()] = this.multipliers[i];
  }
};


/**
 *
 */
os.unit.BaseUnit.prototype.initBestFitCandidates = function() {
  this.bestFitCandidates = this.multipliers.filter(this.getIsBestFitCandidate);
  goog.array.sort(this.bestFitCandidates, function(multA, multB) { // sort from largest to smallest
    return multA.getMultiplier() < multB.getMultiplier() ? 1 : -1;
  });
};
