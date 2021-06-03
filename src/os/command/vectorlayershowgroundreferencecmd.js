goog.module('os.command.VectorLayerShowGroundReference');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes if ellipse ground reference is shown in 3D mode.
 */
class VectorLayerShowGroundReference extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = metrics.Layer.VECTOR_GROUND_REF;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Ground Reference' : 'Disable Ground Reference';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[os.style.StyleField.SHOW_GROUND_REF] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.SHOW_GROUND_REF] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowGroundReference;
