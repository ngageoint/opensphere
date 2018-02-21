goog.provide('os.command.VectorUniqueIdCmd');

goog.require('os.command.AbstractVectorStyle');
goog.require('os.data.OSDataManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.metrics');
goog.require('os.source.PropertyChange');



/**
 * Changes the unique ID for a vector source.
 * @param {string} layerId
 * @param {os.data.ColumnDefinition} value
 * @param {os.data.ColumnDefinition=} opt_oldValue
 * @extends {os.command.AbstractVectorStyle<string>}
 * @constructor
 */
os.command.VectorUniqueIdCmd = function(layerId, value, opt_oldValue) {
  os.command.VectorUniqueIdCmd.base(this, 'constructor', layerId, value, opt_oldValue);
  this.title = 'Change Unique ID';
  this.metricKey = os.metrics.Layer.LABEL_COLUMN_SELECT;

  /**
   * @type {os.data.ColumnDefinition}
   */
  this.value = value;
};
goog.inherits(os.command.VectorUniqueIdCmd, os.command.AbstractVectorStyle);


/**
 * @inheritDoc
 */
os.command.VectorUniqueIdCmd.prototype.getOldValue = function() {
  var layer = this.getLayer();
  var source = /** @type {os.source.Vector} */ (layer.getSource());
  return source.getUniqueId();
};


/**
 * @inheritDoc
 */
os.command.VectorUniqueIdCmd.prototype.setValue = function(value) {
  var layer = /** @type {os.layer.Vector} */ (this.getLayer());
  goog.asserts.assert(layer, 'layer must be defined');

  var config = this.getLayerConfig(layer);
  goog.asserts.assert(config, 'layer config must be defined');

  this.applyValue(config, value);
  this.finish(config);
};


/**
 * @inheritDoc
 */
os.command.VectorUniqueIdCmd.prototype.applyValue = function(config, value) {
  var layer = this.getLayer();
  var source = /** @type {os.source.Vector} */ (layer.getSource());
  source.setUniqueId(value);
};
