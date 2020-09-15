goog.module('os.ogc.services');

const Registry = goog.require('os.data.Registry');


/**
 * @type {Registry<?>}
 */
let instance;

/**
 * Lookup for Typed OGCServices
 */
class Services extends Registry {
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

exports = Services;
