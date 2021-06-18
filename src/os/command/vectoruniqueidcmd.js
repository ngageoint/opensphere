goog.module('os.command.VectorUniqueIdCmd');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const metrics = goog.require('os.metrics');


/**
 * Changes the unique ID for a vector source.
 *
 * @extends {AbstractVectorStyle<string>}
 */
class VectorUniqueIdCmd extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {os.data.ColumnDefinition} value
   * @param {os.data.ColumnDefinition=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Unique ID';
    this.metricKey = metrics.Layer.VECTOR_UNIQUE_ID;

    /**
     * @type {os.data.ColumnDefinition}
     */
    this.value = value;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var layer = this.getLayer();
    var source = /** @type {os.source.Vector} */ (layer.getSource());
    return source.getUniqueId();
  }

  /**
   * @inheritDoc
   */
  setValue(value) {
    var layer = /** @type {os.layer.Vector} */ (this.getLayer());
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
    var source = /** @type {os.source.Vector} */ (layer.getSource());
    source.setUniqueId(value);
  }
}

exports = VectorUniqueIdCmd;
