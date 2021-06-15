goog.module('os.unit.IMultiplier');
goog.module.declareLegacyNamespace();


/**
 * Defines information required to convert values within a certain unit.
 * E.g: English distance units have mulipliers: 'inches', 'yards', 'feet', 'miles', etc.
 *
 * @interface
 */
class IMultiplier {
  /**
   * Retrieve the name of the multiplier (e.g.:'ft')
   * @return {string}
   */
  getName() {}

  /**
   * Retrieve the long name of the multiplier (e.g.:'feet')
   * @return {string}
   */
  getLongName() {}

  /**
   * Retrieve the value used to convert from the default multiplier of this group to this multiplier
   * (e.g.: 1/5280)
   * @return {number}
   */
  getMultiplier() {}

  /**
   * Is this multiplier to be included when establishing a best fit?  There may be more multipliers than
   * anyone cares to see on the gui, so not all of them are candidates for best fit.
   * @return {boolean}
   */
  getIsBestFitCandidate() {}

  /**
   * The threshold radio that the multiplier will drop to the next lower multiplier when selecting the best fit candidate
   * @return {number}
   */
  getThreshold() {}
}

exports = IMultiplier;
