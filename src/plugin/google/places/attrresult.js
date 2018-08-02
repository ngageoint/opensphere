goog.provide('plugin.google.places.AttrResult');

goog.require('os.search.AbstractSearchResult');
goog.require('plugin.google.places.attrCardDirective');



/**
 * HTML Attribution result for Google Places API
 * @param {Array<!string>} attributions
 * @extends {os.search.AbstractSearchResult<Array<!string>>}
 * @constructor
 */
plugin.google.places.AttrResult = function(attributions) {
  plugin.google.places.AttrResult.base(this, 'constructor', attributions, 96);
};
goog.inherits(plugin.google.places.AttrResult, os.search.AbstractSearchResult);


/**
 * @inheritDoc
 */
plugin.google.places.AttrResult.prototype.getSearchUI = function() {
  return '<googleplacesattrcard result="result"></googleplacesattrcard>';
};
