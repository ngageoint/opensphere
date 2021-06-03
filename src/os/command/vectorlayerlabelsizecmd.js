goog.module('os.command.VectorLayerLabelSize');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const metrics = goog.require('os.metrics');


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
    this.metricKey = metrics.Layer.LABEL_SIZE;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return config ? config[os.style.StyleField.LABEL_SIZE] : undefined;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[os.style.StyleField.LABEL_SIZE] = value;

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // label overlap will likely change, so update them
    os.style.label.updateShown();
    super.finish(config);
  }
}

exports = VectorLayerLabelSize;
