goog.declareModuleId('os.ogc.services');

import Registry from '../data/registry.js';


/**
 * @type {Registry<?>}
 */
let instance;

/**
 * Lookup for Typed OGCServices
 */
export default class Services extends Registry {
  /**
   * Get the singleton of this Registry
   * @return {Registry<?>}
   */
  static getInstance() {
    if (!instance) {
      instance = new Registry();
    }
    return instance;
  }
}
