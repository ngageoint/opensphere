goog.provide('os.filter.AbstractFilter');
goog.require('os.filter.IFilter');



/**
 * @implements {os.filter.IFilter}
 * @template T
 * @constructor
 */
os.filter.AbstractFilter = function() {
  /**
   * @type {!string}
   * @private
   */
  this.id_ = 'os.filter.AbstractFilter';
};


/**
 * @inheritDoc
 */
os.filter.AbstractFilter.prototype.evaluate = function(item, index, array) {
  return true;
};


/**
 * @inheritDoc
 */
os.filter.AbstractFilter.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.filter.AbstractFilter.prototype.setId = function(id) {
  this.id_ = id;
};
