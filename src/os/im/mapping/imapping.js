goog.provide('os.im.mapping.IMapping');
goog.require('os.IPersistable');



/**
 * Represents a mapping. A mapping can map a field to a well-known field (such
 * as Latitude, Longitude, or Time) or it can do something more generic like
 * unit conversions or renaming.
 * @extends {os.IPersistable}
 * @interface
 * @template T,S
 */
os.im.mapping.IMapping = function() {};


/**
 * The source field on which to operate.
 * @type {string|undefined}
 */
os.im.mapping.IMapping.prototype.field;


/**
 * The directive definition associated with this mapping.
 * @type {string|undefined}
 */
os.im.mapping.IMapping.prototype.ui;


/**
 * Warnings generated during mapping validation, or undefined if the mapping passed validation.
 * @type {Array.<string>|undefined}
 */
os.im.mapping.IMapping.prototype.warnings;


/**
 * Auto detects if the mapping applies to a field in the provided items.
 * @param {Array.<T>} items
 * @return {?os.im.mapping.IMapping.<T>}
 */
os.im.mapping.IMapping.prototype.autoDetect;


/**
 * Gets the mapping identifier.
 * @return {string|undefined}
 */
os.im.mapping.IMapping.prototype.getId;


/**
 * The label or title for the mapping.
 * @return {?string}
 */
os.im.mapping.IMapping.prototype.getLabel;


/**
 * Gets a score for this column type. The score helps the auto detection logic
 * prune a list that contains more than one mapping for a given <code>scoreType
 * </code>.
 * @return {number} The score
 */
os.im.mapping.IMapping.prototype.getScore;


/**
 * Gets the score type for the mapping.
 * @return {!string} The score type
 */
os.im.mapping.IMapping.prototype.getScoreType;


/**
 * Clones the mapping
 * @return {os.im.mapping.IMapping} The copy of the mapping
 */
os.im.mapping.IMapping.prototype.clone;


/**
 * Gets an array of fields which this mapping effects.
 * @return {Array.<string>} The list of fields
 */
os.im.mapping.IMapping.prototype.getFieldsChanged;


/**
 * Executes the mapping on the given item
 * @param {T} item The item to modify
 * @param {S=} opt_targetItem The target item. Could be of different type or the same as item.
 */
os.im.mapping.IMapping.prototype.execute;


/**
 * Tests if the mapping can be performed on the provided value
 * @param {string} value The field value to test
 * @return {boolean}
 */
os.im.mapping.IMapping.prototype.testField;
