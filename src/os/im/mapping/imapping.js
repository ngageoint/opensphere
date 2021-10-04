goog.declareModuleId('os.im.mapping.IMapping');

import IPersistable from '../../ipersistable.js';// eslint-disable-line


/**
 * Represents a mapping. A mapping can map a field to a well-known field (such
 * as Latitude, Longitude, or Time) or it can do something more generic like
 * unit conversions or renaming.
 *
 * @extends {IPersistable}
 * @interface
 * @template T,S
 */
export default class IMapping {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * The source field on which to operate.
     * @type {?string|undefined}
     */
    this.field;

    /**
     * The directive definition associated with this mapping.
     * @type {string|undefined}
     */
    this.ui;

    /**
     * Warnings generated during mapping validation, or undefined if the mapping passed validation.
     * @type {Array<string>|undefined}
     */
    this.warnings;
  }

  /**
   * Auto detects if the mapping applies to a field in the provided items.
   * @param {Array<T>} items
   * @return {?IMapping<T>}
   */
  autoDetect(items) {}

  /**
   * Gets the mapping identifier.
   * @return {string|undefined}
   */
  getId() {}

  /**
   * The label or title for the mapping.
   * @return {?string}
   */
  getLabel() {}

  /**
   * Gets a score for this column type. The score helps the auto detection logic
   * prune a list that contains more than one mapping for a given <code>scoreType
   * </code>.
   * @return {number} The score
   */
  getScore() {}

  /**
   * Gets the score type for the mapping.
   * @return {!string} The score type
   */
  getScoreType() {}

  /**
   * Clones the mapping
   * @return {IMapping} The copy of the mapping
   */
  clone() {}

  /**
   * Gets an array of fields which this mapping effects.
   * @return {Array<string>} The list of fields
   */
  getFieldsChanged() {}

  /**
   * Executes the mapping on the given item
   * @param {T} item The item to modify
   * @param {S=} opt_targetItem The target item. Could be of different type or the same as item.
   */
  execute(item, opt_targetItem) {}

  /**
   * Tests if the mapping can be performed on the provided value
   * @param {string} value The field value to test
   * @return {boolean}
   */
  testField(value) {}
}
