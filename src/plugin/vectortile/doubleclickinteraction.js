goog.provide('plugin.vectortile.DoubleClick');

goog.require('ol.MapBrowserEventType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('ol.render.Feature');
goog.require('os.I3DSupport');
goog.require('os.implements');
goog.require('os.layer.VectorTile');
goog.require('os.mixin.renderfeature');
goog.require('os.ui.feature.multiFeatureInfoDirective');



/**
 * Handles the behavior of double clicking on a feature.
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @implements {os.I3DSupport}
 */
plugin.vectortile.DoubleClick = function() {
  plugin.vectortile.DoubleClick.base(this, 'constructor', {
    handleEvent: plugin.vectortile.DoubleClick.handleEvent_
  });

  /**
   * @type {boolean}
   * @private
   */
  this.supports3D_ = true;
};
goog.inherits(plugin.vectortile.DoubleClick, ol.interaction.Interaction);
os.implements(plugin.vectortile.DoubleClick, os.I3DSupport.ID);

/**
 * @inheritDoc
 */
plugin.vectortile.DoubleClick.prototype.is3DSupported = function() {
  return this.supports3D_;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 * @this plugin.vectortile.DoubleClick
 * @private
 */
plugin.vectortile.DoubleClick.handleEvent_ = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var features = [];

  if (mapBrowserEvent.type == ol.MapBrowserEventType.DBLCLICK &&
      map.getView().getHints()[ol.ViewHint.INTERACTING] == 0) {
    // Do a 2D-only forEachFeatureAtPixel for items in a VectorTileLayer. 3D contexts
    // only have the resulting raster tile.
    var pixel2D = /** @type {os.Map} */ (map).get2DPixelFromCoordinate(mapBrowserEvent.coordinate);
    os.Map.superClass_.forEachFeatureAtPixel.call(map, pixel2D, function(feature, layer) {
      if (layer instanceof os.layer.VectorTile && feature instanceof ol.render.Feature) {
        feature['id'] = ol.getUid(feature);
        features.push(feature);
      }
    });

    if (features.length > 0) {
      os.ui.feature.launchMultiFeatureInfo(features);
    }
  }

  return !features.length;
};
