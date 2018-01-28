goog.provide('plugin.pelias.geocoder.AttrResult');

goog.require('os.search.AbstractSearchResult');
goog.require('plugin.pelias.geocoder.attrCardDirective');



/**
 * HTML Attribution result for Google Places API
 * @param {Array<!string>} attributions
 * @extends {os.search.AbstractSearchResult<Array<!string>>}
 * @constructor
 */
plugin.pelias.geocoder.AttrResult = function(attributions) {
  plugin.pelias.geocoder.AttrResult.base(this, 'constructor', attributions, 96);
};
goog.inherits(plugin.pelias.geocoder.AttrResult, os.search.AbstractSearchResult);


/**
 * @inheritDoc
 */
plugin.pelias.geocoder.AttrResult.prototype.getSearchUI = function() {
  return '<peliasgeocoderattrcard result="result"></peliasgeocoderattrcard>';
};
