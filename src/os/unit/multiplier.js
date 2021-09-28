goog.declareModuleId('os.unit.Multiplier');

const {default: IMultiplier} = goog.requireType('os.unit.IMultiplier');


/**
 * Responsible for receiving, logging and reporting alerts
 *
 * @implements {IMultiplier}
 */
export default class Multiplier {
  /**
   * Constructor.
   * @param {string} name
   * @param {number} multiplier
   * @param {boolean=} opt_isBestFitCandedate
   * @param {string=} opt_longName
   * @param {number=} opt_threshold
   */
  constructor(name, multiplier, opt_isBestFitCandedate, opt_longName, opt_threshold) {
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
  }

  /**
   * @inheritDoc
   */
  getName() {
    return this.name_;
  }

  /**
   * @inheritDoc
   */
  getMultiplier() {
    return this.multiplier_;
  }

  /**
   * @inheritDoc
   */
  getIsBestFitCandidate() {
    return this.isBestFitCandidate_;
  }

  /**
   * @inheritDoc
   */
  getLongName() {
    return this.longName_ ? this.longName_ : this.name_;
  }

  /**
   * @inheritDoc
   */
  getThreshold() {
    return this.threshold_;
  }
}
