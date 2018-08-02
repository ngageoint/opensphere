goog.provide('os.unit.IMultiplier');



/**
 * Defines information required to convert values within a certain unit.
 * E.g: English distance units have mulipliers: 'inches', 'yards', 'feet', 'miles', etc.
 * @interface
 */
os.unit.IMultiplier = function() {};


/**
 * Retrieve the name of the multiplier (e.g.:'ft')
 * @return {string}
 */
os.unit.IMultiplier.prototype.getName;


/**
 * Retrieve the long name of the multiplier (e.g.:'feet')
 * @return {string}
 */
os.unit.IMultiplier.prototype.getLongName;


/**
 * Retrieve the value used to convert from the default multiplier of this group to this multiplier
 * (e.g.: 1/5280)
 * @return {number}
 */
os.unit.IMultiplier.prototype.getMultiplier;


/**
 * Is this multiplier to be included when establishing a best fit?  There may be more multipliers than
 * anyone cares to see on the gui, so not all of them are candidates for best fit.
 * @return {boolean}
 */
os.unit.IMultiplier.prototype.getIsBestFitCandidate;


/**
 * The threshold radio that the multiplier will drop to the next lower multiplier when selecting the best fit candidate
 * @return {number}
 */
os.unit.IMultiplier.prototype.getThreshold;
