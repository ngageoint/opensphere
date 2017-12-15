goog.provide('plugin.google.places.Result');

goog.require('os.ui.search.place.CoordinateResult');
goog.require('plugin.google.places.resultCardDirective');



/**
 * @param {ol.Feature} result
 * @extends {os.ui.search.place.CoordinateResult}
 * @constructor
 */
plugin.google.places.Result = function(result) {
  plugin.google.places.Result.base(this, 'constructor', result, 'name');
  this.score = 95;
};
goog.inherits(plugin.google.places.Result, os.ui.search.place.CoordinateResult);


/**
 * @inheritDoc
 */
plugin.google.places.Result.prototype.getSearchUI = function() {
  return '<googleplacesresultcard result="result"></googleplacesresultcard>';
};
