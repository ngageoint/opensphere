goog.module('os.command.VectorLayerLOBMultiplier');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the lob length multiplier column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerLOBMultiplier extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing length column';
    this.value = value || '';
    this.metricKey = LayerKeys.VECTOR_LOB_LENGTH_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_LENGTH_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_LENGTH_COLUMN] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBMultiplier;
