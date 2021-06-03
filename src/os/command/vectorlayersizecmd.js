goog.module('os.command.VectorLayerSize');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const metrics = goog.require('os.metrics');


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
    this.metricKey = metrics.Layer.VECTOR_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return os.style.getConfigSize(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var size = /** @type {number} */ (value);
    os.style.setConfigSize(config, size);

    super.applyValue(config, value);
  }
}

exports = VectorLayerSize;
