goog.provide('os.state.v4.LayerState');

goog.require('os.map');
goog.require('os.state.v4.BaseLayerState');



/**
 * @extends {os.state.v4.BaseLayerState}
 * @constructor
 */
os.state.v4.LayerState = function() {
  os.state.v4.LayerState.base(this, 'constructor');
};
goog.inherits(os.state.v4.LayerState, os.state.v4.BaseLayerState);


/**
 * @inheritDoc
 */
os.state.v4.LayerState.prototype.remove = function(id) {
  var layers = os.MapContainer.getInstance().getLayers();
  var i = layers.length;

  while (i--) {
    var layer = layers[i];
    if (layer) {
      try {
        var layerId = /** @type {os.layer.ILayer} */ (layer).getId();
        if (layerId && goog.string.startsWith(layerId, id)) {
          os.MapContainer.getInstance().removeLayer(layer);
        }
      } catch (e) {
        // probably not actually a os.layer.ILayer - wtb implements in JS, pst
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.state.v4.LayerState.prototype.saveInternal = function(options, rootObj) {
  this.setLayers(os.MapContainer.getInstance().getLayers());
  os.state.v4.LayerState.base(this, 'saveInternal', options, rootObj);
};
