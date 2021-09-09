goog.module('os.command.VectorLayerShowError');

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes if lob errors are shown.
 *
 * @extends {AbstractVectorLayerLOB<boolean>}
 */
class VectorLayerShowError extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = LayerKeys.VECTOR_SHOW_ERROR;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Show Error' : 'Disable Show Error';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_ERROR] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_ERROR] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowError;
