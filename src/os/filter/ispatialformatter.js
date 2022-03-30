goog.declareModuleId('os.filter.ISpatialFormatter');

/**
 * Interface for formatting spatial regions for a data source.
 *
 * @interface
 */
export default class ISpatialFormatter {
  /**
   * Formats a spatial region.
   * @param {Feature} feature
   * @return {string}
   */
  format(feature) {}

  /**
   * If the formatter supports multiple spatial regions.
   * @return {boolean}
   */
  supportsMultiple() {}

  /**
   * Wraps a string comprised of multiple formatted values.
   * @param {string} value
   * @return {string}
   */
  wrapMultiple(value) {}
}
