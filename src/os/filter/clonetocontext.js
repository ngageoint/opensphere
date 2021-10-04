goog.declareModuleId('os.filter.cloneToContext');

import instanceOf from '../instanceof.js';
import FilterEntry from './filterentry.js';


/**
 * Clone a filter entry to the current window context.
 *
 * @param {FilterEntry} entry The alleged filter entry.
 * @return {FilterEntry} A filter entry created in the current window context.
 */
const cloneToContext = function(entry) {
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

export default cloneToContext;
