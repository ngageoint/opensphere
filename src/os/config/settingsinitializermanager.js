goog.module('os.config.SettingsInitializerManager');

const SettingsInitializer = goog.require('os.config.SettingsInitializer');

const AngularAppSettingsInitializer = goog.requireType('os.ui.config.AngularAppSettingsInitializer');


/**
 * Initialize settings for OpenSphere.
 */
class SettingsInitializerManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * The default settings initializer
     * @type {AngularAppSettingsInitializer}
     */
    this.currentInitializer_ = new SettingsInitializer();
  }

  /**
   * Set a new current settings initializer
   * @param {AngularAppSettingsInitializer} initializer
   */
  setSettingsInitializer(initializer) {
    this.currentInitializer_ = initializer;
  }

  /**
   * Get the current settings initializer
   * @return {AngularAppSettingsInitializer}
   */
  getSettingsInitializer() {
    return this.currentInitializer_;
  }

  /**
   * Get the global instance.
   * @return {!SettingsInitializerManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new SettingsInitializerManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SettingsInitializerManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {SettingsInitializerManager|undefined}
 */
let instance;

exports = SettingsInitializerManager;
