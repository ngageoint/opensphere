goog.module('os.filter.IFilterable');

const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');


/**
 * @interface
 */
class IFilterable {
  /**
   * @return {?string} The title of the filterable.
   */
  getTitle() {}

  /**
   * @return {boolean} Whether or not this class is filterable
   */
  isFilterable() {}

  /**
   * @return {?string} The filter key to uniquely identify this filterable
   */
  getFilterKey() {}

  /**
   * Launches the filter manager for this class
   */
  launchFilterManager() {}

  /**
   * Get filter columns
   * @return {?Array<FeatureTypeColumn>} the columns
   */
  getFilterColumns() {}

  /**
   * Get filterable types
   * @return {!Array<!string>} the list of filterable types
   */
  getFilterableTypes() {}
}

/**
 * @type {string}
 * @const
 */
IFilterable.ID = 'os.filter.IFilterable';

exports = IFilterable;
