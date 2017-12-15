goog.provide('os.command.VectorLayerShowEllipsoids');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');



/**
 * Changes if ellipsoids are shown in 3D mode.
 * @param {string} layerId
 * @param {boolean} value
 * @param {boolean=} opt_oldValue
 * @extends {os.command.AbstractVectorStyle}
 * @constructor
 */
os.command.VectorLayerShowEllipsoids = function(layerId, value, opt_oldValue) {
  os.command.VectorLayerShowEllipsoids.base(this, 'constructor', layerId, value, opt_oldValue);
  this.metricKey = os.metrics.Layer.VECTOR_ELLIPSOID;

  // make sure the value is a boolean
  this.value = !!value;
  this.title = value ? 'Enable Ellipsoids' : 'Disable Ellipsoids';
};
goog.inherits(os.command.VectorLayerShowEllipsoids, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorLayerShowEllipsoids.prototype.getOldValue = function() {
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.layerId);
  return config != null && config[os.style.StyleField.SHOW_ELLIPSOIDS] || false;
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowEllipsoids.prototype.applyValue = function(config, value) {
  config[os.style.StyleField.SHOW_ELLIPSOIDS] = value;
  os.command.VectorLayerShowEllipsoids.base(this, 'applyValue', config, value);
};


/**
 * @inheritDoc
 */
os.command.VectorLayerShowEllipsoids.prototype.finish = function(config) {
  var source = os.osDataManager.getSource(this.layerId);
  if (source) {
    var shape = source.getGeometryShape();
    source.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.GEOMETRY_SHAPE, shape));
  }

  os.command.VectorLayerShowEllipsoids.base(this, 'finish', config);
};
