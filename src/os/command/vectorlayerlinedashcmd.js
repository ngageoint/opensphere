goog.module('os.command.VectorLayerLineDash');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const osStyle = goog.require('os.style');
const StyleManager = goog.require('os.style.StyleManager');


/**
 * Changes the line dash of a layer
 */
class VectorLayerLineDash extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {Array<number>} lineDash
   * @param {Array<number>=} opt_oldLineDash
   */
  constructor(layerId, lineDash, opt_oldLineDash) {
    super(layerId, lineDash, opt_oldLineDash);
    this.title = 'Change LineDash';
    this.metricKey = LayerKeys.VECTOR_LINE_DASH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);
    return osStyle.getConfigLineDash(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var lineDash = /** @type {Array<number>} */ (value);
    osStyle.setConfigLineDash(config, lineDash);

    super.applyValue(config, value);
  }
}

exports = VectorLayerLineDash;
