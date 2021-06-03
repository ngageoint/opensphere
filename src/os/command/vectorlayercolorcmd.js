goog.module('os.command.VectorLayerColor');
goog.module.declareLegacyNamespace();

const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const style = goog.require('os.command.style');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const icons = goog.require('os.ui.icons');


/**
 * Changes the color of a layer
 */
class VectorLayerColor extends AbstractVectorStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {Array<number>|string} color
   * @param {(Array<number>|string)=} opt_oldColor
   * @param {style.ColorChangeType=} opt_changeMode
   */
  constructor(layerId, color, opt_oldColor, opt_changeMode) {
    super(layerId, color, opt_oldColor);

    /**
     * The color change mode. Determines how the config color is set.
     * @type {style.ColorChangeType|undefined}
     * @protected
     */
    this.changeMode = opt_changeMode;
    this.updateOldValue();

    if (this.changeMode === style.ColorChangeType.FILL) {
      this.title = 'Change Layer Fill Color';
      this.metricKey = metrics.Layer.VECTOR_FILL_COLOR;
    } else {
      this.title = 'Change Layer Color';
      this.metricKey = metrics.Layer.VECTOR_COLOR;
    }

    if (!color) {
      var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId));
      if (layer) {
        var options = layer.getLayerOptions();
        color = /** @type {string} */ (options && options['baseColor'] || os.style.DEFAULT_LAYER_COLOR);
      } else {
        color = os.style.DEFAULT_LAYER_COLOR;
      }
    }

    // when changing the fill, preserve the old alpha value
    if (this.changeMode === style.ColorChangeType.FILL) {
      var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
      if (config) {
        var currentFill = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
        var currentFillAlpha = currentFill && currentFill.length === 4 ? currentFill[3] : os.style.DEFAULT_FILL_ALPHA;

        color = os.color.toRgbArray(color);
        color[3] = currentFillAlpha;
      }
    }

    // make sure the value is a string
    this.value = os.style.toRgbaString(color);
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);

    var ret;
    if (this.changeMode === style.ColorChangeType.FILL) {
      ret = config ? os.style.getConfigColor(config, false, os.style.StyleField.FILL) : os.style.DEFAULT_FILL_COLOR;
    } else {
      ret = config ? os.style.getConfigColor(config) : os.style.DEFAULT_LAYER_COLOR;
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    if (this.changeMode === style.ColorChangeType.FILL) {
      os.style.setFillColor(config, value);
    } else {
      // preserve the original fill color so the opacity isn't changed
      var fillColor = os.style.getConfigColor(config, false, os.style.StyleField.FILL);

      // update the config color
      os.style.setConfigColor(config, value);

      // restore the fill color
      os.style.setFillColor(config, fillColor);

      // update the layer icons to reflect the color change
      icons.adjustIconSet(this.layerId, value);
    }

    super.applyValue(config, value);
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    // dispatch the color change event on the source for the histogram
    var source = OSDataManager.getInstance().getSource(this.layerId);
    source.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLOR, this.value));

    if (source instanceof os.source.Vector) {
      // a color change on the layer should clear any color model on the source
      source.setColorModel(null);
    }

    super.finish(config);
  }
}

exports = VectorLayerColor;
