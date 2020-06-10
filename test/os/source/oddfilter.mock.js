goog.provide('os.data.filter.OddFilter');
goog.require('os.filter.AbstractFilter');


/**
 * An odd filter, it only returns true for odd indices in the source array.
 */
os.data.filter.OddFilter = function() {
  os.data.filter.OddFilter.base(this, 'constructor');
};
goog.inherits(os.data.filter.OddFilter, os.filter.AbstractFilter);


/**
 * @inheritDoc
 */
os.data.filter.OddFilter.prototype.evaluate = function(item, index, array) {
  return index % 2 == 1;
};
