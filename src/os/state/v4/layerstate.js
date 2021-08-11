goog.module('os.state.v4.LayerState');
goog.module.declareLegacyNamespace();

const {getMapContainer} = goog.require('os.map.instance');
const BaseLayerState = goog.require('os.state.v4.BaseLayerState');


/**
 */
class LayerState extends BaseLayerState {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    var layers = getMapContainer().getLayers();
    var i = layers.length;

    while (i--) {
      var layer = layers[i];
      if (layer) {
        try {
          var layerId = /** @type {os.layer.ILayer} */ (layer).getId();
          if (layerId && layerId.startsWith(id)) {
            getMapContainer().removeLayer(layer);
          }
        } catch (e) {
          // probably not actually a os.layer.ILayer - wtb implements in JS, pst
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    this.setLayers(getMapContainer().getLayers());
    super.saveInternal(options, rootObj);
  }
}

exports = LayerState;
