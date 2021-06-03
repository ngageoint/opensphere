goog.module('os.command.VectorLayerShowRotation');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes if icon rotation is shown.
 *
 * @extends {AbstractVectorLayerLOB<boolean>}
 */
class VectorLayerShowRotation extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = metrics.Layer.VECTOR_SHOW_ROTATION;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Icon Rotation' : 'Disable Icon Rotation';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[os.style.StyleField.SHOW_ROTATION] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.SHOW_ROTATION] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowRotation;
