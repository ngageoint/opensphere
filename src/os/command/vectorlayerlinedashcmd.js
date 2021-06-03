goog.module('os.command.VectorLayerLineDash');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const metrics = goog.require('os.metrics');


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
    this.metricKey = metrics.Layer.VECTOR_LINE_DASH;
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    return os.style.getConfigLineDash(config);
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var lineDash = /** @type {Array<number>} */ (value);
    os.style.setConfigLineDash(config, lineDash);

    super.applyValue(config, value);
  }
}

exports = VectorLayerLineDash;
