goog.provide('plugin.pelias.geocoder.Result');

goog.require('os.ui.search.place.CoordinateResult');
goog.require('plugin.pelias.geocoder.resultCardDirective');



/**
 * @param {ol.Feature} result
 * @extends {os.ui.search.place.CoordinateResult}
 * @constructor
 */
plugin.pelias.geocoder.Result = function(result) {
  plugin.pelias.geocoder.Result.base(this, 'constructor', result, 'name');
  this.score = 95 + /** @type {number} */ (result.get('confidence'));
};
goog.inherits(plugin.pelias.geocoder.Result, os.ui.search.place.CoordinateResult);


/**
 * @inheritDoc
 */
plugin.pelias.geocoder.Result.prototype.getSearchUI = function() {
  return '<peliasgeocoderresultcard result="result"></peliasgeocoderresultcard>';
};
