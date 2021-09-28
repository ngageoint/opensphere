goog.declareModuleId('os.filter.IFilterFormatter');

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 * Interface for formatting filters
 *
 * @interface
 */
export default class IFilterFormatter {
  /**
   * Formats a filter
   * @param {!FilterEntry} filter
   * @return {!string}
   */
  format(filter) {}

  /**
   * Wraps a set of filters in a group
   * @param {!string} filter
   * @param {boolean} group True for AND, false for OR
   * @return {!string}
   */
  wrap(filter, group) {}

  /**
   * Wraps a set of filters/boxes in an AND
   * @param {!string} filter
   * @return {!string}
   */
  wrapAll(filter) {}
}
