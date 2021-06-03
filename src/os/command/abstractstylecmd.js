goog.module('os.command.AbstractStyle');
goog.module.declareLegacyNamespace();

const State = goog.require('os.command.State');

const ICommand = goog.requireType('os.command.ICommand');


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
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      this.setValue(this.value);

      if (this.metricKey) {
        os.metrics.Metrics.getInstance().updateMetric(this.metricKey, 1);
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
   * @param {os.layer.ILayer} layer
   * @return {Object}
   * @protected
   */
  getLayerConfig(layer) {
    if (layer instanceof os.layer.Tile) {
      return layer.getLayerOptions();
    }

    if (layer instanceof os.layer.Vector) {
      return os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
    }

    return null;
  }

  /**
   * Sets the value
   *
   * @param {T} value
   */
  setValue(value) {
    goog.asserts.assert(value != null, 'style value must be defined');

    var layer = /** @type {os.layer.Vector} */ (this.getLayer());
    goog.asserts.assert(layer, 'layer must be defined');

    var config = this.getLayerConfig(layer);
    goog.asserts.assert(config, 'layer config must be defined');

    this.applyValue(config, value);
    this.finish(config);
  }

  /**
   * Gets the layer by ID.
   *
   * @return {os.layer.ILayer}
   */
  getLayer() {
    return /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(this.layerId));
  }
}

exports = AbstractStyle;
