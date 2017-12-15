goog.provide('plugin.mapzen.places.AttrResult');

goog.require('os.search.AbstractSearchResult');
goog.require('plugin.mapzen.places.attrCardDirective');



/**
 * HTML Attribution result for Google Places API
 * @param {Array<!string>} attributions
 * @extends {os.search.AbstractSearchResult<Array<!string>>}
 * @constructor
 */
plugin.mapzen.places.AttrResult = function(attributions) {
  plugin.mapzen.places.AttrResult.base(this, 'constructor', attributions, 96);
};
goog.inherits(plugin.mapzen.places.AttrResult, os.search.AbstractSearchResult);


/**
 * @inheritDoc
 */
plugin.mapzen.places.AttrResult.prototype.getSearchUI = function() {
  return '<mapzenplacesattrcard result="result"></mapzenplacesattrcard>';
};
