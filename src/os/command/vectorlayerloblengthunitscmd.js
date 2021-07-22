goog.module('os.command.VectorLayerLOBLengthUnits');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the lob length units
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerLOBLengthUnits extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change length units';
    this.value = value || osStyle.DEFAULT_UNITS;
    this.metricKey = LayerKeys.VECTOR_LOB_LENGTH_UNITS;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_LENGTH_UNITS] || osStyle.DEFAULT_UNITS;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_LENGTH_UNITS] = value;

    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBLengthUnits;
