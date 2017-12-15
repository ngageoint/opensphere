goog.provide('plugin.osm.nom.NominatimPlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('os.search.SearchManager');
goog.require('plugin.osm.nom');
goog.require('plugin.osm.nom.NominatimSearch');


/**
 * Provides an interface to the OSM Nominatim API.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.osm.nom.NominatimPlugin = function() {
  plugin.osm.nom.NominatimPlugin.base(this, 'constructor');
  this.id = plugin.osm.nom.ID;
};
goog.inherits(plugin.osm.nom.NominatimPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.osm.nom.NominatimPlugin.prototype.init = function() {
  // register the search provider if configured
  var url = /** @type {string|undefined} */ (os.settings.get(plugin.osm.nom.SettingKey.URL));
  if (url) {
    var search = new plugin.osm.nom.NominatimSearch(plugin.osm.nom.SEARCH_NAME);
    os.search.SearchManager.getInstance().registerSearch(search);
  }
};
