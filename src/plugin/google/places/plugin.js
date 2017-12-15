goog.provide('plugin.google.places.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.google.places.Search');



/**
 * Provides GeoNames search
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.google.places.Plugin = function() {
  plugin.google.places.Plugin.base(this, 'constructor');
  this.id = plugin.google.places.Plugin.ID;
};
goog.inherits(plugin.google.places.Plugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.google.places.Plugin.ID = 'google-places';


/**
 * @inheritDoc
 */
plugin.google.places.Plugin.prototype.init = function() {
  var uri = os.settings.get(['plugin', 'google', 'places', 'url']);

  if (uri) {
    os.search.SearchManager.getInstance().registerSearch(new plugin.google.places.Search('Places (Google)'));
  }
};
