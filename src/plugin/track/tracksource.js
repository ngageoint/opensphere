goog.provide('plugin.track.TrackSource');

goog.require('os.geom.GeometryField');
goog.require('plugin.file.kml.KMLSource');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.track');



/**
 * Vector source to manage tracks created in the application.
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @extends {plugin.file.kml.KMLSource}
 * @constructor
 */
plugin.track.TrackSource = function(opt_options) {
  plugin.track.TrackSource.base(this, 'constructor', opt_options);

  // don't allow refreshing the track layer - it won't do anything useful
  this.refreshEnabled = false;

  // create the root node to store tracks
  var rootNode = new plugin.file.kml.ui.KMLNode();
  rootNode.setLabel(plugin.track.LAYER_TITLE);
  rootNode.setSource(this);
  this.setRootNode(rootNode);
};
goog.inherits(plugin.track.TrackSource, plugin.file.kml.KMLSource);


/**
 * Class name
 * @type {string}
 * @const
 */
plugin.track.TrackSource.NAME = 'plugin.track.TrackSource';
os.registerClass(plugin.track.TrackSource.NAME, plugin.track.TrackSource);



/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.getFilteredFeatures = function(opt_allTime) {
  // the most recent track position is always displayed, so force all time for track layers
  return plugin.track.TrackSource.base(this, 'getFilteredFeatures', true);
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.processDeferred = function(features) {
  plugin.track.TrackSource.base(this, 'processDeferred', features);
  this.updateTrackZIndex();
};


/**
 * @inheritDoc
 */
plugin.track.TrackSource.prototype.updateVisibilityFromNodes = function() {
  plugin.track.TrackSource.base(this, 'updateVisibilityFromNodes');
  this.updateTrackZIndex();
};


/**
 * Updates the z-index of all tracks in the layer.
 * @protected
 */
plugin.track.TrackSource.prototype.updateTrackZIndex = function() {
  plugin.track.updateTrackZIndex(this.rootNode.getFeatures(false));
};
