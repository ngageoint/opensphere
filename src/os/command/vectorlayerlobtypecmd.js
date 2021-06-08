goog.module('os.command.VectorLayerLOBType');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the lob length type
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerLOBType extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing length type (manual or column)';
    this.value = value || osStyle.DEFAULT_LOB_LENGTH_TYPE;
    this.metricKey = metrics.Layer.VECTOR_LOB_LENGTH_TYPE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LOB_LENGTH_TYPE] || osStyle.DEFAULT_LOB_LENGTH_TYPE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LOB_LENGTH_TYPE] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerLOBType;
