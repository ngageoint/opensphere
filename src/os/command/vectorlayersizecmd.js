goog.module('os.command.VectorLayerSize');

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the size of a layer
 */
class VectorLayerSize extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} size
   * @param {number=} opt_oldSize
   */
  constructor(layerId, size, opt_oldSize) {
    super(layerId, size, opt_oldSize);
    this.title = 'Change Size';
    this.metricKey = LayerKeys.VECTOR_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return osStyle.getConfigSize(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var size = /** @type {number} */ (value);
    osStyle.setConfigSize(config, size);

    super.applyValue(config, value);
  }
}

exports = VectorLayerSize;
