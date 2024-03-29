goog.declareModuleId('plugin.params.ParamsPlugin');

import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import * as params from './params.js';
import * as menu from './paramsmenu.js';

/**
 * Allow changing request parameters for layers in opensphere
 */
export default class ParamsPlugin extends AbstractPlugin {
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
