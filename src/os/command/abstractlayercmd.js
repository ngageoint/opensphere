goog.declareModuleId('os.command.AbstractLayer');

import Layer from 'ol/src/layer/Layer.js';

import * as osLayer from '../layer/layer.js';
import {getMapContainer} from '../map/mapinstance.js';
import Metrics from '../metrics/metrics.js';
import * as keys from '../metrics/metricskeys.js';
import State from './state.js';

const Disposable = goog.require('goog.Disposable');
const googObject = goog.require('goog.object');

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Abstract command for adding/removing layers from the map.
 *
 * This should only be used for layers that do not have a descriptor. Layers will a synchronized descriptor should use
 * {@link os.data.AbstractDescriptor} instead.
 *
 * @abstract
 * @implements {ICommand}
 */
export default class AbstractLayer extends Disposable {
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

    if (!this.layerOptions || googObject.isEmpty(this.layerOptions)) {
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

    const map = getMapContainer();
    if (!map) {
      this.state = State.ERROR;
      this.details = 'Map container not available.';
      return false;
    }

    var layer = osLayer.createFromOptions(options);
    if (layer instanceof Layer) {
      // don't add duplicate layers to the map. this may happen for legit reasons. one example is a single layer from
      // a state file being removed, the whole state file being removed, then undo both removes.
      if (!map.getLayer(layer.getId())) {
        map.addLayer(/** @type {!Layer} */ (layer));
        Metrics.getInstance().updateMetric(keys.AddData.ADD_LAYER_COMMAND, 1);
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

    const map = getMapContainer();
    if (!map) {
      this.state = State.ERROR;
      this.details = 'Map container not available.';
      return false;
    }

    map.removeLayer(/** @type {string} */ (options['id']));
    Metrics.getInstance().updateMetric(keys.AddData.REMOVE_LAYER_COMMAND, 1);
    return true;
  }
}
