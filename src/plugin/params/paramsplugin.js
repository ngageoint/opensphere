goog.module('plugin.params.ParamsPlugin');

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const params = goog.require('plugin.params');
const menu = goog.require('plugin.params.menu');


/**
 * Allow changing request parameters for layers in opensphere
 */
class ParamsPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.id = params.ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    menu.layerDispose();
  }

  /**
   * @inheritDoc
   */
  init() {
    menu.layerSetup();
  }

  /**
   * Get the global instance.
   * @return {!ParamsPlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new ParamsPlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ParamsPlugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {ParamsPlugin|undefined}
 */
let instance;

exports = ParamsPlugin;
