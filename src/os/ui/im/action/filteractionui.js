goog.module('os.ui.im.action');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * Get all filter action entries from matched results.
 * @param {Object} matched The matched entries.
 * @return {!Array<!FilterActionEntry>}
 */
const getEntriesFromMatched = function(matched) {
  var entries = [];
  if (matched) {
    for (var key in matched) {
      var layerModel = matched[key];
      if (layerModel && layerModel['filterModels']) {
        layerModel['filterModels'].reduce(reduceEntriesFromFilterModels, entries);
      }
    }
  }
  return entries;
};


/**
 * Reduce matched filter models to filter entries.
 * @param {!Array<!FilterActionEntry>} result The parsed entries.
 * @param {Object} item The current item.
 * @param {number} idx The array index.
 * @param {Array} arr The array.
 * @return {!Array<!FilterActionEntry>}
 */
const reduceEntriesFromFilterModels = function(result, item, idx, arr) {
  if (item) {
    // add each filter and create a query entry for it
    var entry = /** @type {FilterActionEntry} */ (item['filter']);
    if (entry) {
      result.push(entry);
    }
  }
  return result;
};

exports = {
  getEntriesFromMatched,
  reduceEntriesFromFilterModels
};
