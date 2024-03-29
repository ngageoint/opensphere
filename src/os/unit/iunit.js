goog.declareModuleId('os.unit.IUnit');

const {default: IMultiplier} = goog.requireType('os.unit.IMultiplier');


/**
 * Defines a unit.  Includes details how to convert to this unit, and all of its multipliers.
 *
 * @interface
 */
export default class IUnit {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Array of best fit multiplier candidates.
     * @type {Array<IMultiplier>}
     */
    this.bestFitCandidates;
  }

  /**
   * The human-readable name of this unit
   * @return {?string}
   */
  getTitle() {}

  /**
   * The type of meaurement to which this unit applies
   * @return {?string}
   */
  getUnitType() {}

  /**
   * The system within which this unit is contained
   * e.g.: 'english'
   * @return {?string}
   */
  getSystem() {}

  /**
   * The factor used to convert from the application's default unit and multiplier to this
   * unit's default multiplier
   * @return {number}
   */
  getConversionFactor() {}

  /**
   * A suffix used for formatting values in this unit
   * @return {string}
   */
  getSuffix() {}

  /**
   * A collection of <code>IMultiplier</code> objects which can be applied to values of this unit
   * e.g.: milli, kilo, Mega, Tera, etc.
   * @return {Array}
   */
  getMultipliers() {}

  /**
   * Retrieve this unit's default multiplier - the one that is used when converting among different units, to
   * which the <code>converionFactor</code> is applied
   * @return {IMultiplier}
   */
  getDefaultMultiplier() {}

  /**
   * Retrieve the multiplier with the provided name (e.g.: 'Km')
   * @param {?string} name - the name of the multiplier
   * @return {IMultiplier}
   */
  getMultiplier(name) {}

  /**
   * Format a suitable label for the given multiplier
   * @param {IMultiplier} multiplier - the multiplier to format (e.g.: 'Km')
   * @return {string}
   */
  getLabel(multiplier) {}

  /**
   * Format the value into a human-readable label (e.g.: '1234.56 feet')
   * @param {number} value - the value to format
   * @param {IMultiplier} multiplier - the multiplier to format (e.g.: 'Km')
   * @param {number} fixed - default behavior ignores this value, the number of decimal digits to use, defaults to 1
   * @return {string}
   */
  format(value, multiplier, fixed) {}
}
