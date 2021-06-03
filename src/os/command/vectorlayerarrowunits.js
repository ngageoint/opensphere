goog.module('os.command.VectorLayerArrowUnits');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes the lob length units
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerArrowUnits extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change arrow units';
    this.value = value || os.style.DEFAULT_UNITS;
    this.metricKey = metrics.Layer.VECTOR_ARROW_UNITS;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[os.style.StyleField.ARROW_UNITS] || os.style.DEFAULT_UNITS;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.ARROW_UNITS] = value;

    super.applyValue(config, value);
  }
}

exports = VectorLayerArrowUnits;
