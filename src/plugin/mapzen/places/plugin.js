goog.provide('plugin.mapzen.places.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.mapzen.places.Search');



/**
 * Provides Mapzen search
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.mapzen.places.Plugin = function() {
  plugin.mapzen.places.Plugin.base(this, 'constructor');
  this.id = plugin.mapzen.places.Plugin.ID;
};
goog.inherits(plugin.mapzen.places.Plugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.mapzen.places.Plugin.ID = 'mapzen-places';


/**
 * @inheritDoc
 */
plugin.mapzen.places.Plugin.prototype.init = function() {
  var uri = os.settings.get(['plugin', 'mapzen', 'places', 'url']);

  if (uri) {
    os.search.SearchManager.getInstance().registerSearch(new plugin.mapzen.places.Search('Places (Mapzen)'));
  }
};
