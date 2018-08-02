goog.provide('os.config.AbstractSettingsInitializer');
goog.require('goog.Uri');
goog.require('os.config.Settings');



/**
 * Abstract class for running logic to initialize settings.  Each application should have an
 * extension of this to implement its specific needs.
 * @constructor
 */
os.config.AbstractSettingsInitializer = function() {
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
};


/**
 * Kick off initialization of settings and bootstrap the application.
 */
os.config.AbstractSettingsInitializer.prototype.init = function() {
  this.registerStorages();
  os.settings.listenOnce(os.config.EventType.INITIALIZED, this.onInitialized, false, this);
  os.settings.init();
};


/**
 * Register settings storages
 */
os.config.AbstractSettingsInitializer.prototype.registerStorages = goog.abstractMethod;


/**
 * Handle settings finished initialization
 * @protected
 */
os.config.AbstractSettingsInitializer.prototype.onInitialized = function() {
  os.settings.listenOnce(os.config.EventType.LOADED, this.onSettingsLoaded, false, this);
  os.settings.load();
};


/**
 * Handle settings finished loading
 * @protected
 */
os.config.AbstractSettingsInitializer.prototype.onSettingsLoaded = goog.abstractMethod;
