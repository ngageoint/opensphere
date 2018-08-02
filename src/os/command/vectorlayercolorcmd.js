goog.provide('os.command.VectorLayerColor');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');
goog.require('os.ui');



/**
 * Changes the color of a layer
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {Array<number>|string} color
 * @param {(Array<number>|string)=} opt_oldColor
 * @constructor
 */
os.command.VectorLayerColor = function(layerId, color, opt_oldColor) {
  os.command.VectorLayerColor.base(this, 'constructor', layerId, color, opt_oldColor);
  this.title = 'Change Color';
  this.metricKey = os.metrics.Layer.VECTOR_COLOR;

  if (!color) {
    var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId));
    if (layer) {
      var options = layer.getLayerOptions();
      color = /** @type {string} */ (options && options['baseColor'] || os.command.VectorLayerColor.DEFAULT_COLOR);
    }
  }

  // make sure the value is a string
  this.value = os.style.toRgbaString(color);
};
goog.inherits(os.command.VectorLayerColor, os.command.AbstractVectorStyle);


/**
 * @type {string}
 * @const
 */
os.command.VectorLayerColor.DEFAULT_COLOR = 'rgba(255,255,255,1)';


/**
 * @inheritDoc
 */
os.command.VectorLayerColor.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? os.style.getConfigColor(config) : os.command.VectorLayerColor.DEFAULT_COLOR;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerColor.prototype.applyValue = function(config, value) {
  var color = os.style.toRgbaString(/** @type {string} */ (value));
  os.style.setConfigColor(config, color);
  os.ui.adjustIconSet(this.layerId, color);

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
