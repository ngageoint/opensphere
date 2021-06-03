goog.module('os.command.VectorLayerFillOpacity');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const metrics = goog.require('os.metrics');


/**
 * Changes the fill opacity of a vector layer.
 */
class VectorLayerFillOpacity extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId The layer id.
   * @param {number} opacity The new fill opacity value.
   * @param {number|null=} opt_oldOpacity The old fill opacity value.
   */
  constructor(layerId, opacity, opt_oldOpacity) {
    super(layerId, opacity, opt_oldOpacity);
    this.title = 'Change Layer Fill Opacity';
    this.metricKey = metrics.Layer.VECTOR_FILL_OPACITY;

    if (this.value == null) {
      this.value = os.style.DEFAULT_FILL_ALPHA;
    }
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
    var color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
    return color && color.length === 4 ? color[3] : os.style.DEFAULT_FILL_ALPHA;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var color = os.style.getConfigColor(config, true, os.style.StyleField.FILL) ||
        os.style.getConfigColor(config, true);

    if (color) {
      color[3] = value;

      var colorString = os.style.toRgbaString(color);
      os.style.setFillColor(config, colorString);
    }

    super.applyValue(config, value);
  }
}

exports = VectorLayerFillOpacity;
