goog.provide('plugin.osm.nom.SearchResult');

goog.require('os.ui.search.place.CoordinateResult');
goog.require('plugin.osm.nom');
goog.require('plugin.osm.nom.resultCardDirective');



/**
 * Search result card for Nominatim results.
 * @param {ol.Feature} result The result feature.
 * @extends {os.ui.search.place.CoordinateResult}
 * @constructor
 */
plugin.osm.nom.SearchResult = function(result) {
  var score = plugin.osm.nom.getSearchScore(result);
  plugin.osm.nom.SearchResult.base(this, 'constructor', result, plugin.osm.nom.LABEL_FIELD, score);

  result.set(os.style.StyleType.FEATURE, plugin.osm.nom.VECTOR_CONFIG, true);
  os.style.setFeatureStyle(result);
};
goog.inherits(plugin.osm.nom.SearchResult, os.ui.search.place.CoordinateResult);


/**
 * @inheritDoc
 */
plugin.osm.nom.SearchResult.prototype.getSearchUI = function() {
  return '<nominatimresultcard result="result"></nominatimresultcard>';
};
