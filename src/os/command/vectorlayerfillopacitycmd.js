goog.provide('os.command.VectorLayerFillOpacity');

goog.require('goog.asserts');
goog.require('os.command.AbstractVectorStyle');
goog.require('os.metrics');


/**
 * Changes the fill opacity of a vector layer.
 * @param {string} layerId The layer id.
 * @param {number} opacity The new fill opacity value.
 * @param {number|null=} opt_oldOpacity The old fill opacity value.
 * @extends {os.command.AbstractVectorStyle}
 * @constructor
 */
os.command.VectorLayerFillOpacity = function(layerId, opacity, opt_oldOpacity) {
  os.command.VectorLayerFillOpacity.base(this, 'constructor', layerId, opacity, opt_oldOpacity);
  this.title = 'Change Layer Fill Opacity';
  this.metricKey = os.metrics.Layer.VECTOR_FILL_OPACITY;

  if (this.value == null) {
    this.value = os.style.DEFAULT_FILL_ALPHA;
  }
};
goog.inherits(os.command.VectorLayerFillOpacity, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerFillOpacity.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  var color = os.style.getConfigColor(config, true, os.style.StyleField.FILL);
  return color && color.length === 4 ? color[3] : os.style.DEFAULT_FILL_ALPHA;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerFillOpacity.prototype.applyValue = function(config, value) {
  var color = os.style.getConfigColor(config, true, os.style.StyleField.FILL) ||
      os.style.getConfigColor(config, true);

  if (color) {
    color[3] = value;

    var colorString = os.style.toRgbaString(color);
    os.style.setFillColor(config, colorString);
  }

  os.command.VectorLayerFillOpacity.base(this, 'applyValue', config, value);
};
