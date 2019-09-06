goog.provide('os.command.AbstractStyle');

goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.layer.PropertyChange');



/**
 * Commands for style changes should extend this class
 *
 * @abstract
 * @implements {os.command.ICommand}
 * @param {string} layerId
 * @param {T} value
 * @param {T=} opt_oldValue
 * @constructor
 * @template T
 */
os.command.AbstractStyle = function(layerId, value, opt_oldValue) {
  this.isAsync = false;
  this.title = 'Change Style';
  this.details = null;
  this.state = os.command.State.READY;

  /**
   * @type {string}
   * @protected
   */
  this.layerId = layerId;

  /**
   * @type {T}
   * @protected
   */
  this.oldValue = opt_oldValue != null ? opt_oldValue : this.getOldValue();

  /**
   * @type {T}
   * @protected
   */
  this.value = value;

  /**
   * @type {?string}
   * @protected
   */
  this.metricKey = null;
};


/**
 * @inheritDoc
 */
os.command.AbstractStyle.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    this.setValue(this.value);

    if (this.metricKey) {
      os.metrics.Metrics.getInstance().updateMetric(this.metricKey, 1);
    }

    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.command.AbstractStyle.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  this.setValue(this.oldValue);
  this.state = os.command.State.READY;
  return true;
};


/**
 * Checks if the command is ready to execute.
 *
 * @return {boolean}
 */
os.command.AbstractStyle.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.layerId) {
    this.state = os.command.State.ERROR;
    this.details = 'Layer ID not provided.';
    return false;
  }

  if (this.value === undefined) {
    this.state = os.command.State.ERROR;
    this.details = 'Value not provided';
    return false;
  }

  return true;
};


/**
 * Gets the old value
 *
 * @abstract
 * @return {T} the old value
 * @protected
 */
os.command.AbstractStyle.prototype.getOldValue = function() {};


/**
 * Applies a value to the style config
 *
 * @abstract
 * @param {Object} config The style config
 * @param {T} value The value to apply
 */
os.command.AbstractStyle.prototype.applyValue = function(config, value) {};


/**
 * Fire events, cleanup, etc.
 *
 * @param {Object} config
 * @protected
 */
os.command.AbstractStyle.prototype.finish = function(config) {
  // intended for overriding classes - default to doing nothing
};


/**
 * Get the layer configuration.
 *
 * @param {os.layer.ILayer} layer
 * @return {Object}
 * @protected
 */
os.command.AbstractStyle.prototype.getLayerConfig = function(layer) {
  if (layer instanceof os.layer.Tile) {
    return layer.getLayerOptions();
  }

  if (layer instanceof os.layer.Vector) {
    return os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
  }

  return null;
};


/**
 * Sets the value
 *
 * @param {T} value
 */
os.command.AbstractStyle.prototype.setValue = function(value) {
  goog.asserts.assert(value !== undefined, 'style value must be defined');

  var layer = /** @type {os.layer.Vector} */ (this.getLayer());
  goog.asserts.assert(layer, 'layer must be defined');

  var config = this.getLayerConfig(layer);
  goog.asserts.assert(config, 'layer config must be defined');

  this.applyValue(config, value);
  this.finish(config);
};


/**
 * Gets the layer by ID.
 *
 * @return {os.layer.ILayer}
 */
os.command.AbstractStyle.prototype.getLayer = function() {
  return /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(this.layerId));
};
