goog.module('os.command.LayerStyle');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const MapContainer = goog.require('os.MapContainer');
const AbstractStyle = goog.require('os.command.AbstractStyle');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const VectorLayer = goog.require('os.layer.Vector');
const osStyle = goog.require('os.style');


/**
 * Changes the style of either a vector or tile layer. Requires a setter callback as well as the new value.
 *
 * @template T
 */
class LayerStyle extends AbstractStyle {
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
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = MapContainer.getInstance().getLayer(this.layerId);
    if (osImplements(layer, ILayer.ID)) {
      return /** @type {os.layer.ILayer} */ (layer).getOpacity();
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = MapContainer.getInstance().getLayer(this.layerId);
    if (osImplements(layer, ILayer.ID)) {
      this.callback(/** @type {os.layer.ILayer} */ (layer), value);
    }
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var layer = MapContainer.getInstance().getLayer(this.layerId);
    if (layer instanceof VectorLayer) {
      // only notify style changes on vector layers as it causes a flicker on tile layers
      osStyle.notifyStyleChange(layer);
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

    var layer = /** @type {os.layer.Vector} */ (MapContainer.getInstance().getLayer(this.layerId));
    asserts.assert(layer, 'layer must be defined');

    var config = this.getLayerConfig(layer) || {};

    this.applyValue(config, value);
    this.finish(config);
  }
}

exports = LayerStyle;
