goog.declareModuleId('os.command.LayerStyle');

import osImplements from '../implements.js';
import instanceOf from '../instanceof.js';
import ILayer from '../layer/ilayer.js';
import LayerClass from '../layer/layerclass.js';
import {getMapContainer} from '../map/mapinstance.js';
import * as osStyle from '../style/style.js';
import AbstractStyle from './abstractstylecmd.js';

const asserts = goog.require('goog.asserts');

const {default: VectorLayer} = goog.requireType('os.layer.Vector');


/**
 * Changes the style of either a vector or tile layer. Requires a setter callback as well as the new value.
 *
 * @template T
 */
export default class LayerStyle extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {function(os.layer.ILayer, ?)} callback Callback to actually do the set on the layer.
   * @param {number} value The new value to set.
   * @param {number=} opt_oldValue Optional old value. If not provided, the command pulls the old value off the layer.
   */
  constructor(layerId, callback, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);

    /**
     * The setter callback to set the value on the layer.
     * @type {function(os.layer.ILayer, ?)}
     * @protected
     */
    this.callback = callback;

    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = getMapContainer().getLayer(this.layerId);
    if (osImplements(layer, ILayer.ID)) {
      return /** @type {os.layer.ILayer} */ (layer).getOpacity();
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = getMapContainer().getLayer(this.layerId);
    if (osImplements(layer, ILayer.ID)) {
      this.callback(/** @type {os.layer.ILayer} */ (layer), value);
    }
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var layer = getMapContainer().getLayer(this.layerId);
    if (instanceOf(layer, LayerClass.VECTOR)) {
      // only notify style changes on vector layers as it causes a flicker on tile layers
      osStyle.notifyStyleChange(/** @type {VectorLayer} */ (layer));
    }
  }

  /**
   * This method is similar to the one on the parent class, but since opacity changes apply to the drawing layer,
   * it doesn't bother to check whether the layer config is defined. The layer config isn't needed at all and the
   * drawing layer doesn't have one.
   *
   * @override
   */
  setValue(value) {
    asserts.assert(value != null, 'style value must be defined');

    var layer = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.layerId));
    asserts.assert(layer, 'layer must be defined');

    var config = this.getLayerConfig(layer) || {};

    this.applyValue(config, value);
    this.finish(config);
  }
}
