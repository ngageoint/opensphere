goog.module('os.command.AbstractStyle');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const State = goog.require('os.command.State');
const instanceOf = goog.require('os.instanceOf');
const LayerClass = goog.require('os.layer.LayerClass');
const {getMapContainer} = goog.require('os.map.instance');
const Metrics = goog.require('os.metrics.Metrics');
const StyleManager = goog.require('os.style.StyleManager');

const ICommand = goog.requireType('os.command.ICommand');
const ILayer = goog.requireType('os.layer.ILayer');
const TileLayer = goog.requireType('os.layer.Tile');
const VectorLayer = goog.requireType('os.layer.Vector');


/**
 * Commands for style changes should extend this class
 *
 * @abstract
 * @implements {ICommand}
 * @template T
 */
class AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {T} value
   * @param {T=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
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
    this.title = 'Change Style';

    /**
     * @type {string}
     * @protected
     */
    this.layerId = layerId;

    /**
     * @type {T}
     * @protected
     */
    this.oldValue = opt_oldValue;

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
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      this.setValue(this.value);

      if (this.metricKey) {
        Metrics.getInstance().updateMetric(this.metricKey, 1);
      }

      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    this.setValue(this.oldValue);
    this.state = State.READY;
    return true;
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

    if (!this.layerId) {
      this.state = State.ERROR;
      this.details = 'Layer ID not provided.';
      return false;
    }

    if (this.value === undefined) {
      this.state = State.ERROR;
      this.details = 'Value not provided';
      return false;
    }

    return true;
  }

  /**
   * Gets the old value
   *
   * @return {T} the old value
   * @protected
   */
  getOldValue() {
    return null;
  }

  /**
   * Update the old value on the command, if currently unset. Call this during initialization if the command sets class
   * properties in the constructor that are required by getOldValue.
   * @protected
   */
  updateOldValue() {
    if (this.oldValue == null) {
      this.oldValue = this.getOldValue();
    }
  }

  /**
   * Applies a value to the style config
   *
   * @param {Object} config The style config
   * @param {T} value The value to apply
   */
  applyValue(config, value) {}

  /**
   * Fire events, cleanup, etc.
   *
   * @param {Object} config
   * @protected
   */
  finish(config) {
    // intended for overriding classes - default to doing nothing
  }

  /**
   * Get the layer configuration.
   *
   * @param {ILayer} layer
   * @return {Object}
   * @protected
   */
  getLayerConfig(layer) {
    if (instanceOf(layer, LayerClass.TILE)) {
      return /** @type {TileLayer} */ (layer).getLayerOptions();
    }

    if (instanceOf(layer, LayerClass.VECTOR)) {
      return StyleManager.getInstance().getLayerConfig(/** @type {VectorLayer} */ (layer).getId());
    }

    return null;
  }

  /**
   * Sets the value
   *
   * @param {T} value
   */
  setValue(value) {
    asserts.assert(value != null, 'style value must be defined');

    var layer = /** @type {os.layer.Vector} */ (this.getLayer());
    asserts.assert(layer, 'layer must be defined');

    var config = this.getLayerConfig(layer);
    asserts.assert(config, 'layer config must be defined');

    this.applyValue(config, value);
    this.finish(config);
  }

  /**
   * Gets the layer by ID.
   *
   * @return {ILayer}
   */
  getLayer() {
    const map = getMapContainer();
    return map ? /** @type {ILayer} */ (map.getLayer(this.layerId)) : null;
  }
}

exports = AbstractStyle;
