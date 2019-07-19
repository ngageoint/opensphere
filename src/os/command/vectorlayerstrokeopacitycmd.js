goog.provide('os.command.VectorLayerStrokeOpacity');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.ui');



/**
 * Changes the stroke opacity of a feature
 * @extends {os.command.AbstractVectorStyle}
 * @param {string} layerId
 * @param {number} opacity
 * @param {number=} opt_oldOpacity
 * @constructor
 */
os.command.VectorLayerStrokeOpacity = function(layerId, opacity, opt_oldOpacity) {
  os.command.VectorLayerStrokeOpacity.base(this, 'constructor', layerId, opacity, opt_oldOpacity);
  this.title = 'Change Stroke Opacity';
  this.metricKey = os.metrics.Layer.VECTOR_STROKE_OPACITY;

  this.value = opacity;
};
goog.inherits(os.command.VectorLayerStrokeOpacity, os.command.AbstractVectorStyle);


/**
 * @type {number}
 * @const
 */
os.command.VectorLayerStrokeOpacity.DEFAULT_OPACITY = 1;


/**
 * @inheritDoc
 */
os.command.VectorLayerStrokeOpacity.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config ? os.style.getConfigOpacityColor(config) : os.command.VectorLayerStrokeOpacity.DEFAULT_OPACITY;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerStrokeOpacity.prototype.applyValue = function(config, value) {
  var color = os.style.getConfigColor(config, true, os.style.StyleField.IMAGE);
  color[3] = value;

  var colorString = os.style.toRgbaString(color);
  os.style.setConfigColor(config, colorString, [os.style.StyleField.IMAGE, os.style.StyleField.STROKE]);

  os.ui.adjustIconSet(this.layerId, color);

  os.command.VectorLayerStrokeOpacity.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerStrokeOpacity.prototype.finish = function(config) {
  // dispatch the color change event on the source for the histogram
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLOR, this.value));

  os.command.VectorLayerStrokeOpacity.base(this, 'finish', config);
};
