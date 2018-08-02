goog.provide('plugin.pelias.geocoder.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.pelias.geocoder.Search');



/**
 * Provides Pelias Geocoder (text -> coordinates) search
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.pelias.geocoder.Plugin = function() {
  plugin.pelias.geocoder.Plugin.base(this, 'constructor');
  this.id = plugin.pelias.geocoder.Plugin.ID;
};
goog.inherits(plugin.pelias.geocoder.Plugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.pelias.geocoder.Plugin.ID = 'pelias.geocoder';


/**
 * @inheritDoc
 */
plugin.pelias.geocoder.Plugin.prototype.init = function() {
  var uri = os.settings.get(['plugin', 'pelias', 'geocoder', 'url']);

  if (uri) {
    os.search.SearchManager.getInstance().registerSearch(new plugin.pelias.geocoder.Search('Place search (Pelias)'));
  }
};
