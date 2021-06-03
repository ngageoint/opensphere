goog.module('os.command.VectorLayerBearing');
goog.module.declareLegacyNamespace();

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const metrics = goog.require('os.metrics');


/**
 * Changes the lob bearing column
 *
 * @extends {AbstractVectorLayerLOB<string>}
 */
class VectorLayerBearing extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change bearing column';
    this.value = value || '';
    this.metricKey = metrics.Layer.VECTOR_LOB_BEARING_COLUMN;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[os.style.StyleField.LOB_BEARING_COLUMN] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.LOB_BEARING_COLUMN] = value;

    super.applyValue(config, value);
  }
}

exports = VectorLayerBearing;
