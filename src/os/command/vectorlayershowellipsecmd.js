goog.module('os.command.VectorLayerShowEllipse');

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


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
    this.metricKey = LayerKeys.VECTOR_SHOW_ELLIPSE;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Show Ellipse' : 'Disable Show Ellipse';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_ELLIPSE] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_ELLIPSE] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowEllipse;
