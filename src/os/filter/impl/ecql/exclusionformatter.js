goog.provide('os.filter.impl.ecql.ExclusionFormatter');

goog.require('os.filter.impl.ecql.AreaFormatter');

/**
 * @param {string=} opt_column Optional geometry column name
 * @extends {os.filter.impl.ecql.AreaFormatter}
 * @constructor
 */
os.filter.impl.ecql.ExclusionFormatter = function(opt_column) {
  os.filter.impl.ecql.ExclusionFormatter.base(this, 'constructor', opt_column);
  this.spatialPredicate = 'DISJOINT';
  this.group = 'AND';
};
goog.inherits(os.filter.impl.ecql.ExclusionFormatter, os.filter.impl.ecql.AreaFormatter);
