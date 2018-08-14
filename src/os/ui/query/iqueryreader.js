goog.provide('os.ui.query.IQueryReader');



/**
 * Interface for classes capable of reading queries we have written out and parsing them into areas, filters and
 * query entries.
 * @interface
 */
os.ui.query.IQueryReader = function() {};


/**
 * Sets the filter on the query reader
 * @param {!Element} filter
 */
os.ui.query.IQueryReader.prototype.setFilter;


/**
 * Sets the layer ID on the query reader
 * @param {string} layerId
 */
os.ui.query.IQueryReader.prototype.setLayerId;


/**
 * Tells the reader to parse the entries.
 */
os.ui.query.IQueryReader.prototype.parseEntries;
