goog.module('os.command.VectorLayerLOBColumnLength');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes the lob column length
 *
 * @extends {AbstractVectorLayerLOB<number>}
 */
class VectorLayerLOBColumnLength extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing column length';
    this.value = value;
    this.metricKey = metrics.Layer.VECTOR_LOB_COLUMN_LENGTH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[os.style.StyleField.LOB_COLUMN_LENGTH] : os.style.DEFAULT_LOB_LENGTH;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.LOB_COLUMN_LENGTH] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBColumnLength;
