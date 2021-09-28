goog.declareModuleId('os.config.AbstractSettingsInitializer');

import {getSettings} from './configinstance.js';
import EventType from './eventtype.js';


/**
 * Abstract class for running logic to initialize settings.  Each application should have an
 * extension of this to implement its specific needs.
 *
 * @abstract
 */
export default class AbstractSettingsInitializer {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?string}
     * @protected
     */
    this.fileUri = null;

    /**
     * @type {?string}
     * @protected
     */
    this.overridesUri = null;

    /**
     * @protected
     * @type {!Array.<string>}
     */
    this.namespace = [];
  }

  /**
   * Kick off initialization of settings and bootstrap the application.
   */
  init() {
    // IndexedDb is an async call
    Modernizr.on('indexeddb', (result) => {
      this.registerStorages();

      const settings = getSettings();
      settings.listenOnce(EventType.INITIALIZED, this.onInitialized, false, this);
      settings.init();
    });
  }

  /**
   * Register settings storages
   *
   * @abstract
   */
  registerStorages() {}

  /**
   * Handle settings finished initialization
   *
   * @protected
   */
  onInitialized() {
    const settings = getSettings();
    settings.listenOnce(EventType.LOADED, this.onSettingsLoaded, false, this);
    settings.load();
  }

  /**
   * Handle settings finished loading
   *
   * @abstract
   * @protected
   */
  onSettingsLoaded() {}

  /**
   * Set the URI for file-based settings.
   * @param {string} value The URI.
   */
  setFileUri(value) {
    this.fileUri = value;
  }
}
