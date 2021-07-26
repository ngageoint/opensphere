goog.module('os.command.VectorLayerShowArrow');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


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
    this.metricKey = LayerKeys.VECTOR_SHOW_ARROW;

    // make sure the value is a boolean
    this.value = !!value;
    this.title = value ? 'Enable Arrow' : 'Disable Arrow';
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config != null && config[StyleField.SHOW_ARROW] || false;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.SHOW_ARROW] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerShowArrow;
