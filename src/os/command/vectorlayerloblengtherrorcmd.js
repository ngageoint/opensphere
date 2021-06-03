goog.module('os.command.VectorLayerLOBLengthError');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes the lob length
 *
 * @extends {AbstractVectorLayerLOB<number>}
 */
class VectorLayerLOBLengthError extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing length error column multiplier';
    this.value = value;
    this.metricKey = metrics.Layer.VECTOR_LOB_LENGTH_ERROR;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[os.style.StyleField.LOB_LENGTH_ERROR] : os.style.DEFAULT_LOB_LENGTH_ERROR;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.LOB_LENGTH_ERROR] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBLengthError;
