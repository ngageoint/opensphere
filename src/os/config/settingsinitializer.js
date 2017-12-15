goog.provide('os.config.SettingsInitializer');
goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsFile');
goog.require('os.config.storage.SettingsIDBStorage');
goog.require('os.config.storage.SettingsLocalStorage');
goog.require('os.defines');
goog.require('os.ui.config.AngularAppSettingsInitializer');



/**
 * Initialize settings for OpenSphere.
 * @extends {os.ui.config.AngularAppSettingsInitializer}
 * @constructor
 */
os.config.SettingsInitializer = function() {
  os.config.SettingsInitializer.base(this, 'constructor');

  this.ngAppSelector = '#ng-app';
  this.ngAppModule = 'os';
  this.namespace = [os.config.coreNs, os.config.appNs];
  this.fileUri = this.fileUri || os.SETTINGS;
};
goog.inherits(os.config.SettingsInitializer, os.ui.config.AngularAppSettingsInitializer);


/**
 * @inheritDoc
 */
os.config.SettingsInitializer.prototype.registerStorages = function() {
  var settingsRegistry = os.settings.getStorageRegistry();

  // register all available storages from which to load settings
  settingsRegistry.addStorage(new os.config.storage.SettingsFile(/** @type {!string} */ (this.fileUri)));
  if (this.overridesUri) {
    settingsRegistry.addStorage(new os.config.storage.SettingsFile(this.overridesUri));
  }
  settingsRegistry.addStorage(new os.config.storage.SettingsLocalStorage('opensphere', this.namespace));
  settingsRegistry.addStorage(new os.config.storage.SettingsIDBStorage(this.namespace));
};
