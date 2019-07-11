goog.provide('plugin.places.PlacesLayerConfig');

goog.require('plugin.file.kml.KMLLayerConfig');
goog.require('plugin.places.PlacesLayer');
goog.require('plugin.places.PlacesSource');



/**
 * Creates a KML layer for organizing Places.
 * @extends {plugin.file.kml.KMLLayerConfig}
 * @constructor
 */
plugin.places.PlacesLayerConfig = function() {
  plugin.places.PlacesLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.places.PlacesLayerConfig, plugin.file.kml.KMLLayerConfig);


/**
 * Places layer config ID.
 * @type {string}
 * @const
 */
plugin.places.PlacesLayerConfig.ID = 'places';


/**
 * @inheritDoc
 */
plugin.places.PlacesLayerConfig.prototype.getLayer = function(source) {
  return new plugin.places.PlacesLayer({
    source: source
  });
};


/**
 * @inheritDoc
 */
plugin.places.PlacesLayerConfig.prototype.getSource = function(options) {
  return new plugin.places.PlacesSource(undefined);
};
