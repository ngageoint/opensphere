goog.provide('os.interaction.DoubleClick');

goog.require('ol.Feature');
goog.require('ol.MapBrowserEventType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.implements');
goog.require('os.source.Vector');
goog.require('os.ui.feature.multiFeatureInfoDirective');



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
os.implements(os.interaction.DoubleClick, os.I3DSupport.ID);

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
  var features = [];

  if (mapBrowserEvent.type == ol.MapBrowserEventType.DBLCLICK &&
      map.getView().getHints()[ol.ViewHint.INTERACTING] == 0) {
    try {
      var options = {
        'drillPick': true
      };

      map.forEachFeatureAtPixel(mapBrowserEvent.pixel, function(feature, layer) {
        if (feature instanceof ol.Feature) {
          if (!layer || !(layer instanceof os.layer.Vector)) {
            // might be an animation overlay - try to find the original layer
            layer = os.feature.getLayer(feature);
          }

          if (layer instanceof os.layer.Vector) {
            var vector = /** @type {os.layer.Vector} */ (layer);
            var id = vector.getId();

            if (vector && id) {
              goog.array.insert(features, feature);
            }
          }
        }
      }, options);

      if (features.length > 0) {
        os.ui.feature.launchMultiFeatureInfo(features);
      }
    } catch (e) {
    }
  }

  return !features.length;
};
