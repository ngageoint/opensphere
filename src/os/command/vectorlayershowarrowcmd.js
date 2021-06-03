goog.module('os.command.VectorLayerShowArrow');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes if lob arrows are shown.
 *
 * @extends {AbstractVectorLayerLOB<boolean>}
 */
class VectorLayerShowArrow extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = metrics.Layer.VECTOR_SHOW_ARROW;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Arrow' : 'Disable Arrow';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[os.style.StyleField.SHOW_ARROW] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.SHOW_ARROW] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowArrow;
