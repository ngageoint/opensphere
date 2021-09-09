goog.module('os.command.VectorLayerLabelSize');

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
const label = goog.require('os.style.label');


/**
 * Changes the label size for a layer
 *
 * @extends {AbstractVectorStyle<number>}
 */
class VectorLayerLabelSize extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {number} value
   * @param {number=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Label Size';
    this.metricKey = LayerKeys.LABEL_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[StyleField.LABEL_SIZE] : undefined;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LABEL_SIZE] = value;

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // label overlap will likely change, so update them
    label.updateShown();
    super.finish(config);
  }
}

exports = VectorLayerLabelSize;
