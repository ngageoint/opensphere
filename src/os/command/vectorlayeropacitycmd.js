goog.provide('os.command.VectorLayerOpacity');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');
goog.require('os.ui');



/**
 * Changes the color of a layer
 *
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {number} opacity
 * @param {number=} opt_oldOpacity
 * @constructor
 */
os.command.VectorLayerOpacity = function(layerId, opacity, opt_oldOpacity) {
  os.command.VectorLayerOpacity.base(this, 'constructor', layerId, opacity, opt_oldOpacity);
  this.title = 'Change Opacity';
  this.metricKey = os.metrics.Layer.VECTOR_OPACITY;

  if (!opacity) {
    opacity = os.command.VectorLayerOpacity.DEFAULT_OPACITY;
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
 * @type {number}
 * @const
 */
os.command.VectorLayerOpacity.DEFAULT_OPACITY = 1;


/**
 * @inheritDoc
 */
os.command.VectorLayerOpacity.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? os.style.getConfigColor(config) : os.command.VectorLayerOpacity.DEFAULT_OPACITY;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerOpacity.prototype.applyValue = function(config, value) {
  var color = os.style.getConfigColor(config, true);
  color[3] = value;

  var colorString = os.style.toRgbaString(color);
  os.style.setConfigColor(config, colorString);

  // Make sure the fill color and opacity are updated as well
  if (config['fillColor']) {
    config['fillColor'] = colorString;
  }
  if (config['fillOpacity'] !== undefined) {
    config['fillOpacity'] = value;
  }

  os.ui.adjustIconSet(this.layerId, color);

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
