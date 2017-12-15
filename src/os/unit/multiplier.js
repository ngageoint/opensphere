goog.provide('os.unit.Multiplier');
goog.require('os.unit.IMultiplier');



/**
 * Responsible for receiving, logging and reporting alerts
 * @implements {os.unit.IMultiplier}
 * @param {string} name
 * @param {number} multiplier
 * @param {boolean=} opt_isBestFitCandedate
 * @param {string=} opt_longName
 * @param {number=} opt_threshold
 * @constructor
 */
os.unit.Multiplier = function(name, multiplier, opt_isBestFitCandedate, opt_longName, opt_threshold) {
  /**
   * @type {string}
   * @private
   */
  this.name_ = name;

  /**
   * @type {number}
   * @private
   */
  this.multiplier_ = multiplier;

  /**
   * @type {boolean}
   * @private
   */
  this.isBestFitCandidate_ = opt_isBestFitCandedate ? opt_isBestFitCandedate : false;

  /**
   * @type {string?}
   * @private
   */
  this.longName_ = opt_longName ? opt_longName : null;

  /**
   * @type {number}
   * @private
   */
  this.threshold_ = opt_threshold ? opt_threshold : 1;
};


/**
 * @inheritDoc
 */
os.unit.Multiplier.prototype.getName = function() {
  return this.name_;
};


/**
 * @inheritDoc
 */
os.unit.Multiplier.prototype.getMultiplier = function() {
  return this.multiplier_;
};


/**
 * @inheritDoc
 */
os.unit.Multiplier.prototype.getIsBestFitCandidate = function() {
  return this.isBestFitCandidate_;
};


/**
 * @inheritDoc
 */
os.unit.Multiplier.prototype.getLongName = function() {
  return this.longName_ ? this.longName_ : this.name_;
};


/**
 * @inheritDoc
 */
os.unit.Multiplier.prototype.getThreshold = function() {
  return this.threshold_;
};
