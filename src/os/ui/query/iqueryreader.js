goog.module('os.ui.query.IQueryReader');

/**
 * Interface for classes capable of reading queries we have written out and parsing them into areas, filters and
 * query entries.
 *
 * @interface
 */
class IQueryReader {
  /**
   * Sets the filter on the query reader
   * @param {!Element} filter
   */
  setFilter(filter) {}

  /**
   * Sets the layer ID on the query reader
   * @param {string} layerId
   */
  setLayerId(layerId) {}

  /**
   * Tells the reader to parse the entries.
   */
  parseEntries() {}
}

exports = IQueryReader;
