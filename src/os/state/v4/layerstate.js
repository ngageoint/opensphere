goog.declareModuleId('os.state.v4.LayerState');

import {getMapContainer} from '../../map/mapinstance.js';
import BaseLayerState from './baselayerstate.js';

const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 */
export default class LayerState extends BaseLayerState {
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
          var layerId = /** @type {ILayer} */ (layer).getId();
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
