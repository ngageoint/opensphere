goog.module('os.command.VectorLayerLOBError');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the lob bearing error column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerLOBError extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing bearing error column';
    this.value = value || '';
    this.metricKey = metrics.Layer.VECTOR_LOB_LENGTH_ERROR_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_LENGTH_ERROR_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_LENGTH_ERROR_COLUMN] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBError;
