goog.module('os.command.VectorLayerLOBColumnLength');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


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
    this.metricKey = LayerKeys.VECTOR_LOB_COLUMN_LENGTH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[StyleField.LOB_COLUMN_LENGTH] : osStyle.DEFAULT_LOB_LENGTH;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_COLUMN_LENGTH] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBColumnLength;
