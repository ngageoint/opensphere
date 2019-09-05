goog.provide('os.command.VectorLayerColor');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.command.style');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');



/**
 * Changes the color of a layer
 *
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {Array<number>|string} color
 * @param {(Array<number>|string)=} opt_oldColor
 * @param {os.command.style.ColorChangeType=} opt_changeMode
 * @constructor
 */
os.command.VectorLayerColor = function(layerId, color, opt_oldColor, opt_changeMode) {
  /**
   * The color change mode. Determines how the config color is set.
   * @type {os.command.style.ColorChangeType|undefined}
   * @protected
   */
  this.changeMode = opt_changeMode;

  // intentionally called after changeMode is set so getOldValue has the correct value
  os.command.VectorLayerColor.base(this, 'constructor', layerId, color, opt_oldColor);

  if (this.changeMode === os.command.style.ColorChangeType.FILL) {
    this.title = 'Change Layer Fill Color';
    this.metricKey = os.metrics.Layer.VECTOR_FILL_COLOR;
  } else {
    this.title = 'Change Layer Color';
    this.metricKey = os.metrics.Layer.VECTOR_COLOR;
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
  if (this.changeMode === os.command.style.ColorChangeType.FILL) {
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
};
goog.inherits(os.command.VectorLayerColor, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerColor.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);

  var ret;
  if (this.changeMode === os.command.style.ColorChangeType.FILL) {
    ret = config ? os.style.getConfigColor(config, false, os.style.StyleField.FILL) : os.style.DEFAULT_FILL_COLOR;
  } else {
    ret = config ? os.style.getConfigColor(config) : os.style.DEFAULT_LAYER_COLOR;
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerColor.prototype.applyValue = function(config, value) {
  if (this.changeMode === os.command.style.ColorChangeType.FILL) {
    os.style.setFillColor(config, value);
  } else {
    // preserve the original fill color so the opacity isn't changed
    var fillColor = os.style.getConfigColor(config, false, os.style.StyleField.FILL);

    // update the config color
    os.style.setConfigColor(config, value);

    // restore the fill color
    os.style.setFillColor(config, fillColor);

    // update the layer icons to reflect the color change
    os.ui.adjustIconSet(this.layerId, value);
  }

  os.command.VectorLayerColor.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerColor.prototype.finish = function(config) {
  // dispatch the color change event on the source for the histogram
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLOR, this.value));

  if (source instanceof os.source.Vector) {
    // a color change on the layer should clear any color model on the source
    source.setColorModel(null);
  }

  os.command.VectorLayerColor.base(this, 'finish', config);
};
