goog.provide('plugin.places.PlacesLayer');

goog.require('os.fn');
goog.require('plugin.file.kml.KMLLayer');



/**
 * KML Layer for organizing Places.
 * @param {olx.layer.VectorOptions} options Vector layer options
 * @extends {plugin.file.kml.KMLLayer}
 * @constructor
 */
plugin.places.PlacesLayer = function(options) {
  plugin.places.PlacesLayer.base(this, 'constructor', options);

  // TODO add specialized legend rendering for Places
  this.renderLegend = os.fn.noop;
};
goog.inherits(plugin.places.PlacesLayer, plugin.file.kml.KMLLayer);
