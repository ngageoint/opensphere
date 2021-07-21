goog.module('os.filter.ISpatialFormatter');
goog.module.declareLegacyNamespace();

const Feature = goog.requireType('ol.Feature');


/**
 * Interface for formatting spatial regions for a data source.
 *
 * @interface
 */
class ISpatialFormatter {
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

exports = ISpatialFormatter;
