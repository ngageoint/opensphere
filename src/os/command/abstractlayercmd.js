goog.module('os.command.AbstractLayer');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const Layer = goog.require('ol.layer.Layer');
const State = goog.require('os.command.State');
const osLayer = goog.require('os.layer');
const Metrics = goog.require('os.metrics.Metrics');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract command for adding/removing layers from the map.
 *
 * This should only be used for layers that do not have a descriptor. Layers will a synchronized descriptor should use
 * {@link os.data.AbstractDescriptor} instead.
 *
 * @abstract
 * @implements {ICommand}
 */
class AbstractLayer extends Disposable {
  /**
   * Constructor.
   * @param {(Object<string, *>)=} opt_options The configuration for the map layer.
   */
  constructor(opt_options) {
    super();

    /**
     * The details of the command.
     * @type {?string}
     */
    this.details = null;

    /**
     * Whether or not the command is asynchronous.
     * @type {boolean}
     */
    this.isAsync = false;

    /**
     * Return the current state of the command.
     * @type {!State}
     */
    this.state = State.READY;

    /**
     * The title of the command.
     * @type {?string}
     */
    this.title = 'Add/Remove Layer';

    /**
     * The configuration for the map layer.
     * @type {Object<string, *>}
     */
    this.layerOptions = opt_options || null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.layerOptions = null;
  }

  /**
   * Checks if the command is ready to execute.
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    if (!this.layerOptions || goog.object.isEmpty(this.layerOptions)) {
      this.state = State.ERROR;
      this.details = 'Layer configuration not provided.';
      return false;
    }

    if (!('id' in this.layerOptions)) {
      this.state = State.ERROR;
      this.details = 'Field "id" must be provided in layer configuration.';
      return false;
    }

    if (!('type' in this.layerOptions)) {
      this.state = State.ERROR;
      this.details = 'Field "type" must be provided in layer configuration.';
      return false;
    }

    return true;
  }

  /**
   * Adds the layer to the map.
   *
   * @param {Object<string, *>} options
   * @return {boolean} If the add succeeded or not.
   */
  add(options) {
    if (!options) {
      this.state = State.ERROR;
      this.details = 'Layer configuration not provided.';
      return false;
    }

    var layer = osLayer.createFromOptions(options);
    if (layer instanceof Layer) {
      // don't add duplicate layers to the map. this may happen for legit reasons. one example is a single layer from
      // a state file being removed, the whole state file being removed, then undo both removes.
      if (!os.MapContainer.getInstance().getLayer(layer.getId())) {
        os.MapContainer.getInstance().addLayer(/** @type {!Layer} */ (layer));
        Metrics.getInstance().updateMetric(os.metrics.keys.AddData.ADD_LAYER_COMMAND, 1);
        return true;
      }

      this.state = State.ERROR;
      this.details = 'Layer already on the map: ' + layer.getTitle();
      return false;
    }

    this.state = State.ERROR;
    this.details = 'Unable to create layer.';
    return false;
  }

  /**
   * Removes the layer from the map.
   *
   * @param {Object<string, *>} options
   * @return {boolean} If the remove succeeded or not.
   */
  remove(options) {
    if (!options || !options['id']) {
      this.state = State.ERROR;
      this.details = 'Layer configuration not provided.';
      return false;
    }

    os.MapContainer.getInstance().removeLayer(/** @type {string} */ (options['id']));
    Metrics.getInstance().updateMetric(os.metrics.keys.AddData.REMOVE_LAYER_COMMAND, 1);
    return true;
  }
}

exports = AbstractLayer;
