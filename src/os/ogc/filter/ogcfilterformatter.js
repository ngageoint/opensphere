goog.provide('os.ogc.filter.OGCFilterFormatter');
goog.require('os.filter.IFilterFormatter');



/**
 * @constructor
 * @implements {os.filter.IFilterFormatter}
 */
os.ogc.filter.OGCFilterFormatter = function() {};


/**
 * @inheritDoc
 */
os.ogc.filter.OGCFilterFormatter.prototype.format = function(filter) {
  return filter.getFilter() || '';
};


/**
 * @inheritDoc
 */
os.ogc.filter.OGCFilterFormatter.prototype.wrap = function(filter, group) {
  var g = group ? 'And' : 'Or';
  return '<' + g + '>' + filter + '</' + g + '>';
};


/**
 * @inheritDoc
 */
os.ogc.filter.OGCFilterFormatter.prototype.wrapAll = function(filter) {
  return filter ? '<And>' + filter + '</And>' : '';
};
