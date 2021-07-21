goog.module('os.filter.cloneToContext');
goog.module.declareLegacyNamespace();

const FilterEntry = goog.require('os.filter.FilterEntry');
const instanceOf = goog.require('os.instanceOf');

/**
 * Clone a filter entry to the current window context.
 *
 * @param {FilterEntry} entry The alleged filter entry.
 * @return {FilterEntry} A filter entry created in the current window context.
 */
exports = function(entry) {
  if (entry && !(instanceOf(entry, FilterEntry.NAME))) {
    try {
      var clone = new FilterEntry();
      clone.restore(entry.persist());

      if (instanceOf(clone, FilterEntry.NAME)) {
        entry = clone;
      }
    } catch (e) {
      entry = null;
    }
  }

  return entry;
};
