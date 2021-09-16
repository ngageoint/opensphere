goog.module('os.command.VectorUniqueIdCmd');

const asserts = goog.require('goog.asserts');
const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');
const VectorLayer = goog.requireType('os.layer.Vector');
const VectorSource = goog.requireType('os.source.Vector');


/**
 * Changes the unique ID for a vector source.
 *
 * @extends {AbstractVectorStyle<string>}
 */
class VectorUniqueIdCmd extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {ColumnDefinition} value
   * @param {ColumnDefinition=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Unique ID';
    this.metricKey = LayerKeys.VECTOR_UNIQUE_ID;

    /**
     * @type {ColumnDefinition}
     */
    this.value = value;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = this.getLayer();
    var source = /** @type {VectorSource} */ (layer.getSource());
    return source.getUniqueId();
  }

  /**
   * @inheritDoc
   */
  setValue(value) {
    var layer = /** @type {VectorLayer} */ (this.getLayer());
    asserts.assert(layer, 'layer must be defined');

    var config = this.getLayerConfig(layer);
    asserts.assert(config, 'layer config must be defined');

    this.applyValue(config, value);
    this.finish(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var layer = this.getLayer();
    var source = /** @type {VectorSource} */ (layer.getSource());
    source.setUniqueId(value);
  }
}

exports = VectorUniqueIdCmd;
