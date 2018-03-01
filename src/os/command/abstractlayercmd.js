goog.provide('os.command.AbstractLayer');

goog.require('goog.Disposable');
goog.require('ol.layer.Layer');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.layer');
goog.require('os.map');
goog.require('os.metrics.Metrics');



/**
 * Abstract command for adding/removing layers from the map.
 *
 * This should only be used for layers that do not have a descriptor. Layers will a synchronized descriptor should use
 * {@link os.data.AbstractDescriptor} instead.
 *
 * @param {(Object<string, *>)=} opt_options The configuration for the map layer.
 * @implements {os.command.ICommand}
 * @extends {goog.Disposable}
 * @constructor
 */
os.command.AbstractLayer = function(opt_options) {
  os.command.AbstractLayer.base(this, 'constructor');
  this.details = null;
  this.isAsync = false;
  this.state = os.command.State.READY;
  this.title = 'Add/Remove Layer';

  /**
   * The configuration for the map layer.
   * @type {Object<string, *>}
   */
  this.layerOptions = opt_options || null;
};
goog.inherits(os.command.AbstractLayer, goog.Disposable);


/**
 * @inheritDoc
 */
os.command.AbstractLayer.prototype.disposeInternal = function() {
  os.command.AbstractLayer.base(this, 'disposeInternal');
  this.layerOptions = null;
};


/**
 * @inheritDoc
 */
os.command.AbstractLayer.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.command.AbstractLayer.prototype.revert = goog.abstractMethod;


/**
 * Checks if the command is ready to execute.
 * @return {boolean}
 */
os.command.AbstractLayer.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.layerOptions || goog.object.isEmpty(this.layerOptions)) {
    this.state = os.command.State.ERROR;
    this.details = 'Layer configuration not provided.';
    return false;
  }

  if (!('id' in this.layerOptions)) {
    this.state = os.command.State.ERROR;
    this.details = 'Field "id" must be provided in layer configuration.';
    return false;
  }

  if (!('type' in this.layerOptions)) {
    this.state = os.command.State.ERROR;
    this.details = 'Field "type" must be provided in layer configuration.';
    return false;
  }

  return true;
};


/**
 * Adds the layer to the map.
 * @param {Object<string, *>} options
 * @return {boolean} If the add succeeded or not.
 */
os.command.AbstractLayer.prototype.add = function(options) {
  if (!options) {
    this.state = os.command.State.ERROR;
    this.details = 'Layer configuration not provided.';
    return false;
  }

  if (!os.map.mapContainer) {
    this.state = os.command.State.ERROR;
    this.details = 'Map container has not been set.';
    return false;
  }

  var layer = os.layer.createFromOptions(options);
  if (layer instanceof ol.layer.Layer) {
    // don't add duplicate layers to the map. this may happen for legit reasons. one example is a single layer from
    // a state file being removed, the whole state file being removed, then undo both removes.
    if (!os.map.mapContainer.getLayer(layer.getId())) {
      os.map.mapContainer.addLayer(/** @type {!ol.layer.Layer} */ (layer));
      os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.ADD_LAYER_COMMAND, 1);
      return true;
    }

    this.state = os.command.State.ERROR;
    this.details = 'Layer already on the map: ' + layer.getTitle();
    return false;
  }

  this.state = os.command.State.ERROR;
  this.details = 'Unable to create layer.';
  return false;
};


/**
 * Removes the layer from the map.
 * @param {Object<string, *>} options
 * @return {boolean} If the remove succeeded or not.
 */
os.command.AbstractLayer.prototype.remove = function(options) {
  if (!options || !options['id']) {
    this.state = os.command.State.ERROR;
    this.details = 'Layer configuration not provided.';
    return false;
  }

  if (!os.map.mapContainer) {
    this.state = os.command.State.ERROR;
    this.details = 'Map container has not been set.';
    return false;
  }

  os.map.mapContainer.removeLayer(/** @type {string} */ (options['id']));
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.REMOVE_LAYER_COMMAND, 1);
  return true;
};
