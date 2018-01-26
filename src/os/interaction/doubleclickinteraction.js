goog.provide('os.interaction.DoubleClick');

goog.require('ol.Feature');
goog.require('ol.MapBrowserEventType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.source.Vector');



/**
 * Handles the behavior of double clicking on a feature.
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @implements {os.I3DSupport}
 */
os.interaction.DoubleClick = function() {
  os.interaction.DoubleClick.base(this, 'constructor', {
    handleEvent: os.interaction.DoubleClick.handleEvent_
  });

  /**
   * @type {boolean}
   * @private
   */
  this.supports3D_ = true;
};
goog.inherits(os.interaction.DoubleClick, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
os.interaction.DoubleClick.prototype.is3DSupported = function() {
  return this.supports3D_;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 * @this os.interaction.DoubleClick
 * @private
 */
os.interaction.DoubleClick.handleEvent_ = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;

  if (mapBrowserEvent.type == ol.MapBrowserEventType.DBLCLICK &&
      map.getView().getHints()[ol.ViewHint.INTERACTING] == 0) {
    try {
      var feature = map.forEachFeatureAtPixel(mapBrowserEvent.pixel, this.checkLayers_.bind(this));
    } catch (e) {
    }
  }

  return !feature;
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {ol.layer.Layer} layer Layer.
 * @return {?ol.Feature}
 * @private
 */
os.interaction.DoubleClick.prototype.checkLayers_ = function(feature, layer) {
  if (feature instanceof ol.Feature) {
    if (!layer || !(layer instanceof os.layer.Vector)) {
      // might be an animation overlay - try to find the original layer
      layer = os.feature.getLayer(feature);
    }

    if (layer instanceof os.layer.Vector) {
      var vector = /** @type {os.layer.Vector} */ (layer);
      var handler = vector.getDoubleClickHandler();
      if (handler) {
        handler(feature);
        return feature;
      }
    }
  }

  return null;
};
