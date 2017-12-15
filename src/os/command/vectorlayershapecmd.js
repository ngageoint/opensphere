goog.provide('os.command.VectorLayerShape');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');
goog.require('os.ui.file.kml');



/**
 * Changes the style of a layer
 * @extends {os.command.AbstractVectorStyle<string>}
 * @param {string} layerId
 * @param {string} style
 * @param {string=} opt_oldStyle
 * @constructor
 */
os.command.VectorLayerShape = function(layerId, style, opt_oldStyle) {
  os.command.VectorLayerShape.base(this, 'constructor', layerId, style, opt_oldStyle);
  this.title = 'Change Style';

  var type = style ? style.replace(/ /g, '_') : 'Unknown';
  this.metricKey = os.metrics.Layer.VECTOR_SHAPE + os.metrics.SUB_DELIMITER + type;
};
goog.inherits(os.command.VectorLayerShape, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerShape.prototype.getOldValue = function() {
  var oldVal;
  var source = os.osDataManager.getSource(this.layerId);
  if (source) {
    oldVal = source.getGeometryShape();
  }

  return oldVal || os.style.DEFAULT_SHAPE;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShape.prototype.applyValue = function(config, value) {
  // if the new shape value isn't defined, config will be set to the default value
  var source = os.osDataManager.getSource(this.layerId);
  if (source && value) {
    source.setGeometryShape(value);

    // if using the icon shape, make sure the config has an icon defined
    if (value == os.style.ShapeType.ICON && !os.style.getConfigIcon(config)) {
      os.style.setConfigIcon(config, os.ui.file.kml.getDefaultIcon());
    }
  }

  os.command.VectorLayerShape.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShape.prototype.finish = function(config) {
  var source = os.osDataManager.getSource(this.layerId);
  source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.GEOMETRY_SHAPE, this.value,
      this.oldValue));

  os.command.VectorLayerShape.base(this, 'finish', config);
};
