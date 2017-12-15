goog.provide('plugin.mapzen.places.Result');

goog.require('os.ui.search.place.CoordinateResult');
goog.require('plugin.mapzen.places.resultCardDirective');



/**
 * @param {ol.Feature} result
 * @extends {os.ui.search.place.CoordinateResult}
 * @constructor
 */
plugin.mapzen.places.Result = function(result) {
  plugin.mapzen.places.Result.base(this, 'constructor', result, 'name');
  this.score = 95 + /** @type {number} */ (result.get('confidence'));
};
goog.inherits(plugin.mapzen.places.Result, os.ui.search.place.CoordinateResult);


/**
 * @inheritDoc
 */
plugin.mapzen.places.Result.prototype.getSearchUI = function() {
  return '<mapzenplacesresultcard result="result"></mapzenplacesresultcard>';
};
