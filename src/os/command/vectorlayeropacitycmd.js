goog.provide('os.command.VectorLayerOpacity');

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
 * @param {number} opacity
 * @param {number|null=} opt_oldOpacity
 * @param {os.command.style.ColorChangeType=} opt_changeMode
 * @constructor
 */
os.command.VectorLayerOpacity = function(layerId, opacity, opt_oldOpacity, opt_changeMode) {
  /**
   * The opacity change mode. Determines how the config opacity is set.
   * @type {os.command.style.ColorChangeType}
   * @protected
   */
  this.changeMode = opt_changeMode || os.command.style.ColorChangeType.COMBINED;

  os.command.VectorLayerOpacity.base(this, 'constructor', layerId, opacity, opt_oldOpacity);

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      this.title = 'Change Fill Opacity';
      this.metricKey = os.metrics.Layer.VECTOR_FILL_OPACITY;
      this.defaultOpacity = os.style.DEFAULT_FILL_ALPHA;
      break;
    case os.command.style.ColorChangeType.STROKE:
      this.title = 'Change Opacity';
      this.metricKey = os.metrics.Layer.VECTOR_OPACITY;
      this.defaultOpacity = os.style.DEFAULT_ALPHA;
      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      this.title = 'Change Opacity';
      this.metricKey = os.metrics.Layer.VECTOR_OPACITY;
      this.defaultOpacity = os.style.DEFAULT_ALPHA;
      break;
  }

  if (!opacity) {
    opacity = this.defaultOpacity;
    var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId));
    if (layer) {
      var options = layer.getLayerOptions();
      if (options && options['baseOpacity']) {
        opacity = /** @type {number} */ (options['baseOpacity']);
      }
    }
  }
};
goog.inherits(os.command.VectorLayerOpacity, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerOpacity.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  var ret = this.defaultOpacity;

  if (config) {
    var color;
    switch (this.changeMode) {
      case os.command.style.ColorChangeType.FILL:
        color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
        if (color && color.length === 4) {
          ret = color[3];
        }
        break;
      case os.command.style.ColorChangeType.STROKE:
        color = os.style.getConfigColor(config, true, os.style.StyleField.STROKE);
        if (color && color.length === 4) {
          ret = color[3];
        }
        break;
      case os.command.style.ColorChangeType.COMBINED:
      default:
        color = os.style.getConfigColor(config, true);
        if (color && color.length === 4) {
          ret = color[3];
        }
        break;
    }
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerOpacity.prototype.applyValue = function(config, value) {
  var color;
  var colorString;

  switch (this.changeMode) {
    case os.command.style.ColorChangeType.FILL:
      color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
      color[3] = value;
      colorString = os.style.toRgbaString(color);

      os.style.setFillColor(config, colorString);

      // Make sure the fill color and opacity are updated as well
      if (config['fillColor']) {
        config['fillColor'] = colorString;
      }
      if (config['fillOpacity'] !== undefined) {
        config['fillOpacity'] = value;
      }

      break;
    case os.command.style.ColorChangeType.STROKE:
      color = os.style.getConfigColor(config, true, os.style.StyleField.STROKE);
      color[3] = value;
      colorString = os.style.toRgbaString(color);

      os.style.setConfigColor(config, color);

      if (config['fillColor']) {
        os.style.setFillColor(config, config['fillColor']);
      }

      os.ui.adjustIconSet(this.layerId, color);

      break;
    case os.command.style.ColorChangeType.COMBINED:
    default:
      color = os.style.getConfigColor(config, true);
      color[3] = value;
      colorString = os.style.toRgbaString(color);

      os.style.setConfigColor(config, colorString);

      // Make sure the fill color and opacity are updated as well
      if (config['fillColor']) {
        config['fillColor'] = colorString;
      }
      if (config['fillOpacity'] !== undefined) {
        config['fillOpacity'] = value;
      }

      os.ui.adjustIconSet(this.layerId, color);

      break;
  }

  os.command.VectorLayerOpacity.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerOpacity.prototype.finish = function(config) {
  // dispatch the color change event on the source for the histogram
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLOR, this.value));

  if (source instanceof os.source.Vector) {
    // a color change on the layer should clear any color model on the source
    source.setColorModel(null);
  }

  os.command.VectorLayerOpacity.base(this, 'finish', config);
};
