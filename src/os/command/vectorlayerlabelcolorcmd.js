goog.module('os.command.VectorLayerLabelColor');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const metrics = goog.require('os.metrics');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the label color for a layer
 *
 * @extends {AbstractVectorStyle<string>}
 */
class VectorLayerLabelColor extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} value
   * @param {string=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.title = 'Change Label Color';
    this.metricKey = metrics.Layer.LABEL_COLOR;
    // make sure the value is an rgba string, not hex
    if (value != '') {
      this.value = osStyle.toRgbaString(value);
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return config && config[StyleField.LABEL_COLOR] || '';
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    config[StyleField.LABEL_COLOR] = value;

    super.applyValue(config, value);
  }
}

exports = VectorLayerLabelColor;
