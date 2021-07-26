goog.module('os.command.VectorLayerRotation');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the icon rotation column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerRotation extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change icon rotation column';
    this.value = value || '';
    this.metricKey = LayerKeys.VECTOR_ROTATION_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.ROTATION_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.ROTATION_COLUMN] = value;

    super.applyValue(config, value);
  }
}

exports = VectorLayerRotation;
