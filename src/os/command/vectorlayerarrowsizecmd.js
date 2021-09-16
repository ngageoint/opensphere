goog.module('os.command.VectorLayerArrowSize');

const AbstractVectorLayerLOB = goog.require('os.command.AbstractVectorLayerLOB');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the arrow size for a lob
 *
 * @extends {AbstractVectorLayerLOB<number>}
 */
class VectorLayerArrowSize extends AbstractVectorLayerLOB {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Line of Bearing arrow size';
    this.value = value;
    this.metricKey = LayerKeys.VECTOR_ARROW_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[StyleField.ARROW_SIZE] : osStyle.DEFAULT_ARROW_SIZE;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.ARROW_SIZE] = value;
    super.applyValue(config, value);
  }
}

exports = VectorLayerArrowSize;
