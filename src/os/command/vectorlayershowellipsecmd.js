goog.module('os.command.VectorLayerShowEllipse');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes if lob errors are shown.
 *
 * @extends {AbstractVectorLayerLOB<boolean>}
 */
class VectorLayerShowEllipse extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {boolean} value
   * @param {boolean=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.metricKey = metrics.Layer.VECTOR_SHOW_ELLIPSE;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Show Ellipse' : 'Disable Show Ellipse';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[os.style.StyleField.SHOW_ELLIPSE] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.SHOW_ELLIPSE] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowEllipse;
