goog.provide('plugin.places.PlacesSource');

goog.require('os.feature');
goog.require('os.geom.GeometryField');
goog.require('os.interpolate');
goog.require('os.track');
goog.require('plugin.file.kml.KMLSource');
goog.require('plugin.file.kml.ui.KMLNode');



/**
 * Vector source to manage places created in the application. Also adds specialized handling for tracks.
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @extends {plugin.file.kml.KMLSource}
 * @constructor
 */
plugin.places.PlacesSource = function(opt_options) {
  plugin.places.PlacesSource.base(this, 'constructor', opt_options);

  // don't allow refreshing the places layer - it won't do anything useful
  this.refreshEnabled = false;
};
goog.inherits(plugin.places.PlacesSource, plugin.file.kml.KMLSource);
os.implements(plugin.places.PlacesSource, os.source.IModifiableSource.ID);


/**
 * @inheritDoc
 */
plugin.places.PlacesSource.prototype.supportsModify = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.places.PlacesSource.prototype.getModifyFunction = function() {
  return (originalFeature, modifiedFeature) => {
    const node = this.getFeatureNode(originalFeature);

    if (node) {
      originalFeature.setGeometry(modifiedFeature.getGeometry());
      originalFeature.unset(os.interpolate.ORIGINAL_GEOM_FIELD, true);
      os.interpolate.interpolateFeature(originalFeature);

      const options = {
        'node': node,
        'feature': originalFeature
      };

      plugin.file.kml.ui.updatePlacemark(options);
      os.feature.createEllipse(originalFeature, true);
      this.notifyDataChange();
    }
  };
};


/**
 * @inheritDoc
 */
plugin.places.PlacesSource.prototype.getFilteredFeatures = function(opt_allTime) {
  // the most recent track position is always displayed, so force all time for track layers
  return plugin.places.PlacesSource.base(this, 'getFilteredFeatures', true);
};


/**
 * @inheritDoc
 */
plugin.places.PlacesSource.prototype.processDeferred = function(features) {
  plugin.places.PlacesSource.base(this, 'processDeferred', features);
  this.updateTrackZIndex();
};


/**
 * @inheritDoc
 */
plugin.places.PlacesSource.prototype.updateVisibilityFromNodes = function() {
  plugin.places.PlacesSource.base(this, 'updateVisibilityFromNodes');
  this.updateTrackZIndex();
};


/**
 * Updates the z-index of all tracks in the layer.
 * @protected
 */
plugin.places.PlacesSource.prototype.updateTrackZIndex = function() {
  if (this.rootNode) {
    os.track.updateTrackZIndex(this.rootNode.getFeatures(false));
  }
};
