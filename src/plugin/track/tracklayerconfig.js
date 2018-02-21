goog.provide('plugin.track.TrackLayerConfig');

goog.require('plugin.file.kml.KMLLayerConfig');
goog.require('plugin.track.TrackLayer');
goog.require('plugin.track.TrackSource');



/**
 * Creates a KML layer to organize tracks generated from other data sources.
 * @extends {plugin.file.kml.KMLLayerConfig}
 * @constructor
 */
plugin.track.TrackLayerConfig = function() {
  plugin.track.TrackLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.track.TrackLayerConfig, plugin.file.kml.KMLLayerConfig);


/**
 * @inheritDoc
 */
plugin.track.TrackLayerConfig.prototype.getLayer = function(source) {
  return new plugin.track.TrackLayer({
    source: source
  });
};


/**
 * @inheritDoc
 */
plugin.track.TrackLayerConfig.prototype.getSource = function(options) {
  return new plugin.track.TrackSource(undefined);
};


/**
 * @inheritDoc
 */
plugin.track.TrackLayerConfig.prototype.getRequest = function(options) {
  return null;
};
