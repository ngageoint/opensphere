goog.module('os.command.VectorLayerArrowSize');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes the arrow size for a lob
 *
 * @extends {AbstractVectorLayerLOB<number>}
 */
class VectorLayerArrowSize extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing arrow size';
    this.value = value;
    this.metricKey = metrics.Layer.VECTOR_ARROW_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[os.style.StyleField.ARROW_SIZE] : os.style.DEFAULT_ARROW_SIZE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.ARROW_SIZE] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerArrowSize;
