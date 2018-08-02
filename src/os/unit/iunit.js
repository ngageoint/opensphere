goog.provide('os.unit.IUnit');
goog.require('os.unit.IMultiplier');



/**
 * Defines a unit.  Includes details how to convert to this unit, and all of its multipliers.
 * @interface
 */
os.unit.IUnit = function() {};


/**
 * The human-readable name of this unit
 * @return {?string}
 */
os.unit.IUnit.prototype.getTitle;


/**
 * The type of meaurement to which this unit applies
 * @return {?string}
 */
os.unit.IUnit.prototype.getUnitType;


/**
 * The system within which this unit is contained
 * e.g.: 'english'
 * @return {?string}
 */
os.unit.IUnit.prototype.getSystem;


/**
 * The factor used to convert from the application's default unit and multiplier to this
 * unit's default multiplier
 * @return {number}
 */
os.unit.IUnit.prototype.getConversionFactor;


/**
 * A suffix used for formatting values in this unit
 * @return {string}
 */
os.unit.IUnit.prototype.getSuffix;


/**
 * A collection of <code>IMultiplier</code> objects which can be applied to values of this unit
 * e.g.: milli, kilo, Mega, Tera, etc.
 * @return {Array}
 */
os.unit.IUnit.prototype.getMultipliers;


/**
 * Retrieve this unit's default multiplier - the one that is used when converting among different units, to
 * which the <code>converionFactor</code> is applied
 * @return {os.unit.IMultiplier}
 */
os.unit.IUnit.prototype.getDefaultMultiplier;


/**
 * Retrieve the multiplier with the provided name (e.g.: 'Km')
 * @param {?string} name - the name of the multiplier
 * @return {os.unit.IMultiplier}
 */
os.unit.IUnit.prototype.getMultiplier;


/**
 * Calculate the best mutliplier of this unit to use for the given value.  The <code>value</code> is expected
 * to be specified in the application's base unit's default multiplier ('meter')
 * @param {number} value - the value for which to calculate a best fit multiplier
 * @return {os.unit.IMultiplier}
 */
os.unit.IUnit.prototype.getBestFitMultiplier;


/**
 * Format a suitable label for the given multiplier
 * @param {os.unit.IMultiplier} multiplier - the multiplier to format (e.g.: 'Km')
 * @return {string}
 */
os.unit.IUnit.prototype.getLabel;


/**
 * Format the value into a human-readable label (e.g.: '1234.56 feet')
 * @param {number} value - the value to format
 * @param {os.unit.IMultiplier} multiplier - the multiplier to format (e.g.: 'Km')
 * @param {number} fixed - default behavior ignores this value, the number of decimal digits to use, defaults to 1
 * @return {string}
 */
os.unit.IUnit.prototype.format;
