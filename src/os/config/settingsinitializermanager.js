goog.provide('os.config.SettingsInitializerManager');
goog.require('os.config.SettingsInitializer');



/**
 * Initialize settings for OpenSphere.
 * @constructor
 */
os.config.SettingsInitializerManager = function() {
  /**
   * The default settings initializer
   * @type {os.ui.config.AngularAppSettingsInitializer}
   */
  this.currentInitializer_ = new os.config.SettingsInitializer();
};
goog.addSingletonGetter(os.config.SettingsInitializerManager);


/**
 * Set a new current settings initializer
 * @param {os.ui.config.AngularAppSettingsInitializer} initializer
 */
os.config.SettingsInitializerManager.prototype.setSettingsInitializer = function(initializer) {
  this.currentInitializer_ = initializer;
};


/**
 * Get the current settings initializer
 * @return {os.ui.config.AngularAppSettingsInitializer}
 */
os.config.SettingsInitializerManager.prototype.getSettingsInitializer = function() {
  return this.currentInitializer_;
};
