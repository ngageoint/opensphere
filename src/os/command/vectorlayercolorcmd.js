goog.module('os.command.VectorLayerColor');
goog.module.declareLegacyNamespace();

const osColor = goog.require('os.color');
const AbstractVectorStyle = goog.require('os.command.AbstractVectorStyle');
const ColorChangeType = goog.require('os.command.style.ColorChangeType');
const OSDataManager = goog.require('os.data.OSDataManager');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {getMapContainer} = goog.require('os.map.instance');
const metrics = goog.require('os.metrics');
const PropertyChange = goog.require('os.source.PropertyChange');
const VectorSource = goog.require('os.source.Vector');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleManager = goog.require('os.style.StyleManager');
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
   * @param {ColorChangeType=} opt_changeMode
   */
  constructor(layerId, color, opt_oldColor, opt_changeMode) {
    super(layerId, color, opt_oldColor);

    /**
     * The color change mode. Determines how the config color is set.
     * @type {ColorChangeType|undefined}
     * @protected
     */
    this.changeMode = opt_changeMode;

    // AbstractVectorStyle may set the old value too early (if we have opt_changeMode come in)
    this.oldValue = opt_oldColor || this.getOldValue();

    if (this.changeMode === ColorChangeType.FILL) {
      this.title = 'Change Layer Fill Color';
      this.metricKey = metrics.Layer.VECTOR_FILL_COLOR;
    } else {
      this.title = 'Change Layer Color';
      this.metricKey = metrics.Layer.VECTOR_COLOR;
    }

    if (!color) {
      var layer = /** @type {os.layer.Vector} */ (getMapContainer().getLayer(this.layerId));
      if (layer) {
        var options = layer.getLayerOptions();
        color = /** @type {string} */ (options && options['baseColor'] || osStyle.DEFAULT_LAYER_COLOR);
      } else {
        color = osStyle.DEFAULT_LAYER_COLOR;
      }
    }

    // when changing the fill, preserve the old alpha value
    if (this.changeMode === ColorChangeType.FILL) {
      var config = StyleManager.getInstance().getLayerConfig(this.layerId);
      if (config) {
        var currentFill = osStyle.getConfigColor(config, true, StyleField.FILL);
        var currentFillAlpha = currentFill && currentFill.length === 4 ? currentFill[3] : osStyle.DEFAULT_FILL_ALPHA;

        color = osColor.toRgbArray(color);
        color[3] = currentFillAlpha;
      }
    }

    // make sure the value is a string
    this.value = osStyle.toRgbaString(color);
  }

  /**
   * @inheritDoc
   */
  getOldValue() {
    var config = StyleManager.getInstance().getLayerConfig(this.layerId);

    var ret;
    if (this.changeMode === ColorChangeType.FILL) {
      ret = config ? osStyle.getConfigColor(config, false, StyleField.FILL) : osStyle.DEFAULT_FILL_COLOR;
    } else {
      ret = config ? osStyle.getConfigColor(config) : osStyle.DEFAULT_LAYER_COLOR;
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    if (this.changeMode === ColorChangeType.FILL) {
      osStyle.setFillColor(config, value);
    } else {
      // preserve the original fill color so the opacity isn't changed
      var fillColor = osStyle.getConfigColor(config, false, StyleField.FILL);

      // update the config color
      osStyle.setConfigColor(config, value);

      // restore the fill color
      osStyle.setFillColor(config, fillColor);

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

    if (source instanceof VectorSource) {
      // a color change on the layer should clear any color model on the source
      source.setColorModel(null);
    }

    super.finish(config);
  }
}

exports = VectorLayerColor;
