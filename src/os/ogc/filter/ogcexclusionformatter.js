goog.provide('os.ogc.filter.OGCExclusionFormatter');
goog.require('os.ogc.filter.OGCSpatialFormatter');



/**
 * Formats a exclusion query for use in an OGC Filter.
 * @param {string=} opt_column
 * @extends {os.ogc.filter.OGCSpatialFormatter}
 * @constructor
 */
os.ogc.filter.OGCExclusionFormatter = function(opt_column) {
  os.ogc.filter.OGCExclusionFormatter.base(this, 'constructor', opt_column);
};
goog.inherits(os.ogc.filter.OGCExclusionFormatter, os.ogc.filter.OGCSpatialFormatter);


/**
 * @inheritDoc
 */
os.ogc.filter.OGCExclusionFormatter.prototype.wrapMultiple = function(value) {
  return '<And>' + value + '</And>';
};


/**
 * @inheritDoc
 */
os.ogc.filter.OGCExclusionFormatter.prototype.format = function(feature) {
  var result = os.ogc.filter.OGCExclusionFormatter.superClass_.format.call(this, feature);
  result = result.replace(/(BBOX|Intersects)/g, 'Disjoint');
  return result;
};
